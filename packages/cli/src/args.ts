import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

export const optionDefinitions = [
  { name: 'help', alias: 'h', type: Boolean, description: 'Show this help message' },
  { name: 'install', type: String, description: 'Install a plugin source (e.g. mangadex) or local path' },
  { name: 'link', type: String, description: 'Download directly from URL (e.g. https://mangadex.org/title/...)' },
  { name: 'query', type: String, multiple: true, defaultOption: true, description: 'Search query for manga' },
];

const sections = [
  {
    header: 'Kagami',
    content: 'CLI tool for downloading manga from various sources.'
  },
  {
    header: 'Usage',
    content: [
      '$ kagami <search-query>',
      '$ kagami --link=<url>',
      '$ kagami --install <sourcename>',
      '$ kagami --install <path-to-local-plugin>'
    ]
  },
  {
    header: 'Options',
    optionList: optionDefinitions.filter(opt => opt.name !== 'query')
  },
  {
    header: 'Examples',
    content: [
      '$ kagami "Toaru no Index"',
      '$ kagami --link=https://mangadex.org/title/...',
      '$ kagami --install mangadex',
    ]
  }
];

const installSections = [
  {
    header: 'No sources found',
    content: 'Add source via installation command:'
  },
  {
    header: 'Install Commands',
    optionList: optionDefinitions.filter(opt => opt.name === 'install')
  },
  {
    header: 'Examples',
    content: [
      '$ kagami --install mangadex',
      '$ kagami --install ./packages/plugin-mangadex'
    ]
  }
];

export function showUsage() {
  console.log(commandLineUsage(sections));
}

export function showInstallHelp() {
  console.log(commandLineUsage(installSections));
}

export function parseArgs() {
  return commandLineArgs(optionDefinitions, { argv: process.argv.slice(2) });
}
