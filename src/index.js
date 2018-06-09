import Koa from 'koa';
import Router from 'koa-router';
import cfg from 'config';
import colors from 'colors';
import http from 'http';
import socketIO from 'socket.io';

import events from './eventConstants';
import middlewares from './middlewares';
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

  // Add book

  socket.on(events.NEW_BOOK, payload => {
    const payload
  });

  // Viewing books

  // Book search

  // Listen on disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.use(router.routes());

server.listen(PORT, () => {
  console.log(colors.green.bold(`App is start ${cfg.server.host}:${PORT}`));
});
