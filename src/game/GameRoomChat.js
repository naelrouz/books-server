import events from '../eventConstants';

class GameRoomChat {
  constructor(gameRoomId, players) {
    this.$chatParticipants = players;
    this.$gameRoomId = gameRoomId;
    // this.server = null;
    this.init();
  }

  // TODO
  // Listen on CHANGE_USERNAME
  // socket.on(events.CHANGE_USERNAME, ({
  //   username
  // }) => {
  //   console.log('username: ', username);
  //   socket.username = username;
  // });

  init() {
    this.$chatParticipants.forEach(({ socket }) => {
      socket.emit(events.NEW_MESSAGE, {
        text: 'Welcome to the game room chat!'
      });

      socket.on('m', message => {
        // console.log('>> message: ', message);

        this.sendMessage(socket, message);
      });
    });
  }
  sendMessage(socket, { text }) {
    console.log('>> message: ', text);

    console.log('this.$gameRoomId: ', this.$gameRoomId);

    socket.broadcast.in(this.$gameRoomId).emit(events.NEW_MESSAGE, {
      text
    });
  }
}

export default GameRoomChat;
