const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const routes = require("./routes/routes");

dotenv.config(); 

const app = express();
app.use(express.json());
app.use(cors());


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(routes);

const server = http.createServer(app);  
const io = socketIo(server, {          
  cors: {
    origin: "*",  
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  
  socket.on('newMarker', (markerData) => {
    io.emit('markerAdded', markerData);  
  });

  socket.on('newZone', (zoneData) => {
    io.emit('zoneAdded', zoneData);  
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {  
  console.log(`Server is running on port ${PORT}`);
});
