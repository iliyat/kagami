export namespace MangaDex {
  export namespace Entity {
    export type Manga = {
      id: string;
      attributes: {
        title: Record<string, string>;
        altTitles?: Array<Record<string, string>>;
        description?: Record<string, string>;
        status?: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
        year?: number;
        contentRating?: string;
        originalLanguage?: string;
        tags?: Array<{ id: string; type: string; attributes: Record<string, any> }>;
      };
      relationships?: Array<{
        id: string;
        type: string;
        attributes?: {
          name?: string;
          fileName?: string;
        };
      }>;
    }

    export type Chapter = {
      id: string;
      attributes: {
        chapter: string;
        title: string;
        pages: number;
      }
    }

    export type Cover = {
      id: string;
      attributes: {
        fileName: string;
        volume?: string;
        description?: string;
      };
      relationships?: Array<{
        id: string;
        type: string;
      }>;
    }
  }

  export namespace API {
    export type SearchResult = {
      data: Array<MangaDex.Entity.Manga>;
      limit: number;
      offset: number;
      response: "collection" | unknown;
      result: "ok" | unknown;
      total: number;
    }

    export type Pagination = {
      limit: number;
      offset: number;
      total: number;
    }

    export type ChapterList = {
      result: string;
      data: Array<{
        id: string;
        attributes: {
          chapter: string;
          title: string;
          pages: number;
        }
      }>;
    } & Pagination

    export type ChapterPages = {
      result: string;
      baseUrl: string;
      chapter: {
        hash: string;
        data: Array<string>;
      }
    }

    export type MangaResult = {
      result: string;
      data: MangaDex.Entity.Manga;
    }

    export type CoverList = {
      result: string;
      data: Array<MangaDex.Entity.Cover>;
    } & Pagination
  }
}
