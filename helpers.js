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

async function findUsersBd(users) {
  const findUsersDb = [];
  const notFindUsersDb = [];
  for (const name of users) {
    const user = await getFindUsers(name);

    if (!user) notFindUsersDb.push(name);
    if (user) findUsersDb.push(user);
  }

  const namesBd = findUsersDb
    .filter((el) => el !== undefined)
    .map((el) => {
      if (!el) {
        return;
      }
      return el.name;
    });

  return { findUsersDb, notFindUsersDb, namesBd };
}
module.exports = {
  getAllUsers,
  getFindUsers,
  findUsersBd,
};
