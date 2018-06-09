import uniqid from 'uniqid';

import GameRoom from './GameRoom';

class GameServer {
  constructor() {
    this.$gameRooms = new Map();
  }

  createGameRoom() {
    const gameRoomId = uniqid();
    const newGameRoom = new GameRoom(gameRoomId);
    this.$gameRooms.set(gameRoomId, newGameRoom);
    return newGameRoom;
  }

  // get a game room by id
  getGameRoom(gameRoomId) {
    if (!this.$gameRooms.get(gameRoomId)) {
      throw new Error('there is no room with such id');
    }

    return this.$gameRooms.get(gameRoomId);
  }

  // get a game room players by id
  getRoomPlayers(gameRoomId) {
    return this.getGameRoom(gameRoomId).players;
  }

  // a gesture is fixed for the player
  setRoomPlayerGesture(gameRoomId, playerId, gesture) {
    this.$gameRooms.get(gameRoomId).setPlayerGesture(playerId, gesture);
  }

  // when clicking on the invitation, a player is added to the game room
  addRoomPlayer(gameRoomId, socket) {
    this.getGameRoom(gameRoomId).addPlayer(socket);
  }

  get gameRooms() {
    return this.$gameRooms;
  }
}

export default GameServer;
