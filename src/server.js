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
const userExercises = db.get("userExercises");
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

app.use("/assets", assets);

// admin space
app.use(middlewares.isAdmin);

app.get("/user/:id", async (req, res, next) => {
  let user = await users.findOne({
    _id: req.params.id,
  }, "username").then(fUser => {
    return fUser;
  });
  let exercises = await userExercises.find({
    userId: monk.id(req.params.id),
  }).then(fUserExer => {
    return fUserExer;
  })
  const response = {
    user: user,
    exercises: exercises,
  };
  res.send(response);
});

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