const express = require("express");
const router = express.Router();
const Product = require("../models/Products");
const Category = require("../models/category");
const passport = require("passport");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const adminId = "5ecfee89a3980b4c8605df52";

router.post(
  "/seller/status/:orderid",
  passport.authenticate("user-strategy", { session: false }),
  (req, res) => {
    Order.findById(req.params.orderid)
      .then((order) => {
        if (!order) {
          return res.status(404).json("order not found");
        }
        order.status = req.body.status;
        order.save();
        User.findById(order.buyer).then((user) => {
          const notif = new Notification({
            message: "Your order's status: " + order.status,
            userID: user.id,
            messageurl: "/dashboard/yourOrders",
          });
          notif.save();
          user.notifications.unshift({ notifId: notif.id });
          user.save();
        });
        return res.status(200).json(order);
      })
      .catch((err) => res.json(err));
  }
);

// ??
router.post(
  "/order/ready/:orderid",
  passport.authenticate("user-strategy", { session: false }),
  (req, res) => {
    Admin.findById(adminId).then((admin) => {
      admin.orders.unshift({
        order: req.params.orderid,
      });
      admin
        .save()
        .then((element) => {
          return res.status(200).json(element);
        })
        .catch((err) => res.json(err));
    });
  }
);

router.get(
  "/getallorders",
  passport.authenticate("user-strategy", { session: false }),
  (req, res) => {
    Order.find({ buyer: req.user.id })
      .then((items) => {
        return res.status(200).json(items);
      })
      .catch((err) => res.json(err));
  }
);

router.get("/view/:id", (req, res) => {
  Order.findById(req.params.id).then((order) => {
    if (order) {
      User.findById(order.seller).then((seller) => {
        const sellerAddress={
         hno:seller.address[0].hno,
         line1:seller.address[0].line1,
         city:seller.address[0].city,
         state:seller.address[0].state,
        }
        return res.status(200).json({order:order,sellerAddress:sellerAddress});
      })
      .catch((err) => res.json(err));
    }
     //return res.status(404).json("order not found");
  })
  .catch((err) => res.json(err));
});

module.exports = router;
