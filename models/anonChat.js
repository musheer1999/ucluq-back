const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const anonChatSchema = new Schema({
  name: {
    type: String,
  },
  phoneNo: {
    type: String,
  },
  chat: [
    {
      type: {
        type: String,
      },
      msg: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  newMsgAlert: {
    type: Boolean,
    default: false,
  },
});

module.exports = anonChat = mongoose.model("anonChats", anonChatSchema);
