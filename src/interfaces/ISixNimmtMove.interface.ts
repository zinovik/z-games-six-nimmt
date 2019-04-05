import { IBaseGameMove } from 'z-games-base-game';

import { ISixNimmtCard } from './';

export interface ISixNimmtMove extends IBaseGameMove {
  card: ISixNimmtCard;
}
