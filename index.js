const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const routes = require("./routes/routes");

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(express.json());
app.use(cors());

// Set up mongoose connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(routes);

const server = http.createServer(app);  // Create an HTTP server instance
const io = socketIo(server, {          // Create a new Socket.IO instance attached to the server
  cors: {
    origin: "*",  // Allow all origins (adjust in production)
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Example listeners for mobile app events
  socket.on('newMarker', (markerData) => {
    io.emit('markerAdded', markerData);  // Emit to all connected clients
  });

  socket.on('newZone', (zoneData) => {
    io.emit('zoneAdded', zoneData);  // Emit to all connected clients
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {  // Use server to listen instead of app
  console.log(`Server is running on port ${PORT}`);
});
