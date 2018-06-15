import Koa from 'koa';
import Router from 'koa-router';
import cfg from 'config';
import colors from 'colors';
import http from 'http';
import socketIO from 'socket.io';

import middlewares from './middlewares';

// Models
import models from './models';

// import GameServer from './game/GameServer';

const app = new Koa();
const router = new Router();
const server = http.createServer(app.callback());
const io = socketIO(server);

const PORT = cfg.server.port;

Object.keys(middlewares).forEach(middleware => {
  middlewares[middleware].init(app);
});

// const gameServer = new GameServer(io);

io.on('connection', socket => {
  console.log(`New user is connected. socketId : ${socket.id}`);

  socket.on('pingServer', payload => {
    console.log('pingServer:', payload);
    socket.emit('pingServerRes', 'pingServerRes');
  });

  // Add book

  socket.on('ADD_BOOK', async book => {
    try {
      // console.log('book:', book);

      await models.sequelize.query(
        `INSERT INTO books  (title , date, author_id, description) VALUES (:title , :date, :author_id, :description)`,
        {
          replacements: book,
          type: models.sequelize.QueryTypes.UPDATE,
          model: models.Books
        }
      );

      socket.emit('ADD_BOOK_RES', { ok: true, errors: null });
    } catch (error) {
      socket.emit('ADD_BOOK_RES', { ok: false, errors: error.message });
    }
  });
  // Get one book
  socket.on('ONE_BOOK', async ({ id }) => {
    const oneBook = await models.sequelize.query(
      'SELECT books.id, books.title, books.date, books.author_id, books.description, authors.first_name, authors.last_name FROM books  JOIN authors WHERE books.id = :id AND books.author_id = authors.id',
      {
        replacements: { id },
        type: models.sequelize.QueryTypes.SELECT,
        model: models.Books,
        raw: true
      }
    );

    socket.emit('ONE_BOOK_RES', {
      ok: true,
      errors: null,
      oneBook: oneBook[0]
    });
  });

  // Update book
  socket.on('UPDATE_BOOK', async book => {
    try {
      console.log('book:', book);

      await models.sequelize.query(
        `UPDATE books SET title = :title, date = :date, author_id = :author_id, description = :description WHERE id = :id;`,
        {
          replacements: book,
          type: models.sequelize.QueryTypes.UPDATE,
          model: models.Book
        }
      );

      socket.emit('UPDATE_BOOK_RES', {
        ok: true,
        errors: null
      });
    } catch (error) {
      socket.emit('UPDATE_BOOK_RES', {
        ok: false,
        errors: error.message
      });
    }
  });

  // Books list

  socket.on('BOOKS', async payload => {
    try {
      const bookRowsCountRes = await models.sequelize.query(
        'SELECT COUNT(title) FROM books',
        {
          type: models.sequelize.QueryTypes.SELECT,
          model: models.Books,
          raw: true
        }
      );
      const bookRowsCount = bookRowsCountRes[0]['COUNT(title)'];

      const orderBy = payload.orderBy ? payload.orderBy : null;
      const groupBy = payload.groupBy ? payload.groupBy : null;

      const curPage = parseInt(
        payload.curPage && payload.curPage > 0 ? payload.curPage : 1,
        10
      );
      const limit = parseInt(
        payload.perPage && payload.perPage > 0 ? payload.perPage : 20,
        10
      );
      const pagesCount = Math.floor(bookRowsCount / limit);
      const offset = limit * curPage - limit;

      console.log('pagesCount:', pagesCount);
      console.log('limit:', limit);

      const books = await models.sequelize.query(
        `SELECT books.id, books.title, books.date, books.description, books.image, authors.first_name, authors.last_name FROM books JOIN authors WHERE books.author_id = authors.id ${
          groupBy ? 'GROUP BY :groupBy' : ''
        } ${
          orderBy ? 'ORDER BY :orderBy' : 'ORDER BY id DESC'
        }  LIMIT :limit OFFSET :offset`,
        {
          replacements: {
            orderBy,
            groupBy,
            limit,
            offset
          },
          type: models.sequelize.QueryTypes.SELECT,
          model: models.Books,
          raw: true
        }
      );

      // const books = await models.Book.findAll(
      //   { order: [['title', 'DESC']], limit, offset },
      //   { raw: true }
      // );

      console.log('books: ', books);

      socket.emit('BOOKS_RES', {
        ok: true,
        errors: null,
        books,
        curPage,
        pagesCount
      });
    } catch (error) {
      socket.emit('BOOKS_RES', {
        ok: false,
        errors: error.message,
        books: null,
        curPage: null,
        pagesCount: null
      });
    }
  });

  // Book search

  // Listen on disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.use(router.routes());

const appStart = async () => {
  await models.sequelize.sync({ force: false }); // Create the tables
  console.log(colors.green('sequelize.sync: OK'));

  server.listen(PORT, () => {
    console.log(colors.green.bold(`App is start ${cfg.server.host}:${PORT}`));
  });
};

appStart();
