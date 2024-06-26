const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const User = require("../models/user");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const { userValidation } = require("../utils/validation");
const ExpressError = require("../utils/ExpressError.js");
const passwordHash = require("password-hash");
const Institution = require("../models/institution.js");
require("dotenv").config({ path: "../.env" });

userRouter.use(express.json());

const validateUser = (req, res, next) => {
  let { error } = userValidation.validate(req.body);
  if (error) {
    throw new ExpressError(400, error);
  } else {
    next();
  }
};

const extractName = (req, res, next) => {
  try {
    let { authorization } = req.headers;
    let result = jwt.verify(authorization, process.env.JWT_PASS);
    if (result.type == "Student") {
      req.body.username = result.data.username;
      next();
    } else {
      throw new ExpressError(
        403,
        "Not authorised to access this route without correct auth token"
      );
    }
  } catch (err) {
    throw new ExpressError(
      403,
      "Not authorised to access this route without correct auth token"
    );
  }
};

userRouter.get(
  "/one",
  extractName,
  wrapAsync(async (req, res) => {
    let result = await User.findOne({ username: req.body.username });
    res.send(result);
  })
);

userRouter.post(
  "/signup",
  validateUser,
  wrapAsync(async (req, res) => {
    let { password, institution } = req.body;
    let hashedPassword = passwordHash.generate(password);
    let findInsti = await Institution.findOne({ name: institution });
    if (findInsti != null) {
      let newUserData = new User({
        name: req.body.name,
        username: req.body.username,
        institution: findInsti,
        password: hashedPassword,
        contact: req.body.contact,
      });
      let findUser = await User.find({ username: req.body.username });
      if (findUser.length == 0) {
        await newUserData.save();
        let token = jwt.sign(
          {
            data: {
              name: req.body.name,
              username: req.body.username,
              institution: findInsti,
            },
            type: "Student",
          },
          process.env.JWT_PASS
        );
        res.send(token);
      } else {
        throw new ExpressError(400, "Username Exists");
      }
    } else {
      throw new ExpressError(404, "Institution not found!");
    }
  })
);

userRouter.post(
  "/signin",
  wrapAsync(async (req, res) => {
    let { username, password } = req.body;
    let userFind = await User.find({ username: username });
    if (userFind.length != 0) {
      let storedPassword = userFind[0].password;
      if (passwordHash.verify(password, storedPassword)) {
        let token = jwt.sign(
          {
            data: {
              name: userFind[0].name,
              username: userFind[0].username,
              institution: userFind[0].institution,
            },
            type: "Student",
          },
          process.env.JWT_PASS
        );
        res.send(token);
      } else {
        throw new ExpressError(401, "Wrong Password!");
      }
    } else {
      throw new ExpressError(404, "Username not found!");
    }
  })
);

userRouter.use((err, req, res, next) => {
  let { status = 500, message = "Some error occured..!" } = err;
  res.status(status).send(message);
});

module.exports = userRouter;
