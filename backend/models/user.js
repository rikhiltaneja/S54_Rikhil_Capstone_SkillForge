const mongoose = require("mongoose");
const formatDate = require("../utils/formatDate");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Institution",
  },
  password: {
    type: String,
    required: true,
  },
  contact: {
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
  },
  wallet: {
    type: Number,
    default: 0,
  },
  created: {
    type: Date,
    default: formatDate,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
