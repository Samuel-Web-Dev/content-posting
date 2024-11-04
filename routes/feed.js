const express = require('express')
const { body } = require('express-validator/check')

const routes = express.Router()
const feedController = require('../controller/feed')
const isAuth = require('../middleware/is-auth')

routes.get('/posts', isAuth, feedController.getPosts) 

routes.post('/posts', isAuth, [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
], feedController.createPosts) 

routes.get('/post/:postId', isAuth, feedController.getPost)

routes.put('/post/:postId', isAuth, [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
], feedController.updatePost)


routes.delete('/post/:postId', isAuth, feedController.deletePost)

module.exports = routes