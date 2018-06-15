module.exports = {
  server: {
    host: '//localhost',
    port: 3000
  },
  db: {
    name: 'books',
    username: 'root',
    password: 'root',
    options: {
      host: 'localhost',
      dialect: 'mysql',
      port: 8889
    }
  }
};
