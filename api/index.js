require('dotenv').config();
const express = require('express');
const cors = require("cors");
const morgan = require("morgan");
const monk = require("monk");

const db = require("./db/connection");
const auth = require('./auth');
const middlewares = require("./auth/middleware");
const assets = require("./assets");

const app = express();
const users = db.get("users");
const workouts = db.get("workouts");
app.use(morgan('tiny'));

const allowedOrigins = ['http://127.0.0.1', "https://training-app-frontend.vercel.app"]; const options = { allowedOrigins };
app.use(cors(options));
app.use(express.json());
app.use(middlewares.checkTokenSetUser);

app.use("/auth", auth);

app.get('/hallo', (req, res) => {
  res.send('Application works!');
});

app.use(middlewares.isLoggedIn);

app.get('/', (req, res) => {
  res.send('Authorized!');
});

app.get("/teams/:id", (req, res) => {
  let teamId = parseInt(req.params.id);
  users.find({
    team: teamId
  }, "username").then(fUsers => {
    res.send(fUsers);
  })
});

app.use("/assets", assets);

// admin space
app.use(middlewares.isAdmin);

app.get("/user/:id", async (req, res, next) => {
  let user = await users.findOne({
    _id: req.params.id,
  }, "username").then(fUser => {
    return fUser;
  });
  let workoutList = await workouts.find({
    userId: monk.id(req.params.id),
  }).then(fUserExer => {
    return fUserExer;
  })
  const response = {
    user: user,
    workouts: workoutList,
  };
  res.send(response);
});

// Error handling
app.use((error, req, res, next) => {
  console.log(error.message);
  res.status(res.statusCode || 500);
  res.json({
      message: error.message
  });
});

app.listen(3000, () => {
  console.log('Application started on port 3000!');
});

module.exports = app;