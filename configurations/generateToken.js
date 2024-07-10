const jwt = require("jsonwebtoken");
const generateToken = function (id, role, time) {
  return jwt.sign({ id, role }, process.env.SECRET_KEY, { expiresIn: time });
};

module.exports = generateToken;
