import { BaseGame } from 'z-games-base-game';

import {
  ISixNimmtData,
  ISixNimmtPlayer,
  ISixNimmtCardMove,
  ISixNimmtRowNumberMove,
  ISixNimmtMove,
  ISixNimmtCard,
} from './interfaces';
import {
  NAME,
  NAME_WORK,
  PLAYERS_MIN,
  PLAYERS_MAX,
  CARDS_COUNT,
  HAND_CARDS_COUNT,
  ROWS_COUNT,
  CATTLE_HEADS_TABLE,
} from './constants';

export * from './interfaces';
export * from './constants';

export class SixNimmt extends BaseGame {
  private static instance: SixNimmt;

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }

  public getName = (): string => {
    return NAME;
  }

  public getNameWork = (): string => {
    return NAME_WORK;
  }

  public getNewGame = (): { playersMax: number, playersMin: number, gameData: string } => {
    const gameData: ISixNimmtData = {
      cards: [],
      cardsTable: [],
      cardsLeft: 0,
      players: [],
      currentRound: 0,
      currentRoundMove: 0,
      currentMoves: [],
      isCardsPlaying: false,
    };

    return {
      playersMax: PLAYERS_MAX,
      playersMin: PLAYERS_MIN,
      gameData: JSON.stringify(gameData),
    };
  }

  public startGame = (gameDataJSON: string): { gameData: string, nextPlayersIds: string[] } => {
    const gameData: ISixNimmtData = JSON.parse(gameDataJSON);
    const { cards } = gameData;
    let { players } = gameData;

    for (let i = 1; i < CARDS_COUNT + 1; i++) {
      let cardCattleHeads = 0;

      CATTLE_HEADS_TABLE.forEach(([divisor, cattleHeads]) => {
        if (cardCattleHeads) {
          return;
        }

        if (i % divisor === 0) {
          cardCattleHeads = cattleHeads;
        }
      });

      cards.push({
        cardNumber: i,
        cattleHeads: cardCattleHeads,
      });
    }

    players = players.map(player => {
      const cardsHand: ISixNimmtCard[] = [];

      for (let i = 0; i < HAND_CARDS_COUNT; i++) {
        cardsHand.push(cards.splice(Math.floor(Math.random() * cards.length), 1)[0]);
      }

      return {
        ...player,
        cardsHand,
        cardsTaken: [],
        points: 0,
      };
    });

    const nextPlayersIds = players.map(player => player.id);

    const cardsTable = new Array(ROWS_COUNT).fill(0).map(() => {
      return cards.splice(Math.floor(Math.random() * cards.length), 1);
    });

    return {
      gameData: JSON.stringify({
        ...gameData,
        currentRound: 1,
        currentRoundState: 1,
        cards,
        cardsTable,
        cardsLeft: cards.length,
        players,
        isCardsPlaying: true,
      }), nextPlayersIds,
    };
  }

  public parseGameDataForUser = ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }): string => {
    const gameData: ISixNimmtData = JSON.parse(gameDataJSON);

    gameData.players.forEach((player, index) => {
      if (player.id === userId) {
        return;
      }

      gameData.players[index] = {
        ...gameData.players[index],
        cardsHand: [],
        cardsTaken: [],
      };
    });

    return JSON.stringify({ ...gameData, cards: [] });
  }

  public checkMove = ({ gameData: gameDataJSON, move: moveJSON, userId }: {
    gameData: string,
    move: string,
    userId: string,
  }): boolean => {
    // TODO
    return true;
  }

  public makeMove = ({ gameData: gameDataJSON, move: moveJSON, userId }: { gameData: string, move: string, userId: string }): {
    gameData: string,
    nextPlayersIds: string[],
  } => {
    if (!this.checkMove({ gameData: gameDataJSON, move: moveJSON, userId })) {
      throw new Error('Impossible move!');
    }

    let gameData: ISixNimmtData = JSON.parse(gameDataJSON);
    const move: ISixNimmtMove = JSON.parse(moveJSON);

    const { cards } = gameData;
    let { players } = gameData;
    const { card, rowNumber } = move as (ISixNimmtCardMove & ISixNimmtRowNumberMove);

    const playerNumber = this.getPlayerNumber({ userId, players });

    let nextPlayersIds: string[] = [];

    if (card) {
      let isCardCutOut = false;
      players[playerNumber].cardsHand = players[playerNumber].cardsHand.filter(currentCard => {
        if (!isCardCutOut && currentCard.cardNumber === card.cardNumber) {
          isCardCutOut = true;
          return false;
        }

        return true;
      });

      gameData.currentMoves.push({
        playerId: players[playerNumber].id,
        card,
      });

      nextPlayersIds = players
        .filter(player => !gameData.currentMoves.some(currentMove => currentMove.playerId === player.id))
        .map(player => player.id);
    }

    if (card && gameData.currentMoves.length === players.length) {
      gameData.isCardsPlaying = false;
      gameData.currentMoves.sort((a, b) => a.card.cardNumber - b.card.cardNumber);
    }

    if (!card) {
      const [currentMove] = gameData.currentMoves.splice(0, 1);
      const currentPlayerNumber = this.getPlayerNumber({ userId: currentMove.playerId, players });
      players[currentPlayerNumber].cardsTaken.push(...gameData.cardsTable[rowNumber]);
      players[currentPlayerNumber].cardsTakenCount += players[currentPlayerNumber].cardsTaken.length;
      gameData.cardsTable[rowNumber] = [currentMove.card];
      players[currentPlayerNumber].points = this.getPointsForPlayer(players[currentPlayerNumber]);
    }

    if (gameData.currentMoves.length === players.length || !card) {

      let movesFinished = 0;
      let movesPaused = false;

      gameData.currentMoves.forEach(currentMove => {
        if (movesPaused) {
          return;
        }

        let rowNumberMinDifference = 0;
        let minDifference = CARDS_COUNT;

        gameData.cardsTable.forEach((currentRowCards, currentRowNumber) => {
          const lastCardInRow = currentRowCards[currentRowCards.length - 1];
          const currentDifference = currentMove.card.cardNumber - lastCardInRow.cardNumber;

          if (currentDifference < 0) {
            return;
          }

          if (currentDifference < minDifference) {
            minDifference = currentDifference;
            rowNumberMinDifference = currentRowNumber;
          }
        });

        if (minDifference === CARDS_COUNT) {
          movesPaused = true;
          nextPlayersIds.push(currentMove.playerId);
          return;
        }

        movesFinished++;

        if (gameData.cardsTable[rowNumberMinDifference].length < 5) {
          gameData.cardsTable[rowNumberMinDifference].push(currentMove.card);
          return;
        }

        const currentPlayerNumber = this.getPlayerNumber({ userId: currentMove.playerId, players });
        players[currentPlayerNumber].cardsTaken.push(...gameData.cardsTable[rowNumberMinDifference]);
        players[currentPlayerNumber].cardsTakenCount += players[currentPlayerNumber].cardsTaken.length;
        gameData.cardsTable[rowNumberMinDifference] = [currentMove.card];
        players[currentPlayerNumber].points = this.getPointsForPlayer(players[currentPlayerNumber]);
      });

      gameData.currentMoves.splice(0, movesFinished);

      if (!gameData.currentMoves.length) {
        if (gameData.currentRoundMove === HAND_CARDS_COUNT) {
          players = this.updatePlayerPlaces(players);

          if (true) { // Check win points
            gameData = this.nextRound(gameData);
          }
        } else {
          gameData.isCardsPlaying = true;
          nextPlayersIds = players.map(player => player.id);
          gameData.currentRoundMove++;
        }
      }

    }

    return {
      gameData: JSON.stringify({
        ...gameData,
        cards,
        players,
        cardsLeft: cards.length,
      }),
      nextPlayersIds,
    };
  }

  public getRules = (): string[] => {
    const rules = [];

    rules.push('The game has 104 cards, each bearing a number and one to seven bull\'s heads symbols that represent penalty points.A round of ten turns is played where all players place one card of their choice onto the table.The placed cards are arranged on four rows according to fixed rules.If placed onto a row that already has 5 cards then the player receives those five cards, which count as penalty points that are totted up at the end of the round.Rounds are played until a player reaches 66 points, whereupon the player with the least penalty points wins.The game\'s suggested minimum age is 10 years, and it lasts around 45 minutes.');

    rules.push('The goal is to be the player with the fewest points. To do this, the players need to avoid picking up penalty cards.');

    rules.push('6 Nimmt! is played using a special card deck that has a variable number of small cattle heads on them. The cards are numbered 1 to 104, each giving 1, 2, 3, 5 or 7 points (i.e. cattle heads) to the person who picks it up.');

    rules.push('In the deck there are:');

    rules.push('1 card with 7 cattle heads — number 55');

    rules.push('8 cards with 5 cattle heads — multiples of 11 (except 55): 11, 22, 33, 44, 66, 77, 88, 99');

    rules.push('10 cards with 3 cattle heads — multiples of ten: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100');

    rules.push('9 cards with 2 cattle heads — multiples of five that are not multiples of ten (except 55): 5, 15, 25, 35, 45, 65, 75, 85, 95');

    rules.push('76 cards with 1 cattle head — the rest of the cards from 1 through 104');

    rules.push('At each turn, each player selects a card to play, and puts the card face down on the table. When all the players have selected a card, the cards are uncovered.');

    rules.push('Starting with the lowest valued card, and continuing in increasing order, each player must put their card at the end of one of the four rows on the table, following these rules:');

    rules.push('The card must be put on a row where the latest (end) card is lower in value than the card that is about to be played.');

    rules.push('The card must be put on the row where the latest (end) card is the closest in value to the card that is about to be played (if your card is 33, then place it next to the 30 not the 29, for example)');

    rules.push('If the row where the played card must be placed already contains 5 cards (the player\'s card is the 6th), the player must gather the 5 cards on the table, leaving only the 6th card in their place to start a new row.The gathered cards must be taken separated and never mixed with the hand cards.The sum of the number of cattle head on the gathered cards will be calculated at the end of the round.');

    rules.push('If the played card is lower than all the latest cards present on the four rows, the player must choose a row and gather the cards on that row (usually the row with the fewest cattle heads), leaving only the played card on the row.');

    rules.push('The cards of all the players are played following these rules, from the lowest player card to the highest one.');

    rules.push('At the end of the turn, the players each select a new card to play; this is repeated for 10 turns until all the cards in the hand are played.');

    rules.push('End of the game');

    rules.push('After the 10 turns, each player counts the cattle heads on the cards gathered from the table during the round. The score of each player is collected on the paper and a new hand starts.');

    rules.push('The game ends when a player collects a total of 66 or more cattle heads. The winner is the player who has collected the fewest cattle heads.');

    return rules;
  }

  private nextRound = (gameData: ISixNimmtData): ISixNimmtData => {
    // const gameDataNew = this.startGame(this.getNewGame());

    // gameDataNew.currentRound = gameData.currentRound + 1;

    // gameData.players.forEach((player) => {
    //   player.dices = [];

    //   for (let j = 0; j < player.dicesCount; j++) {
    //     player.dices.push(Math.floor(Math.random() * DICE_MAX_FIGURE) + 1);
    //   }

    // });

    return { ...gameData };
  }

  private getPointsForPlayer = (player: ISixNimmtPlayer): number => {
    return player.cardsTaken.reduce((acc, card) => acc + card.cattleHeads, 0);
  }

  private updatePlayerPlaces = (players: ISixNimmtPlayer[]): ISixNimmtPlayer[] => {
    const playersPlaces: Array<{ id: string, points: number }> = [];

    players.forEach(player => {
      playersPlaces.push({ id: player.id, points: player.points });
    });

    playersPlaces.sort((a, b) => b.points - a.points);

    return players.map(player => {
      let place = 0;

      playersPlaces.forEach((playersPlace, i) => {
        if (player.id === playersPlace.id) {
          place = i + 1;
        }
      });

      return {
        ...player,
        place,
      };
    });
  }

  private getPlayerNumber = ({ userId, players }: { userId: string, players: ISixNimmtPlayer[] }): number => {
    let playerNumber = 0;

    players.forEach((player, index) => {
      if (player.id === userId) {
        playerNumber = index;
      }
    });

    return playerNumber;
  }
}

export const getCardShape = (numberPropType: object): object => {
  return {
    cardNumber: numberPropType,
    cattleHeads: numberPropType,
  };
};
