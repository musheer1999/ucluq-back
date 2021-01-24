const router = require("express").Router();
const _ = require("lodash");
const Admin = require("../models/Admin");
const Product = require("../models/Products");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const keys = require("../config/keys");
const Chat = require("../models/chat");
const anonChat = require("../models/anonChat");
const Order = require("../models/Order");
const Notification = require("../models/Notification");

//for testing purpose
router.get("/test", (req, res) => {
  return res.status(200).json("admin route works");
});

//admin register route
router.post("/register", (req, res) => {
  Admin.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      errors.email = "Email already exists";
      return res.status(400).json(errors);
    } else {
      const newUser = new Admin({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          //if (err) throw err;
          newUser.password = hash;
          const response = {
            success: true,
            user: newUser,
          };
          newUser
            .save()
            .then((user) => res.json(response))
            .catch((err) => console.log(err));
        });
      });
    }
  });
});

//admin login
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  Admin.findOne({ email }).then((user) => {
    if (!user) {
      errors.email = "Email does not exist";
      const response = {
        id: user.id,
        success: false,
        errors,
      };
      return res.status(404).json(response);
    }

    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        const payload = {
          id: user.id,
          email: user.email,
          avatar: user.avatar,
        };

        jwt.sign(payload, keys.secretOrKey,{ expiresIn: '3600s' }, (err, token) => {
          res.json({
            success: true,
            userId: user.id,
            token: "Bearer " + token,
          });
        });
      } else {
        const errors = {};
        errors.password = "Incorrect password";
        const response = {
          success: false,
          errors,
        };
        return res.status(400).json(response);
      }
    });
  });
});

router.get("/", (req, res) => {

  Product.find()
    .then((allProducts) => res.json(allProducts))
    .catch((err) => res.json(err));
});




//to get list of all the admins
router.get("/all", (req, res) => {
  Admin.find()
    .exec()
    .then((users) => {
      const response = {
        count: users.length,
        users: users,
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

//to view a user's all the documents
router.get(
  "/view/:id",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    User.findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404).json("user not found");
        }
        return res.status(200).json({ docs: user.docInfo });
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

//to verify a user's documents
router.post(
  "/verify/:id",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    User.findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404).json("user not found");
        }
        const doc = req.body.doc;
        user.docInfo[doc].status = "verified";
        const notif = new Notification({
          message: "your document has been verified",
          userId: user.id,
          messageUrl: "http://localhost:3000/dashboard/businessprofile",
        });
        user.isDocVerified = true;
        notif.save();
        user.notifications.unshift({ notifId: notif.id });
        user
          .save()
          .then((user) => {
            res.status(200).json({ notif });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

router.post(
  "/notverify/:id",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    User.findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404).json("user not found");
        }
        const notif = new Notification({
          message: "your documents was not accepted by the admin",
          userId: user.id,
          messageUrl: "http://localhost:3000/dashboard/profile/uploaddocs",
        });
        notif.save();
        user.notifications.unshift({ notifId: notif.id });
        user
          .save()
          .then((user) => {
            res.status(200).json({ notif });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

//to remove verify a user's documents
router.post(
  "/rmverify/:id",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    User.findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404).json("user not found");
        }
        const doc = req.body.doc;
        user.docInfo[doc].status = "";
        user
          .save()
          .then((user) => {
            res.status(200).json({ success: "true" });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

//to delete a user
router.delete(
  "/delete/:phoneNo",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    User.findOneAndRemove({ phoneNo: req.params.phoneNo })
      .then((user) => {
        res.status(200).json({ user });
      })
      .catch((error) => {
        assert.isNotOk(error, "Promise error");
        done();
      });
  }
);

router.get("/toverify", (req, res) => {
  User.find()
    .then((users) => {
      const response = {
        count: users.length,
        users: users,
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

// get all orders
router.get("/allorders", (req, res) => {
  Order.find()
    .then((orders) => {
      res.status(200).json(orders);
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

//get all chats
router.get("/getchats", async (req, res) => {
  let chat = await Chat.find({ newMsgAlert: false });
  if (chat) return res.status(200).json(chat);
  res.status(500).json({ err: "err" });
});

router.get("/anonChats", async (req, res) => {
  anonChat
    .find()
    .exec()
    .then((data) => {
      return res.status(200).json(data);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json(err);
    });
});

//route to add products by admin
router.post(
  "/addproduct",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    const newProduct = new Product({
      product_name: req.body.product_name,
      category: req.body.category,
      subcategory: req.body.subcategory,
      seller: req.user.id,
      seller_name: "Ucliq",
      qty: req.body.qty,
      price: req.body.price,
      gst: req.body.gst,
      description: req.body.description,
      discount: req.body.discount,
      images: req.body.images,
      verified:false
    });
    tp =
      newProduct.price +
      (newProduct.gst * newProduct.price) / 100 -
      (newProduct.discount * newProduct.price) / 100;
    newProduct.totalPrice = tp;
    newProduct
      .save()
      .then((item) => res.status(200).json(item))
      .catch((err) => res.status(500).json(err));
  }
);


//update product by admin
router.post(
  "/updateproduct/:id",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    Product.findByIdAndUpdate(req.params.id, req.body)
      .then(() => {
        res.status(200).json({ msg: "updated" });
      })
      .catch(() => {
        res.status(404).json({ msg: "not found" }); 
      });
  }
);

//remove product with id
router.delete(
  "/remove/:id",
  passport.authenticate("admin-strategy", { session: false }),
  async (req, res) => {
    Product.findByIdAndDelete(req.params.id)
      .then((removedProduct) => res.json(removedProduct))
      .catch((err) => res.json(err));
  }
);

//fetch seller products by number
router.get(
  "/fetch/products/:phone",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    User.find({ phoneNo: req.params.phone }).then((user) => {
      if (!user) {
        return res.status(404).json("user not found");
      }
      return res.status(200).json(user.products);
    });
  }
);


router.get(
  "/products/:product_id",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    Product.findById(req.params.product_id)
    .then((productReq) => { 
        return res.status(200).json(productReq);
    })
    .catch((err) => {
      return res.status(500).json(err);
    });
   
  }
);


//fetch new products added
router.get(
  "/newproducts",
  passport.authenticate("admin-strategy", { session: false }),
  (req, res) => {
    Admin.findById(req.user.id)
      .then((admin) => {
        return res.json(admin.productsAdded);
      })
      .catch((err) => res.json(err));
  }
);

module.exports = router;













