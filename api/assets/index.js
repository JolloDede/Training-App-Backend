const express = require("express");
const monk = require("monk");

const db = require("../db/connection");
const middlewares = require("../auth/middleware");

const router = express.Router();
const workouts = db.get("workouts");
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

// workouts
router.get("/user/workouts", (req, res, next) => {
    workouts.find({
        userId: monk.id(req.user._id),
    }).then(fWorkout => {
        res.send(fWorkout);
    })
});

router.post("/user/workouts", (req, res, next) => {
    if (!exercisesExists(req.body.params.exercises)) {
        const error = new Error("An exercise does not exist");
        res.status(404);
        next(error);
        return;
    }
    const newWorkout = {
        name: req.body.params.name,
        userId: monk.id(req.body.params.userId || req.user._id),
        exercises: req.body.params.exercises,
    };
    workouts.insert(newWorkout)
        .then(insertedExercise => {
            res.send(insertedExercise);
        })
});

router.delete("/user/workouts/:id", (req, res, next) => {
    workouts.findOneAndDelete({
        _id: req.params.id,
    }).then((workout) => {
        if (!workout) {
            const error = new Error("Can not delete a exercise that does not exist!");
            res.status(404);
            next(error);
            return;
        }
        res.send(workout);
    })
});

router.put("/user/workouts", (req, res, next) => {
    // that mongodb recognices as objectid
    req.body.params.userId ? req.body.params.userId = monk.id(req.body.params.userId) : req.body.params.userId = req.user._id;
    workouts.findOneAndUpdate(
        { _id: monk.id(req.body.params._id) },
        { $set: req.body.params })
        .then(insertedWorkout => {
            if (!insertedWorkout) {
                const error = new Error("Can not update a Workout that does not exist!");
                res.status(404);
                next(error);
                return;
            }
            res.send(insertedWorkout);
        })
})

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
        if (!musclesExist(req.body.params.muscles.map(muscleUsage => muscleUsage.muscleId))) {
            const error = new Error("A muscle does not exist");
            res.status(404);
            next(error);
            return;
        }
        const newExercise = {
            name: req.body.params.name,
            muscles: req.body.params.muscles,
        };
        exercises.insert(newExercise)
            .then(insertedExercise => {
                res.send(insertedExercise);
            })
    })
});

router.delete("/exercises/:id", (req, res, next) => {
    workouts.find({
        // exerciseId: req.params.id,
        // "muscles.muscleId": { $eq: req.params.id }
        "exercises.exerciseId": { $eq: req.params.id },
    }).then(workout => {
        if (workout.length != 0) {
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

router.put("/exercises", (req, res, next) => {
    exercises.findOneAndUpdate(
        { _id: monk.id(req.body.params._id) },
        { $set: req.body.params })
        .then(insertedExercise => {
            if (!insertedExercise) {
                const error = new Error("Can not update a Exercise that does not exist!");
                res.status(404);
                next(error);
                return;
            }
            res.send(insertedExercise);
        })
})

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
        "muscles.muscleId": { $eq: req.params.id }
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

router.put("/muscles", (req, res, next) => {
    muscles.findOneAndUpdate(
        { _id: req.body.params._id },
        { $set: req.body.params })
        .then(insertedMuscle => {
            if (!insertedMuscle) {
                const error = new Error("Can not update a Workout that does not exist!");
                res.status(404);
                next(error);
                return;
            }
            res.send(insertedMuscle);
        })
})

module.exports = router;