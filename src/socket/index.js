const port = process.env.SOCKET_PORT | 1337;
const io = require('socket.io')(port, {
    cors: {
      origin: '*',
      methods: ["GET", "POST"]
    }
});

// run background system
require("./distributionSystem")(io.of("/"));

console.log('🛰  Bonk doge Socket.io listen on ' + port);

io.of("/").on("connection", (socket) => {
    console.log('new client ' + socket.id);
    require('./events/game')(socket);
    require('./events/playerQueue')(socket);
});
