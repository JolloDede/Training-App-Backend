const express = require("express");
const db = require("../db/connection");

const router = express.Router();
const userExercises = db.get("userExercises");
const exercises = db.get("exercises")
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

// Exercises
router.get("/exercises", (req, res, next) => {
    exercises.find()
        .then(fExercises => {
            res.send(fExercises);
        })
});

router.post("/exercises", (req, res, next) => {
    exercises.findOne({
        name: req.body.params.name,
    }).then(exercise => {
        if (exercise) {
            const error = new Error("That exercise is already exists.");
            res.status(403);
            next(error);
        } else {
            if (!musclesExist(req.body.params.muscles)) {
                const error = new Error("A muscle does not exist");
                res.status(404);
                next(error);
                return;
            }
            const newExercise = {
                name: req.body.params.name,
                musclesUsage: { muscleId: req.body.params.muscles.map(({ _id }) => _id), percent: req.body.params.muscles.percent },
            };
            exercises.insert(newExercise)
                .then(insertedExercise => {
                    res.send(insertedExercise);
                })
        }
    })
});

// Muscles
router.get("/muscles", (req, res, next) => {
    muscles.find()
        .then(fMuscles => {
            res.send(fMuscles);
        })
});

router.post("/muscles", (req, res, next) => {
    muscles.findOne({
        name: req.body.params.name,
    }).then(muscle => {
        if (muscle) {
            const error = new Error("That muscle is already exists. Please try anotherone.");
            res.status(403);
            next(error);
        } else {
            const newMuscle = {
                name: req.body.params.name
            };
            muscles.insert(newMuscle)
                .then(insertedMuscle => {
                    res.send(insertedMuscle);
                })
        }
    })
});

// User exercises
router.get("/user/exercises", (req, res, next) => {
    userExercises.find()
        .then(fExercises => {
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
        exerciseId: req.body.params.exerciseId,
        userId: req.user._id,
        repetitions: req.body.params.repetitions,
    };
    userExercises.insert(newUserExercise)
        .then(insertedExercise => {
            res.send(insertedExercise);
        })
});

module.exports = router;