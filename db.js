const sqlite3 = require('sqlite3').verbose();
const dbName = 'late.sqlite';
const db = new sqlite3.Database(dbName);

db.serialize(() => {
  const sql = ` 
CREATE TABLE IF NOT EXISTS user
	(
  id integer primary key,
  name TEXT,
  isActive INTEGER DEFAULT 0 CHECK (isActive IN (0, 1))
  )`;

  db.run(sql);
});

class User {
  static all(cb) {
    db.all('SELECT * FROM user', cb);
  }

  static find(name, cb) {
    db.get('SELECT * FROM user WHERE name = ?', [name], cb);
  }

  static create(data, cb) {
    const sql = 'INSERT INTO user(name) VALUES (?)';
    db.run(sql, data.name, cb);
  }

  static update(id, data, cb) {
    if (!id) return cb(new Error('Please provide an id'));

    const sql = `
      UPDATE user
      SET name = ?, isActive = ?
      WHERE id = ?
    `;

    // Если isActive не передан, подставим null (или можешь сделать дефолт через 0)
    const values = [data.name, data.isActive ?? null, id];

    db.run(sql, values, function (err) {
      if (err) return cb(err);
      cb(null, { updated: this.changes }); // сколько строк обновлено
    });
  }
  static delete(id, cb) {
    if (!id) return cb(new Error('Please provide an id'));
    db.run('DELETE FROM user WHERE id = ?', id, cb);
  }
}

module.exports = db;
module.exports.User = User;
