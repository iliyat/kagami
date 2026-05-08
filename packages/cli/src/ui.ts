import inquirer from 'inquirer';
import { IManga, IPlugin } from '@kagami-cli/plugin';

export async function selectSources(availableSources: string[]): Promise<string[]> {
  const answer = await inquirer.prompt({
    type: 'checkbox',
    name: 'sources',
    message: 'Select sources to search:',
    choices: availableSources.map(key => ({
      name: key,
      value: key,
      checked: true
    }))
  });

  return answer.sources as string[];
}

export async function selectManga(results: Array<IManga>, plugins: Record<string, IPlugin>): Promise<IManga[]> {
  if (results.length === 0) {
    console.log('No results found.');
    return [];
  }

  const answer = await inquirer.prompt({
    type: 'checkbox',
    name: 'selected',
    message: 'Select manga to download:',
    pageSize: process.stdout.rows - 4 || 20,
    choices: results.map((manga, idx) => {
      const name = Array.isArray(manga.name) ? manga.name[0] : manga.name;
      const chapterCount = manga.chapters ?? '?';

      return {
        name: `${idx + 1}. [${manga.source}] ${name} (${chapterCount} chapters)`,
        value: manga,
        short: name
      };
    }),
    validate: (answers: IManga[]) => {
      if (answers.length === 0) {
        return 'Please select at least one manga';
      }
      return true;
    }
  });

  return answer.selected as IManga[];
}

export async function confirmDownload(manga: IManga): Promise<boolean> {
  const name = Array.isArray(manga.name) ? manga.name[0] : manga.name;
  const answer = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmed',
    message: `Download "${name}" from ${manga.source}?`,
    default: true
  });
  return answer.confirmed;
}
