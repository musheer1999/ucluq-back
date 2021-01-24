const express = require("express");
const router = express.Router();
const passport = require("passport");
const { response } = require("express");
const { parseInt } = require("lodash");
const Notification = require("../models/Notification");


router.get(
  "/getAllNotification",
  passport.authenticate("user-strategy", {
    session: false,
  }),
  async (req, res) => {
    const user = await User.findById(req.user.id);
    const response = [];
    var i;
    for (i = 0; i < user.notifications.length; i++) {
      const notif = await Notification.findById(user.notifications[i].notifId);
      response.push(notif);
    }
    //console.log(response);
    return res.status(200).json(response);
  }
);


router.get("/view/:id", (req, res) => {
  Notification.findById(req.params.id).then((notif) => {
    if (!notif) {
      return res.status(404).json("no notification exist with the above id");
    }
    return res.status(200).json(notif);
  });
});

router.post(
  "/onclick/:id",
  passport.authenticate("user-strategy", {
    session: false,
  }),
  (req, res) => {
    Notification.findById(req.params.id).then((notif) => {
      notif.isRead = true;
      notif
        .save()
        .then((notif) => {
          return res.status(200).json({ status: "changed" });
        })
        .catch((err) => {
          return res.json(err);
        });
    });
  }
);


module.exports = router;
