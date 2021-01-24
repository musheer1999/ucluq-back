const express = require("express");
const passport = require("passport");

const anonChat = require("../models/anonChat");

var alluser = new Map(); // socket id -> user id

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("enableroom", async (data) => {
      console.log("data in enableroom socket: ", data);
      let { name, phoneNo } = data;
      socket.join(phoneNo);
      let userChat = await anonChat.findOne({ phoneNo: phoneNo });
      alluser.set(socket.id, phoneNo);
      console.log(alluser);
      let resChat = [];
      if (userChat) {
        resChat = userChat.chat;
      } else {
        let newchat = new anonChat({
          phoneNo: phoneNo,
          name: name,
          chat: [],
        });
        newchat.save();
      }
      io.in(phoneNo).emit("initialDet", resChat);
    });
    socket.on("sendmsg", async (data) => {
      let { phoneNo, msg } = data;

      let userChat = await anonChat.findOne({ phoneNo: phoneNo });
      if (userChat) {
        userChat.chat.push({
          msg: msg,
          type: userChat.name,
        });
        userChat.save();
        console.log("i get triggered.!");
        // userChat.newMsgAlert = true
      }
      console.log("userChat:---- ", userChat);
      let resChat = [];
      resChat = userChat.chat;
      io.in(alluser.get(socket.id)).emit("getmsgadmin", userChat.chat);
      io.in(alluser.get(socket.id)).emit("getmsg", userChat.chat);
    });

    // you left here
    socket.on("enterroom", async (data) => {
      console.log("admin connected to anon room");
      let { phoneNo } = data;
      alluser.set(socket.id, phoneNo);
      socket.join(phoneNo);
      let userChat = await anonChat.findOne({ phoneNo: phoneNo });
      if (userChat)
        io.in(alluser.get(socket.id)).emit("getchat", userChat.chat);
    });

    socket.on("sendmsgadmin", async (data) => {
      let { phoneNo } = data;
      console.log(phoneNo);
      // let userChat = await anonChat.findOne({ phoneNo });
      // if (userChat) {
      //   userChat.chat.push({
      //     msg: data.msg,
      //     type: "admin",
      //   });
      //   userChat.save();
      //   // userChat.newMsgAlert = true
      // }
      // // let resChat = [];
      // // resChat = userChat.chat
      // io.in(alluser.get(socket.id)).emit("getmsgadmin", userChat.chat);
      // io.in(alluser.get(socket.id)).emit("getmsg", userChat.chat);
      anonChat
        .findOne({ phoneNo: phoneNo })
        .exec()
        .then((userChat) => {
          console.log(userChat);
          userChat.chat.push({
            msg: data.msg,
            type: "admin",
          });
          userChat.save();
          io.in(alluser.get(socket.id)).emit("getmsgadmin", userChat.chat);
          io.in(alluser.get(socket.id)).emit("getmsg", userChat.chat);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  });
};
