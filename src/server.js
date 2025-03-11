const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // Import the uuid library
const sequelize = require('./database');
const Message = require('./models/message'); // Import the Message model
const User = require('./models/user'); // Import the User model
const MessagingService = require('./services/messagingService');
const { setRoutes } = require('./routes/index');
const moment = require('moment-timezone');
const momentJalaali = require('moment-jalaali');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const messagingService = new MessagingService();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database connection
sequelize.authenticate()
    .then(() => {
        console.log('MySQL connected');
        return sequelize.sync();
    })
    .then(() => {
        console.log('Database synchronized');
    })
    .catch(err => console.error('MySQL connection error:', err));

// Set up routes
setRoutes(app);

const clients = new Map();

wss.on('connection', (ws) => {
    console.log('a user connected');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'register') {
                // Register the user
                const { username } = data;
                clients.set(ws, username);
                console.log(`User registered: ${username}`);
                return;
            }

            const { conversationId, senderId, receiverId, content, id } = data;

            // Find the existing conversation or create a new one
            let conversation = await Message.findOne({ where: { conversationId } });
            if (!conversation) {
                conversation = await Message.create({ conversationId, receiverId, messages: [] });
            }

            if (data.type === 'message') {
                // Append the new message to the existing messages
                const newMessage = {
                    id: uuidv4(), // Generate a UUID for the new message
                    sender: senderId,
                    text: content,
                    timestamp: momentJalaali().tz('Asia/Tehran').format('jYYYY/jM/jD HH:mm:ss')
                };

                if (conversationId.match(senderId) !== null) {
                    conversation.receiverId = receiverId;
                }
                const updatedMessages = [...conversation.messages, newMessage];
                conversation.messages = updatedMessages;
                await conversation.save();

                // Broadcast the new message to specific clients
                wss.clients.forEach(client => {
                    const username = clients.get(client);
                    if (client.readyState === WebSocket.OPEN && (receiverId.includes(username) || username === senderId)) {
                        client.send(JSON.stringify({ message: newMessage, receiverId: receiverId, id: conversationId }));
                    }
                });
            } else if (data.type === 'delete') {
                // Delete the message
                conversation.messages = conversation.messages.filter(msg => msg.id !== id);
                await conversation.save();
                const allUsers = [...receiverId, senderId];
                // Remove the message ID from seen_message of each receiver
                for (const username of allUsers) {
                    let user = await User.findOne({ where: { username } });
                    if (user && user.data && user.data.seen_message) {
                        user.data.seen_message = user.data.seen_message.filter(msgId => msgId !== id);
                        await user.save();
                    }
                }

                // Broadcast the updated messages to specific clients
                wss.clients.forEach(client => {
                    const username = clients.get(client);
                    if (client.readyState === WebSocket.OPEN && receiverId.includes(username)) {
                        client.send(JSON.stringify({ message: id, type: "delete" }));
                    }
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('user disconnected');
        clients.delete(ws);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});