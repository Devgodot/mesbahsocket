const Message = require('../models/message');
const { Op } = require('sequelize');

class MessagingService {
    async createMessage(senderId, receiverId, content) {
        const message = await Message.create({
            senderId,
            receiverId,
            content
        });
        return message;
    }

    async fetchMessages(userId1, userId2) {
        return await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 }
                ]
            },
            order: [['timestamp', 'ASC']]
        });
    }
}

module.exports = MessagingService;