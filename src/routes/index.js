const express = require('express');
const MessageController = require('../controllers/index');

const router = express.Router();
const messageController = new MessageController();

function setRoutes(app) {
    app.use('/api/messages', router);
    
    router.post('/', messageController.sendMessage.bind(messageController));
    router.get('/', messageController.getMessages.bind(messageController));
}

module.exports = { setRoutes };