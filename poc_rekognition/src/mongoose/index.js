const mongoose = require('mongoose');
const rekognition = require('./rekognition').rekognition;

mongoose.connect(process.env.MONGO_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 2400000,
});

mongoose.Promise = global.Promise;

export {
    rekognition
}