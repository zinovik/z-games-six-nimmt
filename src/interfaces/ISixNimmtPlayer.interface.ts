import { IBaseGamePlayer } from 'z-games-base-game';

import { ISixNimmtCard } from './';

export interface ISixNimmtPlayer extends IBaseGamePlayer {
  cardsHand: ISixNimmtCard[];
  cardsHandCount: number;
  cardsTaken: ISixNimmtCard[];
  points: number;
}
