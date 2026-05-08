import { IManga, IPlugin } from "@kagami/plugin";

export async function prepareManga(manga: IManga, plugin: IPlugin, writeStatus?: (msg: string) => void): Promise<void> {
  const status = writeStatus || ((msg: string) => {});
  const mangaName = Array.isArray(manga.name) ? manga.name[0] : manga.name;

  // Fetch detailed manga info
  status(`| \x1b[33m${mangaName}\x1b[0m: fetching info...`);
  try {
    const info = await plugin.getMangaInfo(String(manga.id));
    if (info) {
      if (info.author) manga.author = info.author;
      if (info.status) manga.status = info.status;
      if (info.year) manga.year = info.year;
      if (info.covers) manga.covers = info.covers;
    }
  } catch (err) {
    // Ignore errors for optional info
  }

  // Fetch covers (via separate API)
  try {
    const covers = await plugin.getMangaCovers(manga);
    if (covers && covers.length > 0) {
      manga.covers = covers;
    }
  } catch (err) {
    // Ignore errors for optional covers
  }

  // Fetch chapters
  status(`| \x1b[33m${mangaName}\x1b[0m: fetching chapters...`);
  try {
    const chapters = await plugin.getChapters(manga);
    manga.chapters = chapters.length;
    status(`| \x1b[33m${mangaName}\x1b[0m: \x1b[32m${chapters.length} ✓\x1b[0m`);
  } catch (err: unknown) {
    const error = err as Error;
    manga.chapters = undefined;
    status(`| \x1b[33m${mangaName}\x1b[0m: \x1b[31m? (error)\x1b[0m`);
    if (err instanceof SyntaxError) {
      console.error(`\n  Error: Invalid response from ${manga.source} - possible 403/404/network error`);
    }
  }
  await plugin.delay();
}

export async function searchManga(query: string, sources: string[], plugins: Record<string, IPlugin>): Promise<Array<IManga>> {
  const allResults: Array<IManga> = [];
  let totalResults = 0;

  const writeStatus = (msg: string) => {
    process.stdout.write(`\r\x1b[2K${msg}`);
  };

  writeStatus(`Searching for "${query}"...`);
  for (const source of sources) {
    const plugin = plugins[source];
    try {
      writeStatus(`[\x1b[32m${source}\x1b[0m: searching...`);
      const results = await plugin.search(query);
      writeStatus(`[\x1b[32m${source}\x1b[0m: ${results.length} found`);

      for (let i = 0; i < results.length; i++) {
        const manga = results[i];
        await prepareManga(manga, plugin, (msg) => {
          const mangaName = Array.isArray(manga.name) ? manga.name[0] : manga.name;
          writeStatus(`[\x1b[32m${source}\x1b[0m: ${results.length} found ${msg}`);
        });
      }

      allResults.push(...results);
      totalResults += results.length;
      writeStatus(`[\x1b[32m${source}\x1b[0m: ${results.length} found]`);

      await plugin.delay();
      } catch (err: unknown) {
        const error = err as Error;
        writeStatus(`[\x1b[31m${source}\x1b[0m: error - ${error.message || err}]`);
        if (err instanceof SyntaxError) {
          console.error(`\n  (Invalid JSON response from ${source} - possible 403/404/network error)`);
        }
      }
    }

    process.stdout.write(`\nFound ${totalResults} results total\n\n`);
    return allResults;
  }
