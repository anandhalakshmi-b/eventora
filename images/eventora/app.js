// SHARED FILE - owned by one teammate. Other members only add their own route line.
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // css, js, uploads

app.use('/', require('./routes/index'));

// Home page (placeholder - the Home module owner replaces pages/home.html)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'home.html')));

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventora')
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Eventora running at http://localhost:${port}`));
  })
  .catch((err) => console.error('MongoDB connection failed:', err.message));
