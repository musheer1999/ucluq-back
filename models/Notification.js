const Schema = require("mongoose").Schema;

const NotificationSchema = new Schema({
  message: {
    type: String,
    required: true,
  },
  messageurl: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  userID: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  // image: {
  //   type: String,
  // },
  // icon: {
  //   type: String,
  //   required: true,
  // },
});

module.exports = Notification = require("mongoose").model(
  "Notification",
  NotificationSchema
);
