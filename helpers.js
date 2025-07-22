const { User } = require('./db');

function getAllUsers() {
  return new Promise((resolve, reject) => {
    User.all((err, users) => {
      if (err) return reject(err);
      resolve(users);
    });
  });
}

function getFindUsers(name) {
  return new Promise((resolve, reject) => {
    User.find(name, (err, user) => {
      if (err) return reject(err);
      resolve(user);
    });
  });
}

module.exports = {
  getAllUsers,
  getFindUsers,
};
