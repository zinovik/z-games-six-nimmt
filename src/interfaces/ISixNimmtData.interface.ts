import { IBaseGameData } from 'z-games-base-game';

import { ISixNimmtPlayer, ISixNimmtCard } from './';

export interface ISixNimmtData extends IBaseGameData {
  currentRound: number;
  currentRoundMove: number;
  cards: ISixNimmtCard[];
  cardsTable: ISixNimmtCard[][];
  cardsLeft: number;
  players: ISixNimmtPlayer[];
  isCardsPlaying: boolean;
  currentMoves: Array<{
    playerId: string,
    card: ISixNimmtCard,
  }>;
}
