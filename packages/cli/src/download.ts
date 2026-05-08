import * as fs from 'fs';
import * as path from 'path';
import { IManga, IChapter, IPlugin } from '@kagami/plugin';
import { SingleBar, Presets } from 'cli-progress';

const OUTPUT_DIR = './downloads';

function getMangaName(manga: IManga): string {
  return Array.isArray(manga.name) ? manga.name[0] : manga.name;
}

export async function downloadManga(manga: IManga, plugin: IPlugin) {
  const mangaName = getMangaName(manga);
  console.log(`\nDownloading: ${mangaName} from ${manga.source}`);

  const safeName = mangaName.replace(/[\/\\:*?"<>|]/g, '_');
  const mangaDir = path.join(OUTPUT_DIR, manga.source, safeName);
  fs.mkdirSync(mangaDir, { recursive: true });

  // Download covers
  if (manga.covers && manga.covers.length > 0) {
    const coversDir = path.join(mangaDir, 'covers');
    fs.mkdirSync(coversDir, { recursive: true });

    console.log(`Downloading ${manga.covers.length} cover(s)...`);
    const coverBar = new SingleBar({}, Presets.shades_classic);
    coverBar.start(manga.covers.length, 0);

    for (let i = 0; i < manga.covers.length; i++) {
      const cover = manga.covers[i];
      const ext = cover.url.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `cover-${i + 1}.${ext}`;
      const filePath = path.join(coversDir, fileName);

      if (fs.existsSync(filePath)) {
        coverBar.update(i + 1);
        continue;
      }

      try {
        const buffer = await plugin.downloadImage(cover.url);
        fs.writeFileSync(filePath, Buffer.from(buffer));
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`\n  Error downloading cover ${fileName}: ${error.message || err}`);
      }

      coverBar.update(i + 1);
      await plugin.delay();
    }

    coverBar.stop();
    console.log(` ✓ Covers downloaded`);
  }

  console.log('Fetching chapters...');
  let chapters: Array<IChapter> = [];
  try {
    chapters = await plugin.getChapters(manga);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`  Error fetching chapters from ${manga.source}: ${error.message || err}`);
    if (err instanceof SyntaxError) {
      console.error(`  (Invalid response from ${manga.source} - possible 403/404/network error)`);
    }
  }
  await plugin.delay();

  if (!chapters || chapters.length === 0) {
    console.log('No chapters found.');
    return;
  }

  console.log(`Found ${chapters.length} chapters. Downloading...\n`);

  for (const chapter of chapters) {
    const chapterDir = path.join(mangaDir, `chapter-${chapter.number}`);
    fs.mkdirSync(chapterDir, { recursive: true });

    console.log(`Chapter ${chapter.number}: Fetching pages...`);
    let pages: Array<{ url: string }> = [];
    try {
      pages = await plugin.getChapterPages(chapter);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`  Error fetching pages for chapter ${chapter.number} from ${manga.source}: ${error.message || err}`);
      if (err instanceof SyntaxError) {
        console.error(`  (Invalid response from ${manga.source} - possible 403/404/network error)`);
      }
    }
    await plugin.delay();

    if (pages.length === 0) {
      console.log('  No pages found, skipping.');
      continue;
    }

    const bar = new SingleBar({}, Presets.shades_classic);
    bar.start(pages.length, 0);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const ext = page.url.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${String(i + 1).padStart(3, '0')}.${ext}`;
      const filePath = path.join(chapterDir, fileName);

      if (fs.existsSync(filePath)) {
        bar.update(i + 1);
        continue;
      }

      try {
        const buffer = await plugin.downloadImage(page.url);
        fs.writeFileSync(filePath, Buffer.from(buffer));
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`\nError downloading ${page.url}: ${error.message || err}`);
      }

      bar.update(i + 1);
      await plugin.delay();
    }

    bar.stop();
    console.log(` ✓ Chapter ${chapter.number} complete`);
  }

  console.log('\nDownload complete!');
}
