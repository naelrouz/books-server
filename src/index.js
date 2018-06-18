import Koa from 'koa';
import Router from 'koa-router';
import cfg from 'config';
import colors from 'colors';
import http from 'http';
import socketIO from 'socket.io';
import fs from 'fs';
import path from 'path';

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

      socket.emit('ADD_BOOK_RES', {
        ok: true,
        errors: null
      });
    } catch (error) {
      socket.emit('ADD_BOOK_RES', {
        ok: false,
        errors: error.message
      });
    }
  });
  // Get one book
  socket.on('ONE_BOOK', async ({ id }) => {
    try {
      const oneBook = await models.sequelize.query(
        'SELECT books.id, books.title, books.date, books.author_id, books.description, books.image, authors.first_name, authors.last_name FROM books  JOIN authors WHERE books.id = :id AND books.author_id = authors.id',
        {
          replacements: {
            id
          },
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
    } catch (error) {
      socket.emit('ONE_BOOK_RES', {
        ok: false,
        errors: error.message,
        oneBook: null
      });
    }
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

  // Upload image

  // init socket io and whatever
  const files = {};
  const struct = {
    name: null,
    type: null,
    size: 0,
    data: [],
    slice: 0
  };

  socket.on('slice upload', data => {
    try {
      // console.log('slice upload');

      if (!files[data.name]) {
        files[data.name] = Object.assign({}, struct, data);
        files[data.name].data = [];
      }

      // convert the ArrayBuffer to Buffer
      // data.data = new Buffer(new Uint8Array(data.data));
      data.data = Buffer.from(new Uint8Array(data.data));

      // save the data
      files[data.name].data.push(data.data);
      files[data.name].slice += 1; // ++

      if (files[data.name].slice * 100000 >= files[data.name].size) {
        const fileBuffer = Buffer.concat(files[data.name].data);

        const pathToImageFolder = path.join('/static/img', data.name);
        console.log('pathToImageFolder:', pathToImageFolder);

        fs.write(pathToImageFolder, fileBuffer, err => {
          delete files[data.name];
          if (err) {
            return socket.emit('upload error');
          }
          socket.emit('end upload');
          return null;
        });
        // socket.emit('end upload');
      } else {
        // console.log('request slice upload');

        socket.emit('request slice upload', {
          currentSlice: files[data.name].slice
        });
      }
    } catch (error) {
      console.log('slice upload error:', error);
    }
  });

  // Books list

  socket.on('BOOKS', async payload => {
    try {
      const orderBy = payload.orderBy ? payload.orderBy : null;
      const groupBy = payload.groupBy ? payload.groupBy : null;
      const like = payload.like ? `%${payload.like}%` : null;

      const bookRowsCountRes = await models.sequelize.query(
        `SELECT COUNT(title) FROM books ${
          like ? 'WHERE title LIKE :like' : ''
        }`,
        {
          replacements: { like },
          type: models.sequelize.QueryTypes.SELECT,
          model: models.Books,
          raw: true
        }
      );

      const bookRowsCount = bookRowsCountRes[0]['COUNT(title)'];

      const curPage = parseInt(
        payload.curPage && payload.curPage > 0 ? payload.curPage : 1,
        10
      );
      const limit = parseInt(
        payload.perPage && payload.perPage > 0 ? payload.perPage : 5,
        10
      );
      const pagesCount = Math.floor(bookRowsCount / limit);
      const offset = limit * curPage - limit;

      console.log('pagesCount:', pagesCount);
      console.log('limit:', limit);

      const groupByQ = () =>
        groupBy
          ? `GROUP BY ${groupBy === 'author' ? 'books.author_id' : groupBy}`
          : '';

      const orderByQ = () => {
        if (!orderBy) {
          return 'ORDER BY id DESC';
        }
        if (orderBy === 'author') {
          return 'ORDER BY authors.last_name, authors.first_name';
        }
        return `ORDER BY ${orderBy}`;
      };

      const books = await models.sequelize.query(
        `SELECT books.id, books.title, books.date, books.description, books.image, authors.first_name, authors.last_name FROM books JOIN authors WHERE ${
          like ? 'books.title LIKE :like AND' : ''
        }  books.author_id = authors.id ${groupByQ()} ${orderByQ()}  LIMIT :limit OFFSET :offset`,
        {
          replacements: {
            // orderBy,
            // groupBy,
            like,
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
