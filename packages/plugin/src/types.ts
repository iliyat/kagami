export interface IManga {
  source: IPlugin['key'];
  id: string | number;
  name: string | Array<string>;
  author?: string | Array<string>;
  chapters?: number;
  status?: string;
  year?: number;
  covers?: Array<{ volume?: string; url: string }>;
}

export interface IChapter {
  id: string | number;
  number: number;
  name: string | Array<string> | undefined;
  images: Array<string>;
  volume?: string;
  mangaId?: string | number;
}

export interface IPlugin {
  name: string;
  key: string;
  domains: Array<string>;
  imageDomain: string;

  search: (query: string) => Promise<Array<IManga>>;
  getChapters(manga: IManga): Promise<Array<IChapter>>;
  getChapterPages(chapter: IChapter): Promise<Array<{ url: string }>>;
  downloadImage(url: string): Promise<ArrayBuffer>;
  delay(ms?: number): Promise<void>;
  matchUrl(url: string): boolean;
  extractMangaId(url: string): string | null;
  getMangaInfo(mangaId: string): Promise<Partial<IManga> | null>;
  getMangaCovers(manga: IManga): Promise<Array<{ volume?: string; url: string }>>;
}
