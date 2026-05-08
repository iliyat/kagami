import { IManga } from "./types";

export abstract class RestPlugin {
  protected endpoint: string = '';
  protected headers: Record<string, string> = {};
  protected delayMs: number = 1000;
  domains: Array<string> = [];
  imageDomain: string = '';

  delay(ms?: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms ?? this.delayMs));
  }

  protected async _fetch(url: string): Promise<Response | undefined> {
    try {
      return await fetch(url, { headers: this.headers });
    } catch (err) {
      console.error(`Request failed for ${url}:`, err);
      return undefined;
    }
  }

  protected async _request<T>(path: string, search: Record<string, string | Array<string>>): Promise<T | undefined> {
    const url = new URL(path, this.endpoint);
    Object.keys(search).forEach(key => {
      const value = search[key];
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    })

    const response = await this._fetch(url.href);
    if (!response) return undefined;

    if (!response.ok) {
      console.error(`HTTP ${response.status} for ${url.href}`);
      return undefined;
    }

    try {
      return await response.json() as T;
    } catch (err) {
      console.error(`Invalid JSON from ${url.href}:`, err);
      return undefined;
    }
  }

  async downloadImage(url: string): Promise<ArrayBuffer> {
    const response = await this._fetch(url);
    if (!response || !response.ok) {
      throw new Error(`Failed to download image: ${url} (HTTP ${response?.status})`);
    }
    return response.arrayBuffer();
  }

  matchUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.domains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  extractMangaId(url: string): string | null {
    return null;
  }

  async getMangaInfo(mangaId: string): Promise<Partial<IManga> | null> {
    return null;
  }

  async getMangaCovers(manga: any): Promise<Array<{ volume?: string; url: string }>> {
    return [];
  }
}
