const { validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  bcrypt
    .hash(password, 12)
    .then((hashPassword) => {
      const user = new User({
        email: email,
        password: hashPassword,
        name: name,
      });
      return user.save();
    })
    .then((result) => {
      res
        .status(201)
        .json({ message: "Account Created Successfully", userId: result._id });
    })
    .catch((err) => {
      console.log("Error Occured on server", err.message);
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  return User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("User with this email could not be found");
        error.statusCode = 401;
        throw error;
      }

      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((doMatch) => {
      if (!doMatch) {
        const error = new Error("Wrong Password");
        error.statusCode = 401;
        throw error;
      }

      const token = jwt.sign(
        { email: loadedUser.email, userId: loadedUser._id.toString() },
        "someimportantsecret",
        { expiresIn: "1h" }
      );
       res.status(200).json({token: token, userId: loadedUser._id.toString()})
       return;
    })
    .catch((err) => {
      console.error(err)
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
      return err;
    });
};


exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if(!user) {
      const error = new Error('User not found');
      error.statusCode = 404
      throw error;
    }
    res.status(200).json({ status: user.status });
  } catch (err) {
    if(!error.statusCode) {
      err.statusCode = 500;
    }
    next(err)
   }
}