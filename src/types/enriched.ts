import type { Kontakte } from './app';

export type EnrichedKontakte = Kontakte & {
  kategorieName: string;
};
