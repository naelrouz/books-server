import Player from './Player';
import GameRoomChat from './GameRoomChat';

import rules from './gameRules';

import events from '../eventConstants';

class GameRoom {
  constructor(gameRoomId) {
    this.$gameRoomId = gameRoomId;
    this.$maxPlayersCount = 2;
    this.$players = new Map();
    this.$GameRoomChat = null;
  }
  get id() {
    return this.$gameRoomId;
  }

  get players() {
    return this.$players;
  }
  get playersAsArray() {
    return Array.from(this.$players.values());
  }
  addPlayer(socket) {
    // if the maximum number of players is exceeded
    if (this.isAllPlayersEnterTheGameRoom()) {
      throw new Error('Maximum number of players exceeded');
    }

    socket.join(this.$gameRoomId);
    const newPlayer = new Player(socket);
    this.$players.set(socket.id, newPlayer);

    socket.broadcast
      .in(this.$gameRoomId)
      .emit(events.OPPONENT_ENTRANCE_TO_GAME_ROOM, {
        message: `${socket.username} user has joined to GameRoom`
      });

    if (this.isAllPlayersEnterTheGameRoom()) {
      this.$gameRoomChat = new GameRoomChat(this.id, this.players);
    }
  }
  getPlayer(playerId) {
    return this.$players.get(playerId);
  }
  isAllPlayersEnterTheGameRoom() {
    return this.$players.size === this.$maxPlayersCount;
  }
  // check whether all participants in the game choice or gesture
  isAllPlayersSelectedGestures() {
    return Array.from(this.$players.values()).reduce((result, player) => {
      if (!result) {
        return result;
      }
      return !!player.selectedGesture;
    }, true);
  }
  // send game result to all players
  gameOwer(gameResult) {
    this.$players.forEach(player => {
      player.$socket.broadcast
        .in(this.$gameRoomId)
        .emit(events.GAME_OWER, gameResult);
    });
  }
  gameResult() {
    const [player2, player1] = this.playersAsArray;

    // if players chose the same gestures, then draw
    if (player1.selectedGesture === player2.selectedGesture) {
      // return this result game if draw
      return {
        message: null,
        players: this.playersAsArray.map(player => ({
          id: player.id,
          winner: false,
          selectedGesture: player.selectedGesture
        }))
      };
    }

    // If the object from the selected gesture of the  player-1 contains the player-2 gesture, then player-1 is win.
    if (
      rules[player1.selectedGesture].hasOwnProperty(player2.selectedGesture)
    ) {
      // return this result game if player 1 is winner
      return {
        message: `${player1.selectedGesture} ${
          rules[player1.selectedGesture][player2.selectedGesture]
        } ${player2.selectedGesture}`,
        players: [
          {
            id: player1.id,
            winner: true,
            selectedGesture: player1.selectedGesture
          },
          {
            id: player2.id,
            winner: false,
            selectedGesture: player2.selectedGesture
          }
        ]
      };
    }

    // return this result game if player 2 is winner
    return {
      message: `${player2.selectedGesture}  ${
        rules[player2.selectedGesture][player1.selectedGesture]
      } ${player1.selectedGesture}`,
      players: [
        {
          id: player1.id,
          winner: false,
          selectedGesture: player1.selectedGesture
        },
        {
          id: player2.id,
          winner: true,
          selectedGesture: player2.selectedGesture
        }
      ]
    };
  }

  setPlayerGesture(playerId, gesture) {
    // if the player has already chosen a gesture
    if (this.$players.get(playerId).selectedGesture) {
      return;
    }
    // set player selected gesture
    this.$players.get(playerId).selectedGesture = gesture;

    // if all players selected gestures
    if (this.isAllPlayersSelectedGestures()) {
      // learn who is winner
      const gameResult = this.gameResult();
      // finish the game
      this.gameOwer(gameResult);
    }
  }
}

export default GameRoom;
