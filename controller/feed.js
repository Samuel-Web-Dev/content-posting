const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator/check");
const Post = require("../models/post");
const User = require('../models/user')
const io = require('../socket');
const user = require("../models/user");

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((posts) => {
      res.status(200).json({ message: "Fetched post successfully", totalItems: totalItems, posts: posts });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.createPosts = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data in Incorrect");
    error.status = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error("Validation failed, Image required");
    error.status = 422;
    throw error;
  }

  const image = req.file.path;
  const content = req.body.content;
  const title = req.body.title;
  let creator;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: image,
    creator: req.userId
  });
  post
    .save()
    .then((result) => {
      return User.findById(req.userId)
    })
    .then((user) => {
      creator = user
      user.posts.push(post)
      return user.save()
    }).then(UserResult => {
      console.log(UserResult)
      io.getIO().emit('posts', { action: 'create', post: {...post._doc, creator: { _id: req.userId, name: UserResult.name }} })
      res.json({
        message: "Post created successfully",
        post: post,
        creator: { _id: creator._id, name: creator.name }
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("post fetch failed");
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({ message: "Post Fetched", post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data in Incorrect");
    error.status = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error("No file picked");
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId).populate('creator')
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 500;
        throw error;
      }

      if(post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error('NOt Authorized')
        error.statusCode = 403
        throw error
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      (post.title = title), (post.imageUrl = imageUrl);
      post.content = content;
      return post.save();
    })
    .then((result) => {
      io.getIO().emit('posts', { action: 'update', post: result })
      res.status(200).json({ message: "Post Updated", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 500;
        throw error;
      }

      if(post.creator.toString() !== req.userId.toString()) {
        const error = new Error('NOt Authorized')
        error.statusCode = 403
        throw error
      }


      clearImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((result) => {
      return User.findById(req.userId)
    }).then(user => {
      user.posts.pull(postId)
      return user.save()
    }).then((result) => {
      io.getIO().emit('posts', { action: 'delete', post: postId })
      res.status(200).json({ message: "Deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
