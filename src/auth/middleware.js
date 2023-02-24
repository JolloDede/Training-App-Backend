const jwt = require("jsonwebtoken");
const db = require("../db/connection");

const users = db.get("users");

function checkTokenSetUser(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        if (token) {
            jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
                if (decoded) {
                    users.findOne({
                        username: decoded.username,
                    }).then(user => {
                        req.user = user,
                        next();
                    })
                }else {
                    req.user = undefined;
                    next();
                }
            });
        }
    }else {
        next();
    }
}

function isLoggedIn(req, res, next) {
    if (req.user) {
        next();
    }else {
        const error = new Error("Hey, your not authorized");
        res.status(401);
        next(error);
    }
}

function isAdmin(req, res, next) {
    if (req.user.group == 0) {
        next();
    }else {
        const error = new Error("Hey, your no Admin authorized");
        res.status(401);
        next(error);
    }
}

module.exports = {
    checkTokenSetUser,
    isLoggedIn,
    isAdmin
};