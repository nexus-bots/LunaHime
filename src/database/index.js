const mongoose = require('mongoose');
const config = require('../config');

module.exports = {
    connect: async () => {
        try {
            await mongoose.connect(config.mongodbUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }
};
