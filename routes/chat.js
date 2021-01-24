const express = require("express");
const passport = require("passport");

const User = require("../models/User");
const Chat = require("../models/chat");

var alluser = new Map(); // socket id -> user id

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("enableroom", async (data) => {
      let user = await User.findOne({ phoneNo: data.phoneNo });
      socket.join(user._id);
      let userChat = await Chat.findOne({ userid: user._id });
      alluser.set(socket.id, user._id);
      let resChat = [];
      if (userChat) {
        resChat = userChat.chat;
      } else {
        let newchat = new Chat({
          userid: user._id,
          name: user.name,
          chat: [],
        });
        newchat.save();
      }
      io.in(user._id).emit("initialDet", resChat);
    });

    socket.on("sendmsg", async (data) => {
      let userChat = await Chat.findOne({ userid: alluser.get(socket.id) });
      if (userChat) {
        userChat.chat.push({
          msg: data.msg,
          type: userChat.name,
        });
        // userChat.newMsgAlert = true
      }
      let resChat = [];
      resChat = userChat.chat;
      userChat.save();
      io.in(alluser.get(socket.id)).emit("getmsgadmin", resChat);
      io.in(alluser.get(socket.id)).emit("getmsg", resChat);
    });

    socket.on("enterroom", async (data) => {
      console.log("from chat route:", data);
      let id = data.id;
      alluser.set(socket.id, id);
      socket.join(id);
      let userChat = await Chat.findOne({ userid: id });
      if (userChat)
        io.in(alluser.get(socket.id)).emit("getchat", userChat.chat);
    });

    socket.on("sendmsgadmin", async (data) => {
      let userChat = await Chat.findOne({ userid: alluser.get(socket.id) });
      if (userChat) {
        userChat.chat.push({
          msg: data.msg,
          type: "admin",
        });
        // userChat.newMsgAlert = true
      }
      let resChat = [];
      resChat = userChat.chat;
      userChat.save();
      io.in(alluser.get(socket.id)).emit("getmsgadmin", resChat);
      io.in(alluser.get(socket.id)).emit("getmsg", resChat);
    });
  });
};
