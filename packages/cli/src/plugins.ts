import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IPlugin } from "@kagami-cli/plugin";

const execAsync = promisify(exec);

function instantiatePlugin(PluginModule: any): IPlugin | null {
  // Try different export patterns
  const PluginClass =
    PluginModule.default ||                    // ES module default export
    PluginModule.MangaDexPlugin ||             // Named export (mangadex)
    PluginModule.MangaLibPlugin ||              // Named export (mangalib)
    PluginModule;                              // Direct export

  try {
    const plugin = new PluginClass();
    if (plugin.key && plugin.search) {
      return plugin;
    }
  } catch {
    // If instantiation fails, try to find a class that can be instantiated
    for (const key of Object.keys(PluginModule)) {
      try {
        const cls = (PluginModule as any)[key];
        if (typeof cls === 'function') {
          const plugin = new cls();
          if (plugin.key && plugin.search) {
            return plugin;
          }
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

export async function discoverPlugins(): Promise<Record<string, IPlugin>> {
  const cwd = process.cwd();
  const nodeModules = path.join(cwd, 'node_modules');
  const plugins: Record<string, IPlugin> = {};

  if (!fs.existsSync(nodeModules)) return plugins;

  // Check @kagami-cli scope
  const kagamiScope = path.join(nodeModules, '@kagami-cli');
  if (fs.existsSync(kagamiScope)) {
    const dirs = fs.readdirSync(kagamiScope);
    for (const dir of dirs) {
      if (dir.startsWith('plugin-')) {
        try {
          const pkgPath = path.join(kagamiScope, dir);
          const PluginModule = require(pkgPath);
          const plugin = instantiatePlugin(PluginModule);
          if (plugin) {
            plugins[plugin.key] = plugin;
          }
        } catch (e) {
          console.warn(`Failed to load plugin @kagami-cli/${dir}:`, e);
        }
      }
    }
  }

  // Check unscoped kagami-plugin-*
  const allDirs = fs.readdirSync(nodeModules);
  for (const dir of allDirs) {
    if (dir.startsWith('kagami-plugin-')) {
      try {
        const pkgPath = path.join(nodeModules, dir);
        const PluginModule = require(pkgPath);
        const plugin = instantiatePlugin(PluginModule);
        if (plugin) {
          plugins[plugin.key] = plugin;
        }
      } catch (e) {
        console.warn(`Failed to load plugin ${dir}:`, e);
      }
    }
  }

  return plugins;
}

export async function installPlugin(sourceName: string) {
  if (sourceName.startsWith('.') || path.isAbsolute(sourceName)) {
    if (!fs.existsSync(sourceName)) {
      console.error(`Path not found: ${sourceName}`);
      return;
    }
    try {
      await execAsync(`npm install ${sourceName}`);
      console.log(`✓ Installed from ${sourceName}`);
      return;
    } catch (e: any) {
      console.error(`Failed to install from path:`, e.message);
      return;
    }
  }

  const candidates = [
    `@kagami-cli/plugin-${sourceName}`,
    `kagami-cli-plugin-${sourceName}`
  ];

  for (const pkg of candidates) {
    try {
      await execAsync(`npm view ${pkg}`);
      console.log(`Installing ${pkg}...`);
      await execAsync(`npm install ${pkg}`);
      console.log(`✓ Installed ${pkg}`);
      return;
    } catch {
      continue;
    }
  }

  console.error(`Plugin "${sourceName}" not found. Tried:`);
  for (const pkg of candidates) {
    console.error(`  - ${pkg}`);
  }
  console.error(`\nFor local plugins, use: kagami install <path>`);
}
