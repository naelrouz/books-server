import colors from 'colors';
import Sequelize from 'sequelize';
import cfg from 'config';

// const sequelize = new Sequelize(
//   cfg.db.name,
//   cfg.db.username,
//   cfg.db.password,
//   cfg.db.options
// );

const sequelize = new Sequelize('books', 'root', 'root', {
  port: 8889,
  host: 'localhost',
  dialect: 'mysql'
});

sequelize
  .authenticate()
  .then(() => {
    // colog('green', `Connection has been established successfully.`);
  })
  .catch(err => {
    console.log(colors.red.bold('Unable to connect to the database:', err));
  });

// sequelize
//   .sync() // create the database table for our model(s)
//   // .then(function(){
//   //   // do some work
//   // })
//   .then(function(){
//     return sequelize.drop() // drop all tables in the db
//   });

const db = {
  Book: sequelize.import('./Book'),
  Author: sequelize.import('./Author')
};

console.log('models.db: ', db);

Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
