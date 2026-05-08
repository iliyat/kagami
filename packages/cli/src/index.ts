#!/usr/bin/env node
import { IManga } from "@kagami-cli/plugin";
import { selectSources, selectManga, confirmDownload } from './ui';
import { downloadManga } from './download';
import { searchManga, prepareManga } from './search';
import { discoverPlugins, installPlugin } from './plugins';
import { parseArgs, showUsage, showInstallHelp } from './args';

async function main() {
  // Clear terminal and use full height
  process.stdout.write('\x1b[2J\x1b[0;0H');

  const options = parseArgs();

  if (options.help) {
    showUsage();
    return;
  }

  if (options.install !== undefined) {
    const sourceName = options.install;
    if (!sourceName) {
      showUsage();
      return;
    }
    await installPlugin(sourceName);
    return;
  }

  const query = options.query ? options.query.join(' ') : null;
  const link = options.link || null;

  if (!query && !link) {
    showUsage();
    return;
  }

  const plugins = await discoverPlugins();

  if (Object.keys(plugins).length === 0) {
    showInstallHelp();
    return;
  }

  if (link) {
    const plugin = Object.values(plugins).find(p => p.matchUrl(link));
    if (!plugin) {
      console.log('Unsupported URL or source not found.');
      return;
    }

    const mangaId = plugin.extractMangaId(link);
    if (!mangaId) {
      console.log('Could not extract manga ID from URL.');
      return;
    }

    const mangaInfo = await plugin.getMangaInfo(mangaId);
    const manga: IManga = {
      source: plugin.key,
      id: mangaId,
      name: mangaInfo?.name ?? mangaId
    };

    await prepareManga(manga, plugin);

    let chapters: Array<{ id: string | number; number: number; name: string | Array<string> | undefined }> = [];

    try {
      chapters = await plugin.getChapters(manga);
      manga.chapters = chapters.length;
    } catch (err) {
      console.error('Error fetching manga info:', err);
      return;
    }

    console.log(`\nFound: ${manga.name} (${chapters.length} chapters)`);

    const confirmed = await confirmDownload(manga);
    if (!confirmed) return;

    await downloadManga(manga, plugin);
    return;
  }

  const sources = await selectSources(Object.keys(plugins));
  if (sources.length === 0) {
    console.log('No sources selected.');
    return;
  }

  const results = await searchManga(query, sources, plugins);

  if (results.length === 0) {
    console.log('No results found. Try a different query.');
    return;
  }

  const selected = await selectManga(results, plugins);

  for (const manga of selected) {
    const plugin = plugins[manga.source];
    if (plugin) {
      await downloadManga(manga, plugin);
    }
  }
}

main().catch(err => {
  if (err?.name === 'ExitPromptError') {
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
