const express = require("express");
const monk = require("monk");

const db = require("../db/connection");
const middlewares = require("../auth/middleware");

const router = express.Router();
const userExercises = db.get("userExercises");
const exercises = db.get("exercises");
const muscles = db.get("muscles");

async function musclesExist(muscleIds) {
    for (let i = 0; i < muscleIds.length - 1; i++) {
        await muscles.findOne({
            _id: muscleIds[i],
        }).catch(() => {
            return false;
        })
    }
    return true;
}

async function exercisesExists(exerciseIds) {
    for (let i = 0; i < exerciseIds.length - 1; i++) {
        await exercises.findOne({
            _id: exerciseIds[i],
        }).catch(() => {
            return false;
        })
    }
    return true;
}

// User exercises
router.get("/user/exercises", (req, res, next) => {
    userExercises.find({
        userId: monk.id(req.user._id),
    }).then(fExercises => {
            res.send(fExercises);
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
        exerciseId: monk.id(req.body.params.exerciseId),
        userId: monk.id(req.body.params.userId || req.user._id),
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

// get not admin
router.get("/exercises", (req, res, next) => {
    exercises.find()
        .then(fExercises => {
            res.send(fExercises);
        })
});

router.get("/muscles", (req, res, next) => {
    muscles.find()
        .then(fMuscles => {
            res.send(fMuscles);
        })
});

// admin part
router.use(middlewares.isAdmin);

// Exercises
router.post("/exercises", (req, res, next) => {
    exercises.findOne({
        name: req.body.params.name,
    }).then(exercise => {
        if (exercise) {
            const error = new Error("That exercise is already exists.");
            res.status(403);
            next(error);
            return;
        }
        if (!musclesExist(req.body.params.muscles.map(muscleUsage => muscleUsage.muscle._id))) {
            const error = new Error("A muscle does not exist");
            res.status(404);
            next(error);
            return;
        }
        const newExercise = {
            name: req.body.params.name,
            muscles: req.body.params.muscles.map(muscleUsage => ({ muscle: { _id: muscleUsage.muscle._id, name: muscleUsage.muscle.name }, percent: muscleUsage.percent })),
        };
        exercises.insert(newExercise)
            .then(insertedExercise => {
                res.send(insertedExercise);
            })
    })
});

router.delete("/exercises/:id", (req, res, next) => {
    userExercises.find({
        exerciseId: monk.id(req.params.id),
    }).then(userExercise => {
        if (userExercise.length != 0) {
            const error = new Error("Can not delete a exercise that exists in userexercise!");
            res.status(403);
            next(error);
            return;
        }
        exercises.findOneAndDelete({
            _id: req.params.id,
        }).then((exercise) => {
            if (!exercise) {
                const error = new Error("Can not delete a exercise that does not exist!");
                res.status(404);
                next(error);
                return;
            }
            res.send(exercise)
        })
    })
});

// Muscles
router.post("/muscles", (req, res, next) => {
    muscles.findOne({
        name: req.body.params.name,
    }).then(muscle => {
        if (muscle) {
            const error = new Error("That muscle is already exists. Please try anotherone.");
            res.status(403);
            next(error);
            return;
        }
        const newMuscle = {
            name: req.body.params.name
        };
        muscles.insert(newMuscle)
            .then(insertedMuscle => {
                res.send(insertedMuscle);
            })
    })
});

router.delete("/muscles/:id", (req, res, next) => {
    exercises.find({
        "muscles.muscle._id": { $eq: monk.id(req.params.id) }
    }).then(exercise => {
        if (exercise.length != 0) {
            const error = new Error("Can not delete a muscle that exists in a exercise!");
            res.status(403);
            next(error);
            return;
        }
        muscles.findOneAndDelete({
            _id: req.params.id,
        }).then((muscle) => {
            if (!muscle) {
                const error = new Error("Can not delete a muscle that does not exist!");
                res.status(404);
                next(error);
                return;
            }
            res.send(muscle)
        })
    })
});

module.exports = router;