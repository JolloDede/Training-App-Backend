require('dotenv').config();
const express = require('express');
const cors = require("cors");
const morgan = require("morgan");

const db = require("./db/connection");
const auth = require('./auth');
const middlewares = require("./auth/middleware");
const assets = require("./assets");

const app = express();
const users = db.get("users")
app.use(morgan('tiny'));

const allowedOrigins = ['http://127.0.0.1:5173']; const options = { allowedOrigins };
app.use(cors(options));
app.use(express.json());
app.use(middlewares.checkTokenSetUser);

app.use("/auth", auth);

app.use(middlewares.isLoggedIn);

app.get('/', (req, res) => {
  res.send('Application works!');
});

app.get("/teams/:id", (req, res) => {
  let teamId = parseInt(req.params.id);
  users.find({
    team: teamId
  }, "username").then(fUsers => {
    res.send(fUsers);
  })
});

app.use(middlewares.isAdmin);

app.use("/assets", assets);

// Error handling
app.use((error, req, res, next) => {
  res.status(res.statusCode || 500);
  res.json({
      message: error.message
  });
});

app.listen(3000, () => {
  console.log('Application started on port 3000!');
});