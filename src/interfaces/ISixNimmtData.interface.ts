import { IBaseGameData } from 'z-games-base-game';

import { ISixNimmtPlayer, ISixNimmtCard } from './';

export interface ISixNimmtData extends IBaseGameData {
  currentRound: number;
  currentRoundMove: number;
  cards: ISixNimmtCard[];
  cardsTable: ISixNimmtCard[][];
  players: ISixNimmtPlayer[];
  isCardsPlaying: boolean;
  previousMoves: Array<{
    playerId: string;
    card: ISixNimmtCard;
  }>;
  currentMoves: Array<{
    playerId: string;
    card: ISixNimmtCard;
  }>;
}
