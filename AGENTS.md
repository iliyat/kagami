# AGENTS.md

Repository: https://github.com/iliyat/kagami

## Monorepo Structure
- Root workspace: npm workspaces with 4 packages in `packages/`
- `@kagami-cli/plugin`: Core interfaces (IManga, IChapter, IPlugin) and base classes (RestPlugin, Provider, Manga)
- `@kagami-cli/plugin-mangadex`: MangaDex plugin implementation
- `@kagami-cli/plugin-mangalib`: MangaLib plugin implementation
- `kagami-cli`: CLI entry point with binary name `kagami`

## Build
- `npm run build` builds all packages in order (via `npm run build -w packages`)
- Each package builds to its own `dist/` directory
- TypeScript project references ensure correct build order
- Rebuild after editing any `src/` files before testing CLI

## CLI
- Entry: `npx . "<search-query>"` (from root or packages/cli)
- Binary name: `kagami`
- Interactive workflow: source selection → search → results display → manga selection → download

## Testing
- Test via `cd packages/cli && npx . "<query>"` (local test)
- Interactive prompts require real terminal input (can't test via bash tool)

## Plugins
- Each source in `packages/plugin-<name>/` extends `RestPlugin`, implements `IPlugin`
- Currently active: MangaDex (fully functional), MangaLib (fully functional with headers)
- `getChapters` and `getChapterPages` implemented for both MangaDex and MangaLib
- `getChapterPages` accepts `IChapter` object (contains id, number, mangaId, volume)
- MangaLib requires headers: `Site-Id: 1`, `Referer: https://mangalib.me/`, `User-Agent`, `Accept: application/json`
- MangaLib API: needs `volume` parameter for chapter pages (passed via IChapter object)
- To add new plugin: create `packages/plugin-<name>/`, extend RestPlugin, add to `kagami-cli` dependencies and plugins.ts

## Publishing
- Scoped packages (`@kagami-cli/*`) have `publishConfig.access: "public"` for scoped package publishing
- `kagami-cli` (unscoped) also publishes with public access
- `prepublishOnly` script runs build automatically before publish
- Publish order matters: `@kagami-cli/plugin` → `@kagami-cli/plugin-mangadex` → `@kagami-cli/plugin-mangalib` → `kagami-cli`
- Use `npm run publish-all` from root to build and publish all packages in correct order
- Or manually: `npm publish -w packages/<package-name>` for individual packages
