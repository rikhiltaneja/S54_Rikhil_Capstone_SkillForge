const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const taskRouter = express.Router();
const jwt = require("jsonwebtoken");
const ExpressError = require("../utils/ExpressError.js");
const { taskValidation } = require("../utils/validation.js");
const Task = require("../models/task.js");
const Company = require("../models/company.js");
require("dotenv").config({ path: "../.env" });

const validateTask = (req, res, next) => {
  let { error } = taskValidation.validate(req.body);
  if (error) {
    throw new ExpressError(400, error);
  } else {
    next();
  }
};

const jwtVerify = (req, res, next) => {
  try {
    let { authorization } = req.headers;
    let result = jwt.verify(authorization, process.env.JWT_PASS);
    // console.log(result.username);
    next();
  } catch (err) {
    throw new ExpressError(
      403,
      "Not authorised to access this route without correct auth token"
    );
  }
};

taskRouter.get("/all");

taskRouter.post(
  "/new",
  validateTask,
  wrapAsync(async (req, res) => {
    let { title, description, bounty, company } = req.body;
    let companyFind = await Company.findOne({ name: company });
    if (companyFind != null) {
      let newTask = new Task({
        title: title,
        description: description,
        bounty: bounty,
        company: companyFind,
      });
      await newTask.save();
      res.send("SAVED");
    } else {
      throw new ExpressError(404, "Company not found!");
    }
  })
);

taskRouter.use((err, req, res, next) => {
  let { status = 500, message = "Some error occured..!" } = err;
  res.status(status).send(message);
});

module.exports = taskRouter;
