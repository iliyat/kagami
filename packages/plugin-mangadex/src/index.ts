import { MangaDex } from "./types";
import { Manga } from "@kagami/plugin";
import { RestPlugin } from "@kagami/plugin";
import { IPlugin, IManga, IChapter } from "@kagami/plugin";

export class MangaDexPlugin extends RestPlugin implements IPlugin {
  protected delayMs = 50;
  key = "mangadex";
  name = "MangaDex";
  domains = ["mangadex.org", "mangadex.com"];
  imageDomain = "https://uploads.mangadex.org";

  constructor() {
    super();
    this.endpoint = 'https://api.mangadex.org';
  }

  extractMangaId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const match = urlObj.pathname.match(/\/title\/([^\/]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  async getMangaInfo(mangaId: string): Promise<Pick<IManga, 'name' | 'author' | 'status' | 'year' | 'covers'> | null> {
    const result = await this._request<MangaDex.API.MangaResult>(`/manga/${mangaId}`, {
      'includes[]': ['cover_art', 'author', 'artist']
    });
    if (!result || !result.data) return null;

    const manga = result.data;
    const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || mangaId;

    const author = this.extractAuthor(manga.relationships);
    const status = manga.attributes.status;
    const year = manga.attributes.year;
    const mainCover = this.extractMainCover(manga.relationships, manga.id);
    const covers = mainCover ? [{ url: mainCover }] : [];

    return { name: title, author, status, year, covers };
  }

  private extractAuthor(relationships?: Array<{ id: string; type: string; attributes?: { name?: string } }>): string | Array<string> | undefined {
    if (!relationships) return undefined;
    const authors = relationships
      .filter(r => r.type === 'author' || r.type === 'artist')
      .map(r => r.attributes?.name)
      .filter((name): name is string => !!name);

    if (authors.length === 0) return undefined;
    if (authors.length === 1) return authors[0];
    return authors;
  }

  private extractMainCover(relationships?: Array<{ id: string; type: string; attributes?: { fileName?: string } }>, mangaId?: string): string | undefined {
    if (!relationships || !mangaId) return undefined;
    const coverRel = relationships.find(r => r.type === 'cover_art');
    if (!coverRel?.attributes?.fileName) return undefined;
    return `${this.imageDomain}/covers/${mangaId}/${coverRel.attributes.fileName}`;
  }

  async search(query: string): Promise<Array<IManga>> {
    const result = await this._request<MangaDex.API.SearchResult>("/manga", {
      title: query,
      limit: "10",
      'includes[]': ['cover_art', 'author', 'artist']
    })

    if (result && result.data) {
      return result.data.map(item => {
        const title = item.attributes.title.en || Object.values(item.attributes.title)[0] || 'Unknown';
        const author = this.extractAuthor(item.relationships);
        const status = item.attributes.status;
        const year = item.attributes.year;
        const mainCover = this.extractMainCover(item.relationships, item.id);
        const covers = mainCover ? [{ url: mainCover }] : [];

        return new Manga({
          source: this.key,
          id: item.id,
          name: title,
          author,
          status,
          year,
          covers
        });
      });
    }

    return [];
  }

  async getMangaCovers(manga: IManga): Promise<Array<{ volume?: string; url: string }>> {
    const result = await this._request<MangaDex.API.CoverList>('/cover', {
      'manga[]': [String(manga.id)],
      limit: '100'
    });

    if (!result || !result.data) return [];

    return result.data.map(cover => ({
      volume: cover.attributes.volume,
      url: `${this.imageDomain}/covers/${manga.id}/${cover.attributes.fileName}`
    }));
  }

  async getChapters(manga: IManga, offset = 0): Promise<Array<IChapter>> {
    const limit = 96;

    const result = await this._request<MangaDex.API.ChapterList>(`/manga/${manga.id}/feed`, {
      limit: String(limit),
      offset: String(offset),
      "translatedLanguage[]": "en",
      "order[chapter]": "asc"
    });

    if (!result || !result.data) return [];

    const chapters = result.data.map(item => ({
      id: item.id,
      number: parseFloat(item.attributes.chapter) || 0,
      name: item.attributes.title || `Chapter ${item.attributes.chapter}`,
      images: []
    }));

    if (offset + chapters.length >= result.total) {
      return chapters;
    }

    await this.delay();
    const nextChapters = await this.getChapters(manga, offset + limit);
    return [...chapters, ...nextChapters];
  }

  async getChapterPages(chapter: IChapter): Promise<Array<{ url: string }>> {
    const result = await this._request<MangaDex.API.ChapterPages>(`/at-home/server/${chapter.id}`, {});

    if (result && result.chapter && result.baseUrl) {
      const baseUrl = result.baseUrl;
      const hash = result.chapter.hash;
      const files = result.chapter.data;

      return files.map(file => ({
        url: `${baseUrl}/data/${hash}/${file}`
      }));
    }

    return [];
  }
}
