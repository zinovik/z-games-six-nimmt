import { IBaseGameData } from 'z-games-base-game';

import { ISixNimmtPlayer, ISixNimmtCard } from './';

export interface ISixNimmtData extends IBaseGameData {
  currentRound: number;
  currentRoundState: number;
  cards: ISixNimmtCard[];
  cardsTable: ISixNimmtCard[][];
  cardsLeft: number;
  players: ISixNimmtPlayer[];
  currentMoves: Array<{
    playerId: string,
    card: ISixNimmtCard,
  }>;
}
