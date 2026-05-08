export namespace MangaLib {
  export namespace Entity {
    export type Manga = {
      id: number;
      name: string;
      slug: string;
      slug_url?: string;
      rus_name?: string;
      eng_name?: string;
      releaseDate?: string;
      releaseDateString?: string;
      authors?: Array<{ name: string; slug: string; id: number }>;
      artists?: Array<{ name: string; slug: string; id: number }>;
      status?: { id: number; label: string };
      cover?: {
        filename: string;
        default: string;
        thumbnail?: string;
        md?: string;
      };
    }
  }

  export namespace API {
    export type SearchResult = {
      data: Array<{
        id: number;
        name: string;
        slug: string;
        slug_url?: string;
        rus_name?: string;
        eng_name?: string;
        releaseDate?: string;
        cover?: {
          filename: string;
          default: string;
          thumbnail?: string;
        };
      }>;
      total: number;
    }

    export type Manga = {
      data: Entity.Manga & {
        summary?: string;
      };
    }

    export type MangaCovers = {
      data: Array<{
        info: string;
        cover: string | {
          filename: string;
          default: string;
          thumbnail?: string;
          md?: string;
          orig?: string;
        };
      }>;
    }

    export type ChapterList = {
      data: Array<{
        id: number;
        number: string;
        name: string;
        volume: string;
        branches?: Array<{
          branch_id: number | null;
          teams: Array<{ id: number; name: string }>;
        }>;
      }>;
    }

    export type ChapterContent = {
      data: {
        id: number;
        number: string;
        content: null;
        pages?: Array<{ slug: number; url: string }>;
      };
    }
  }
}
