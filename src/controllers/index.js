class MessageController {
    constructor(messagingService) {
        this.messagingService = messagingService;
    }

    async sendMessage(req, res) {
        try {
            const { senderId, receiverId, content } = req.body;
            const message = await this.messagingService.createMessage(senderId, receiverId, content);
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ error: 'Failed to send message' });
        }
    }

    async getMessages(req, res) {
        try {
            const { userId } = req.params;
            const messages = await this.messagingService.fetchMessages(userId);
            res.status(200).json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve messages' });
        }
    }
}

module.exports = MessageController;