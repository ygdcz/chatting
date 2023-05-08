const express = require("express");
const { Server } = require("socket.io");

const app = express();
const io = new Server(3000, {
    cors: {
        origin: ["http://localhost:8080"]
    }
});

const userList = [];

io.on("connection", (socket) => {
    const username = socket.handshake.query.username;
    if (!username) return;
    /**
     * {
     *     username: "",
     *     id: ""
     * }
     */
    const userInfo = userList.find(user => user.username === username);
    if (userInfo) {
        userInfo.id = socket.id;
    } else {
        userList.push({
            id: socket.id,
            username
        });
    }
    io.emit("online", {
        userList
    });
    socket.on("send", ({fromUsername, targetId, msg}) => {
        const targetSocket = io.sockets.sockets.get(targetId);
        const toUser = userList.find(user => user.id === targetId);
        console.log(targetSocket);
        if (targetSocket) {
            targetSocket.emit("receive", {
                fromUsername,
                toUsername: toUser.username,
                msg,
                dateTime: Date.now()
            })
        }
    })
})

app.listen(8000, () => {
    console.log("listening at port 8000");
});