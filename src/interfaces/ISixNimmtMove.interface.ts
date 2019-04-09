import { IBaseGameMove } from 'z-games-base-game';

import { ISixNimmtCard } from './';

export interface ISixNimmtCardMove extends IBaseGameMove {
  card: ISixNimmtCard;
}

export interface ISixNimmtRowNumberMove extends IBaseGameMove {
  rowNumber: number;
}

export declare type ISixNimmtMove = ISixNimmtCardMove | ISixNimmtRowNumberMove;
