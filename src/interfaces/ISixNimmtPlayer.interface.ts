import { IBaseGamePlayer } from 'z-games-base-game';

import { ISixNimmtCard } from './';

export interface ISixNimmtPlayer extends IBaseGamePlayer {
  cardsHand: ISixNimmtCard[];
  cardsTaken: ISixNimmtCard[];
  cardsTakenCount: number;
  points: number;
  pointsCurrentRound: number;
}
