import { ISixNimmtCard } from './';

export interface ISixNimmtCardMove {
  card: ISixNimmtCard;
}

export interface ISixNimmtRowNumberMove {
  rowNumber: number;
}

export declare type ISixNimmtMove = ISixNimmtCardMove | ISixNimmtRowNumberMove;
