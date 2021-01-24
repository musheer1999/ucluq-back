const express = require("express");
const router = express.Router();
const Product = require("../models/Products");
const Category = require("../models/category");
const passport = require("passport");
const User = require("../models/User");
const Order = require("../models/Order");
const { response } = require("express");
const { parseInt } = require("lodash");

router.get(
  "/address",
  passport.authenticate("user-strategy", {
    session: false,
  }),
  (req, res) => {
    User.findById(req.user.id).then((user) => {
      return res.status(200).json(user.address);
    });
  }
);

// router.post(
//   "/addtoseller/:id/:qty",
//   passport.authenticate("user-strategy", { session: false }),
//   (req, res) => {
//     Product.findById(req.params.id)
//       .then((product) => {
//         User.findById(product.seller)
//           .then((seller) => {
//             seller.ordersRecieved.unshift({
//               buyer: req.user.id,
//               productId: req.params.id,
//               quantity: req.params.qty,
//             });
//             seller.save();
//           })
//           .catch((err) => res.json(err));
//       })
//       .catch((err) => res.json(err));
//     return res.json("item added");
//   }
// );

router.post(
  "/address/push",
  passport.authenticate("user-strategy", { session: false }),
  (req, res) => {
    User.findById(req.user.id)
      .then((user) => {
        user.address.unshift({
          hno: req.body.hno,
          line1: req.body.line1,
          city: req.body.city,
          state: req.body.state,
        });
        user
          .save()
          .then((user) => {
            return res.json(user.address);
          })
          .catch((err) => res.json(err));
      })
      .catch((err) => res.json(err));
  }
);

router.delete(
  "/add/:id",
  passport.authenticate("user-strategy", { session: false }),
  (req, res) => {
    User.findById(req.user.id).then((user) => {
      user.address.forEach((element) => {
        if (element._id == req.params.id) {
          const index = user.address.indexOf(element);
          user.address.splice(index, 1);
          user.save().then((user) => {
            return res.json(user.address);
          });
        }
      });
    });
  }
);

// router.post(
//   "/order/push",
//   passport.authenticate("user-strategy", { session: false }),
//   (req, res) => {
//     User.findById(req.user.id).then((user) => {
//       user.orders.unshift({
//         address: req.body.address,
//         totalPrice: req.body.totalPrice,
//         modeOfPayment: req.body.modeOfPayment,
//         items: req.user.cart,
//       });
//       user.cart = [];
//       //   user
//       //     .save()
//       //     .then((user) => {
//       //       return res.json(user.orders);
//       //     })
//       //     .catch((err) => res.json(err));
//       // })
//       // .catch((err) => res.json(err));
//       user.save();
//       user.orders[0].items.forEach(function (item) {
//         Product.findById(item.productId)
//           .then((product) => {
//             User.findById(product.seller)
//               .then((seller) => {
//                 seller.ordersRecieved.unshift({
//                   address: req.body.address,
//                   totalPrice: req.body.totalPrice,
//                   modeOfPayment: req.body.modeOfPayment,
//                   buyer: user.id,
//                   productId: product.id,
//                 });
//                 seller.save();
//               })
//               .catch((err) => res.json(err));
//           })
//           .catch((err) => res.json(err));
//       });
//       return res.status(200).json("order placed!");
//     });
//   }
// );

router.post(
  "/order/push",
  passport.authenticate("user-strategy", { session: false }),
  async (req, res) => {
    const user = await User.findById(req.user.id);
    var i;
    user.bills.unshift({ bill: [] });
    for (i = 0; i < user.cart.length; i++) {
      const product = await Product.findById(user.cart[i].productId);
      var price =
        parseInt(user.cart[i].quantity) * parseInt(product.totalprice);
      const order = new Order({
        buyer: req.user.id,
        seller: product.seller,
        productId: user.cart[i].productId,
        productName: product.product_name,
        desc: product.description,
        productImg: product.images[0].image,
        sellerName: product.seller_name,
        buyerName: user.name,
        category: product.category,
        subcategory: product.subcategory,
        quantity: user.cart[i].quantity,
        address: req.body.address,
        totalPrice: price,
        modeOfPayment: req.body.modeOfPayment,
      });
      order.save();
      const notif = new Notification({
        message: "you have recieved a new order. Kindly confirm it",
        userID: order.seller,
        messageurl: "http://localhost:3000/orderReceived",
      });
      notif.save();
      const seller = await User.findById(notif.userID);
      seller.notifications.unshift({ notifId: notif.id });
      seller.save();
      user.bills[0].bill.unshift({
        order: order._id,
        productName: order.productName,
        totalPrice: order.totalPrice,
      });
    }
    user.cart = [];
    user.save();
    return res.status(200).json("oder placed");
  }
);

router.get(
  "/order/recieved",
  passport.authenticate("user-strategy", { session: false }),
  (req, res) => {
    User.findById(req.user.id)
      .then((user) => {
        Order.find({ seller: user.id })
          .then((orders) => {
            return res.status(200).json(orders);
          })
          .catch((err) => res.json(err));
      })
      .catch((err) => res.json(err));
  }
);

router.get("/order/view/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  const buyer = await User.findById(order.buyer);
  const product = await Product.findById(order.productId);
  const response = { order, buyer, product };
  return res.status(200).json(response);
});

router.get(
  "/bills",
  passport.authenticate("user-strategy", { session: false }),
  (req, res) => {
    User.findById(req.user.id).then((user) => {
      return res.status(200).json(user.bills);
    });
  }
);

router.get("/orders/view", async (req, res) => {
  var i;
  var response = [];
  console.log(req.body);
  for (i = 0; i < req.body.orders.length; i++) {
    const order = await Order.findById(req.body.orders[i]);
    response.unshift(order);
  }
  return res.status(200).json(response);
});

module.exports = router;
