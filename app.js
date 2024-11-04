const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const multer = require('multer')


 const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
       cb(null, 'images')
    },
    filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        cb(null, `${timestamp}-${file.originalname}`);
    }
 })

 const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const app = express()
const feedRouter = require('./routes/feed')
const authRouter = require('./routes/auth')

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next()
})

app.use(express.json())
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))


app.use('/feed', feedRouter)
app.use('/auth', authRouter)

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message
    const data = error.data
    res.status(status).json({message: message, data: data})
})

mongoose.connect('mongodb+srv://samlekchris:Xj7j8PGOj9YdG3Id@first-project.y8uqnxq.mongodb.net/blog?retryWrites=true&w=majority&appName=first-project').then(() => {
    console.log('Successfully connected to the database')
    const server = app.listen(8080)
    const io = require('./socket').init(server);
    io.on('connection', socket => {
      console.log('Client connected')
    });
})
.catch(err => {
    console.log(err)
})