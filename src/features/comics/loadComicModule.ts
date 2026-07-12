import { Comic1Module } from './comic-1';
import { Comic2Module } from './comic-2';
import { Comic3Module } from './comic-3';
import { Comic4Module } from './comic-4';
import { Comic5Module } from './comic-5';
import type { ComicModule } from './types';

const COMIC_MODULES: Record<number, ComicModule> = {
  1: Comic1Module,
  2: Comic2Module,
  3: Comic3Module,
  4: Comic4Module,
  5: Comic5Module,
};

export function loadComicModule(comicId: number): ComicModule {
  return COMIC_MODULES[comicId] ?? Comic1Module;
}
