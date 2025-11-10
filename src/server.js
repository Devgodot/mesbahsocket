const os = require('os');
const myHostname = 'mhh83'; // نام سیستم خودتان

let dbPort = 3306;
if (os.hostname() === myHostname) {
    dbPort = 3307; // پورت تونل
    const { spawn } = require('child_process');
    // Start SSH tunnel in detached mode
    const sshTunnel = spawn('ssh', [
        '-L', '3307:127.0.0.1:3306',
        'pachim@45.138.135.82'
    ], {
        detached: true,
        stdio: 'ignore'
    });
    sshTunnel.unref();
}

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // Import the uuid library
const { Sequelize } = require('sequelize');
const config = require('../config/config.json');
const moment = require('moment-timezone');
const momentJalaali = require('moment-jalaali');

const Message = require('./models/message'); // Import the Message model
const User = require('./models/user'); // Import the User model
const MessagingService = require('./services/messagingService');
const GameData = require('./models/GameData');
const Conversation = require('./models/Conversation');
const { setRoutes } = require('./routes/index');
const UserSeenMessages = require('./models/UserSeenMessages');
const { time } = require('console');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// پورت دیتابیس را بر اساس محیط تنظیم کن
dbConfig.port = dbPort;

// سپس sequelize را با dbConfig مقداردهی کن
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
);

sequelize.models = {
    User,
    Message,
    UserSeenMessages
};

module.exports = sequelize;

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

// Endpoint to print all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll();
        console.log(users);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});

const clients = new Map();
const images = new Map();
const vscodeIcons = require('vscode-icons-js');
const getIcon = vscodeIcons.getIconForFile;
const path = require('path');
function getFileIconUrl(filename) {
    const ext = path.extname(filename).slice(1).toLowerCase(); // مثال: "jpg"
    let iconName = getIcon(filename).split("_").pop();
    if (!iconName) {
        // اگر پیدا نکرد، از آیکون پیش‌فرض استفاده کن
        return "https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/folder.svg";
    }

    // آدرس CDN رسمی vscode-icons
    return `https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/${iconName}`;
}

const sendStateUsers = async (wss, username, state) => {
    const gameData = await GameData.findOne({ where: { id: 1 } });
    const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];    
    const conversations = await Conversation.findAll({
        where: {
            [Sequelize.Op.or]: [
                { user1: username },
                { user2: username }
            ]
        }
    });
    let users = [];
    
    for(const conversation of conversations) {
        const { user1, user2 } = conversation;
        if (username === user1){
            conversation.state1 = state;
            conversation.last_seen1 = {"time": momentJalaali().tz('Asia/Tehran').format('jYYYY/jMM/jDD  HH:mm'), "timestamp": momentJalaali().tz('Asia/Tehran').valueOf()};
            users.push(user2);

        }else{
            conversation.state2 = state;
            conversation.last_seen2 = {"time": momentJalaali().tz('Asia/Tehran').format('jYYYY/jMM/jDD  HH:mm'), "timestamp": momentJalaali().tz('Asia/Tehran').valueOf()};
            users.push(user1);
        }
        await conversation.save();
    }
    wss.clients.forEach(client => {
        const clientData = clients.get(client);
        console.log(clientData);
        if (client.readyState === WebSocket.OPEN && clientData.hasOwnProperty("username") && (users.includes(clientData.username) || managements.includes(clientData.username))) {
            (async () => {
                const sender = await User.findOne({ where: { id: username } });
                if (sender) {
                    client.send(JSON.stringify({
                        user: {
                            name: sender.data.first_name + ' ' + sender.data.last_name,
                            custom_name: sender.data.custom_name,
                            icon: sender.data.icon
                        },
                        type:"status",time: momentJalaali().tz('Asia/Tehran').format('jYYYY/jMM/jDD  HH:mm'), timestamp: String(momentJalaali().tz('Asia/Tehran').valueOf()), state:state, username:username
                    }), { binary: false });
                }
            })();
        }
    });
};

wss.on('connection', (ws) => {
    console.log('a user connected');
    ws.on('message', async (message, isBinary) => {
        try {
            if(isBinary){
                if (!images.has(ws)) {
                    images.set(ws, []);
                }
                let dic = images.get(ws);
                if(!dic[0]){return;}
                
                const byte = message;
                byte.forEach(d=> {
                    dic[0]["data"].push(d);
                }
                )
                console.log(dic[0], dic[0].data.length, message.length);
                const {conversationId, senderId} = dic[0];
                
                const data = dic[0];
                (async () => {
                    const gameData = await GameData.findOne({ where: { id: 1 } });
                    const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];  
                    const user1 = conversationId.slice(0, 10);
                    const user2 = conversationId.slice(10, 20);
                    wss.clients.forEach(client => {
                        const clientData = clients.get(client);
                        console.log(clientData);
                        if (!clientData){return}
                        if (client.readyState === WebSocket.OPEN && (clientData.username === user1 || clientData.username === user2 || managements.includes(clientData.username))) {
                            client.send(JSON.stringify({file:data.file, size:data.size, type:"data", file_type:getIcon(data.file).replace("file_type_", "").replace(".svg", "")}), { binary: false })
                            client.send(byte, { binary: true });
                        }
                    });
                })();
                if (dic[0]["data"].length === dic[0]["size"]){
                    dic.shift()
                }
                images.set(ws, dic);
                return;
            }
            const data = JSON.parse(message);
            if (data.type === 'register') {
                // Register the user
                const { username} = data;
                clients.set(ws, { username });
                console.log(`User registered: ${username}`);
                sendStateUsers(wss, username, "online");
                return;
            }
            if (data.type === "download"){
                let dic = images.get(ws);
                if(!dic[data.file]){return;}
                const {conversationId} = dic[data.file];
                (async () => {
                    const gameData = await GameData.findOne({ where: { id: 1 } });
                    const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];  
                    const user1 = conversationId.slice(0, 10);
                    const user2 = conversationId.slice(10, 20);
                    wss.clients.forEach(client => {
                        const clientData = clients.get(client);
                        if (!clientData){return}
                        if (client.readyState === WebSocket.OPEN && (clientData.username === user1 || clientData.username === user2 || managements.includes(clientData.username))) {
                            client.send(JSON.stringify({url:data.url, type:"download", file:data.file, file_type:getIcon(data.file).replace("file_type_", "").replace(".svg", "")}), { binary: false });
                        }
                    });
                })();
            }
            if (data.type === "data"){
                let dic = images.get(ws);
                if(!dic[data.file]){return;}
                
                const byte = JSON.parse(data.data);
                console.log(data);
                byte.forEach(d=> {
                    dic[data.file]["data"].push(d);
                }
                )
                
                const {conversationId} = dic[data.file];
                console.log(data.index);
                const size = dic[data.file]["size"];
                (async () => {
                    const gameData = await GameData.findOne({ where: { id: 1 } });
                    const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];  
                    const user1 = conversationId.slice(0, 10);
                    const user2 = conversationId.slice(10, 20);
                    wss.clients.forEach(client => {
                        const clientData = clients.get(client);
                        if (!clientData){return}
                        if (client.readyState === WebSocket.OPEN && (clientData.username === user1 || clientData.username === user2 || managements.includes(clientData.username))) {
                            client.send(JSON.stringify({file:data.file, size, type:"data", file_type:getIcon(data.file).replace("file_type_", "").replace(".svg", ""), index:data.index}), { binary: false });
                            client.send(byte, { binary: true });
                        }
                    });
                })();
                if (dic[data.file]["data"].length === dic[data.file]["size"]){
                    delete dic[data.file]
                    
                }
                images.set(ws, dic);
                return;
            }
            let { conversationId, senderId, content} = data;
            if (data.type === 'file') {
                const {part, size} = data;
                if (!images.has(ws)) {
                    images.set(ws, {});
                }
                let dic = images.get(ws);
                let ext = "";
                
                const file_name = content["file"];
                let i = 0;
                file_name.split(".").forEach(p=>{
                    if(i !== 0){
                    ext += "."+p;
                    }
                    i += 1;
                })
                content["type"] = getIcon(file_name).replace("file_type_", "").replace(".svg", "");
                content["icon"] = getFileIconUrl(file_name);
                //content["file"] = momentJalaali().tz("Asia/Tehran").format("jYYYY/jMM/jDD_HH:mm:ss:SSS") + ext;

                dic[file_name]={data:[], senderId, conversationId, size};
                images.set(ws, dic);
                const newMessage = {
                    id: uuidv4(), // Generate a UUID for the new message
                    sender: senderId,
                    messages: content,
                    seen:String(momentJalaali().tz('Asia/Tehran').valueOf()),
                    createdAt: momentJalaali().tz('Asia/Tehran').valueOf(),
                    updatedAt: momentJalaali().tz('Asia/Tehran').valueOf(),
                    conversationId:conversationId,
                    part:part,
                    time: momentJalaali().tz('Asia/Tehran').format('jYYYY/jMM/jDD  HH:mm') + ' $' + momentJalaali().tz('Asia/Tehran').weekday()
                };
                (async () => {
                    const gameData = await GameData.findOne({ where: { id: 1 } });
                    const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];  
                    const user1 = conversationId.slice(0, 10);
                    const user2 = conversationId.slice(10, 20);
                    let sender_name;
                    const _user = await User.findOne({where : {id:senderId}});
                    if(_user === null){
                        sender_name = "کاربر حذف شده";
                    }else{
                        sender_name = _user.data.first_name + " " + _user.data.last_name;
                    }
                    wss.clients.forEach(client => {
                        const clientData = clients.get(client);
                        if (!clientData) return;
                        console.log("1");
                        if (client.readyState === WebSocket.OPEN && (clientData.username === user1 || clientData.username === user2 || managements.includes(clientData.username))) {
                            newMessage["sender_name"] = clientData.username === senderId ? "شما" : sender_name;
                            client.send(JSON.stringify({ message: newMessage, type:"file", file:file_name, size}), { binary: false });
                        }
                    });
                })();
            }
            if (data.type === 'message') {
                // Append the new message to the existing messages
                const {part, response, id} = data;
                const newMessage = {
                    id: uuidv4(), // Generate a UUID for the new message
                    sender: senderId,
                    messages: content,
                    createdAt: momentJalaali().tz('Asia/Tehran').valueOf(),
                    updatedAt: momentJalaali().tz('Asia/Tehran').valueOf(),
                    response : response,
                    conversationId:conversationId,
                    part:part,
                    time: momentJalaali().tz('Asia/Tehran').format('jYYYY/jMM/jDD  HH:mm') + ' $' + momentJalaali().tz('Asia/Tehran').weekday()
                };
                const otherUser = senderId === conversationId.slice(0, 10) ? conversationId.slice(10, 20) : conversationId.slice(0, 10)
                if (!part || part === "") {
                    return;
                }
                const conversation = await Conversation.findOne({where: {[Sequelize.Op.or]: [{ user1: senderId, user2: otherUser }, { user1: otherUser, user2: senderId }], part: part}});
                console.log(conversation)
                if (!conversation) {
                    const user1 = conversationId.slice(0, 10)
                    const user2 = conversationId.slice(10, 20)

                    const new_Conversation = await Conversation.create({user1:user1, user2:user2, part : part, conversationId:user1+user2});
                    await new_Conversation.save();
                    sendStateUsers(wss, senderId, "online");
                    (async () => {
                        const gameData = await GameData.findOne({ where: { id: 1 } });
                        const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];
                        // Notify all clients about the new conversation
                        wss.clients.forEach(client => {
                            const clientData = clients.get(client);
                            if (client.readyState === WebSocket.OPEN && (clientData.username === otherUser || managements.includes(clientData.username))) {
                                (async () => {
                                    const sender = await User.findOne({ where: { id: senderId } });
                                    if (sender) {
                                        console.log(sender.id);
                                        client.send(JSON.stringify({
                                            type: 'new',
                                            user: {
                                                username: sender.id,
                                                name: sender.data.first_name + ' ' + sender.data.last_name,
                                                custom_name: sender.data.custom_name,
                                                icon: sender.data.icon
                                            },
                                            part: part,
                                            conversationId: new_Conversation.conversationId
                                        }), { binary: false });
                                    }
                                })();
                            }
                            if (client.readyState === WebSocket.OPEN && (clientData.username === senderId)) {
                                (async () => {
                                    const sender = await User.findOne({ where: { id: otherUser } });
                                    if (sender) {
                                        console.log(sender.id);
                                        client.send(JSON.stringify({ type: 'new', user: {
                                                username: sender.id,
                                                name: sender.data.first_name + ' ' + sender.data.last_name,
                                                custom_name: sender.data.custom_name,
                                                icon: sender.data.icon
                                            },
                                            part: part ,
                                            conversationId: new_Conversation.conversationId}), { binary: false });
                                    }
                                })();
                            }
                        });
                    })();
                }
                const _message = await Message.create(newMessage);
                await _message.save();
                // Broadcast the new message to specific clients
                (async () => {
                    const gameData = await GameData.findOne({ where: { id: 1 } });
                    const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];  
                    const user1 = conversationId.slice(0, 10);
                    const user2 = conversationId.slice(10, 20);
                    let sender_name;
                    const _user = await User.findOne({where : {id:senderId}});
                    if(_user === null){
                        sender_name = "کاربر حذف شده";
                    }else{
                        sender_name = _user.data.first_name + " " + _user.data.last_name;
                    }
                    wss.clients.forEach(client => {
                        const clientData = clients.get(client);
                        if (client.readyState === WebSocket.OPEN && (clientData.username === user1 || clientData.username === user2 || managements.includes(clientData.username))) {
                            newMessage["sender_name"] = clientData.username === senderId ? "شما" : sender_name;
                            client.send(JSON.stringify({ message: newMessage, id:id, type:"message"}), { binary: false });
                        }
                    });
                })();
            } else if (data.type === 'delete') {
                const {id, part, pre_id} = data;
                const _message = await Message.findOne({where : {conversationId, id}});
                if (_message) {
                    _message.deleted = momentJalaali().tz('Asia/Tehran').valueOf();
                    await _message.save();
                }
                (async () => {
                    const gameData = await GameData.findOne({ where: { id: 1 } });
                    const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];
                    // Notify all clients about the deletion
                    wss.clients.forEach(client => {
                        const clientData = clients.get(client);
                        if (client.readyState === WebSocket.OPEN && (managements.includes(clientData.username) || conversationId.includes(clientData.username))) {
                            client.send(JSON.stringify({ message: id, pre_message:pre_id, part:part, type: "delete", "conversationId":conversationId, time:momentJalaali().tz('Asia/Tehran').valueOf()}), { binary: false }); // Send the deletion message
                        }
                    });
                })();
            } else if (data.type === "edited"){
                const {id} = data;
                const _message = await Message.findOne({where : {conversationId, id}});
                if (_message){
                    _message.messages = content;
                    _message.updatedAt = momentJalaali().tz('Asia/Tehran').valueOf();
                    _message.edited = true;
                    await _message.save();

                }
                (async () => {
                    const gameData = await GameData.findOne({ where: { id: 1 } });
                    const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];
                    let sender_name;
                    const _user = await User.findOne({where : {id:senderId}});
                    if(_user === null){
                        sender_name = "کاربر حذف شده";
                    }else{
                        sender_name = _user.data.first_name + " " + _user.data.last_name;
                    }
                    // Notify all clients about the edited message
                    wss.clients.forEach(client => {
                        const clientData = clients.get(client);
                        if (client.readyState === WebSocket.OPEN && (managements.includes(clientData.username) || conversationId.includes(clientData.username))) {
                            const editedMessage = _message.toJSON();
                            editedMessage.sender_name = clientData.username === senderId ? "شما" : sender_name;
                            client.send(JSON.stringify({ message: editedMessage, type: "edited" }), { binary: false });
                        }
                    });
                })();

            }else if (data.type === "seen"){
                (async () => {
                    const {id} = data;
                    const _message = await Message.findOne({where : {conversationId, id}});
                    const gameData = await GameData.findOne({ where: { id: 1 } });
                    let sender_name;
                    const _user = await User.findOne({where : {id:_message.sender}});
                    if(_user === null){
                        sender_name = "کاربر حذف شده";
                    }else{
                        sender_name = _user.data.first_name + " " + _user.data.last_name;
                    }
                    const managements = gameData && gameData.data ? (gameData.data["management"] || []) : [];
                    if (_message){
                        if (_message.sender !== senderId && !_message.seen && !_message.deleted && (!managements.includes(senderId) || conversationId.includes(senderId))) {
                            _message.seen = momentJalaali().tz('Asia/Tehran').valueOf();
                            await _message.save();
                        }
                    }

                    // Notify all clients about the seen message
                    wss.clients.forEach(client => {
                        const clientData = clients.get(client);
                        const seenMessage = _message.toJSON();
                        seenMessage.sender_name = sender_name;
                        if (client.readyState === WebSocket.OPEN && (managements.includes(clientData.username) || conversationId.includes(clientData.username))) {
                            client.send(JSON.stringify({ message: seenMessage, type: "seen" }), { binary: false });
                        }
                    });
                })();
            }
      
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', async () => {
        console.log('user disconnected');
        const clientData = clients.get(ws);
        const username = clientData ? clientData.username : undefined;
        clients.delete(ws);
        if (username) {
            sendStateUsers(wss, username, "offline");
        }
    });

    // Send ping messages to keep the connection alive
    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        } else {
            clearInterval(interval);
        }
    }, 30000); // Send a ping every 30 seconds
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

