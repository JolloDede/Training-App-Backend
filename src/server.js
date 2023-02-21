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

router.post("/user/exercises", (req, res, next) => {
  if (!exercisesExists([req.body.params.exerciseId])) {
      const error = new Error("An exercise does not exist");
      res.status(404);
      next(error);
      return;
  }
  const newUserExercise = {
      exerciseId: req.body.params.exerciseId,
      userId: req.user._id,
      repetitions: req.body.params.repetitions,
  };
  userExercises.insert(newUserExercise)
      .then(insertedExercise => {
          res.send(insertedExercise);
      })
});

router.delete("/user/exercises/:id", (req, res, next) => {
  userExercises.findOneAndDelete({
      _id: req.params.id,
  }).then((exercise) => {
      if (!exercise) {
          const error = new Error("Can not delete a exercise that does not exist!");
          res.status(404);
          next(error);
          return;
      }
      res.send(exercise);
  })
});

// admin space
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