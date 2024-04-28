const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes/routes');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb+srv://kesaad:1234@saadclust.2vh4e3z.mongodb.net/safezone_db?retryWrites=true&w=majority&appName=saadClust", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(routes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
