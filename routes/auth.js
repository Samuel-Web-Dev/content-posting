const express = require("express");
const { body } = require("express-validator/check");

const authController = require("../controller/auth");
const User = require("../models/user");
const isAuth = require('../middleware/is-auth')

const routes = express.Router();

routes.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please Enter a valid email address")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email address already exist!");
          }
        })
      })
      .normalizeEmail(),
      body('password').trim().isLength({ min: 5 }),
      body('name').trim().not().isEmpty()
  ],
  authController.signup
);

routes.post('/login', authController.login)

module.exports = routes;
