import { Manga } from "@kagami/plugin";
import { MangaLib } from "./types";
import { RestPlugin } from "@kagami/plugin";
import { IPlugin, IManga, IChapter } from "@kagami/plugin";

export class MangaLibPlugin extends RestPlugin implements IPlugin {
  private readonly siteId = 1;
  key = "mangalib";
  name = "MangaLib";
  domains = ["mangalib.me", "mangalib.org"];
  imageDomain = "https://img3.mixlib.me";

  constructor() {
    super();
    this.endpoint = 'https://api.cdnlibs.org';
    // Required headers to avoid 403 errors
    this.headers = {
      'Site-Id': String(this.siteId),
      'Referer': 'https://mangalib.me/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json'
    };
  }

  extractMangaId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const match = urlObj.pathname.match(/\/manga\/([^\/]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  async getMangaInfo(mangaId: string): Promise<Pick<IManga, 'name' | 'author' | 'status' | 'year' | 'covers'> | null> {
    const result = await this._request<MangaLib.API.Manga>(`/api/manga/${mangaId}`, {});
    if (!result || !result.data) return null;

    const manga = result.data;
    const name = manga.name || manga.eng_name || manga.rus_name || 'Unknown';
    const author = manga.authors?.map(a => a.name).join(', ') || undefined;
    const year = manga.releaseDate ? parseInt(manga.releaseDate) : undefined;

    // Handle status - it's an object with id and label
    const status = typeof manga.status === 'object' && manga.status?.label
      ? manga.status.label
      : undefined;

    // Covers will be fetched separately via getMangaCovers()

    return { name, author, year, status };
  }

  async search(query: string): Promise<Array<IManga>> {
    const result = await this._request<MangaLib.API.SearchResult>("/api/manga", {
      "q": query,
      "site_id[]": String(this.siteId)
    });

    if (result && result.data) {
      return result.data.slice(0, 5).map(item => {
        const name = item.name || item.eng_name || item.rus_name || 'Unknown';
        const year = item.releaseDate ? parseInt(item.releaseDate) : undefined;
        const covers = [];
        if (item.cover?.default) {
          covers.push({ url: item.cover.default });
        }

        return new Manga({
          source: this.key,
          id: item.slug_url || item.id,
          name,
          year,
          covers
        });
      });
    }

    return [];
  }

  async getMangaCovers(manga: IManga): Promise<Array<{ volume?: string; url: string }>> {
    const slug = typeof manga.id === 'string' && manga.id.includes('--') ? manga.id : manga.id;
    const result = await this._request<MangaLib.API.MangaCovers>(`/api/manga/${slug}/covers`, {});

    if (!result || !result.data) return [];

    return result.data.map(vc => {
      let coverUrl: string;
      if (typeof vc.cover === 'object' && vc.cover) {
        // Try orig > md > default (in order of quality)
        coverUrl = vc.cover.orig || vc.cover.md || vc.cover.default || '';
      } else if (typeof vc.cover === 'string') {
        // If it's just a filename, construct URL
        coverUrl = `${this.imageDomain}/covers/${vc.cover}`;
      } else {
        coverUrl = '';
      }
      return {
        volume: vc.info,
        url: coverUrl
      };
    }).filter(item => item.url !== '');
  }

  async getChapters(manga: IManga): Promise<Array<IChapter>> {
    const slug = typeof manga.id === 'string' && manga.id.includes('--') ? manga.id : manga.id;
    const result = await this._request<MangaLib.API.ChapterList>(`/api/manga/${slug}/chapters`, {});

    if (result && result.data) {
      return result.data.map(item => ({
        id: item.id,
        number: parseFloat(item.number) || 0,
        name: item.name || `Chapter ${item.number}`,
        images: [],
        volume: item.volume || "1",
        mangaId: slug as string
      }));
    }

    return [];
  }

  async getChapterPages(chapter: IChapter): Promise<Array<{ url: string }>> {
    const slug = chapter.mangaId as string;
    const result = await this._request<any>(`/api/manga/${slug}/chapter`, {
      "number": String(chapter.number),
      "volume": String(chapter.volume || "1")
    });

      if (result && result.data && result.data.pages) {
      return result.data.pages.map((page: any) => ({
        url: `${this.imageDomain}${page.url}`
      }));
    }
    return [];
  }
}
