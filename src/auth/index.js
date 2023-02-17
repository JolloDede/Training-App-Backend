const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db/connection");
const bcrypt = require("bcrypt");

const router = express.Router();
const users = db.get("users");

function createTokenSendResponse(user, res, next) {
    const payload = {
        id: user.id,
        username: user.username,
    };

    jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: "7d",
    }, (err, token) => {
        if (err) {
            console.log("Beo");
            respondError422(res, next);
        } else {
            res.json({
                token: token,
                user: { name: user.username, group: user.group, team: user.team }
            });
        }
    });
}

function respondError422(res, next) {
    res.status(422);
    const error = new Error('Unable to login.');
    next(error);
}

router.post("/login", (req, res, next) => {
    users.findOne({
        username: req.body.params.username,
    }).then(user => {
        if (user) {
            bcrypt.compare(req.body.params.password, user.password).then((result) => {
                if (result) {
                    createTokenSendResponse(user, res, next);
                }else {
                    respondError422(res, next);
                }
            });
        }else {
            respondError422(res, next);
        }
    });
});

router.post("/signup", (req, res, next) => {
    const username = req.body.params.username;
    users.findOne({
        username: username,
    }).then(user => {
        if (user) {
            const error = new Error("That username is already taken. Please try anotherone.");
            res.status(409);
            next(error);
        }else {
            bcrypt.hash(req.body.params.password.trim(), 12).then(hashedPassword => {
                const newUser = {
                    username: username,
                    group: 0,
                    password: hashedPassword,
                    team: [0],
                };
                users.insert(newUser).then(insertedUser => {
                    createTokenSendResponse(insertedUser, res, next);
                })
            });
        }
    })
})

module.exports = router;