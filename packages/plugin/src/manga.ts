import { IManga } from "./types";

type Options = Pick<IManga, 'source' | 'id' | 'name'> & Partial<Pick<IManga, 'author' | 'chapters' | 'status' | 'year' | 'covers'>>

export class Manga implements IManga {
  source: IManga['source'];
  id: string | number;
  name: string | Array<string>;
  author?: string | Array<string>;
  chapters?: number;
  status?: string;
  year?: number;
  covers?: Array<{ volume?: string; url: string }>;

  constructor({ source, id, name, author = "", chapters, status, year, covers }: Options) {
    this.source = source;
    this.id = id;
    this.name = name;
    this.author = author;
    if (chapters !== undefined) {
      this.chapters = chapters;
    }
    if (status !== undefined) {
      this.status = status;
    }
    if (year !== undefined) {
      this.year = year;
    }
    if (covers !== undefined) {
      this.covers = covers;
    }
  }
}
