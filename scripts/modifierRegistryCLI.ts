#!/usr/bin/env tsx
import { Command } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  getAllRegisteredModifiers,
  getModifiersByScope,
  getModifiersByStat,
  registerModifiers,
} from '../src/balancing/config/idleVillage/gameplayModifierRegistry';
import { ModifierBuilder } from '../src/balancing/modifiers/modifierBuilder';
import { GameplayModifierSchema, type GameplayModifier } from '../src/balancing/types/gameplayModifierTypes';

const program = new Command();

program.name('modifier-registry').description('CLI for the Gameplay Modifier Registry').version('1.0.0');

program
  .command('list')
  .description('List all registered modifiers, optionally filtered by scope or stat')
  .option('-s, --scope <scope>', 'filter by scope (GLOBAL, SESSION, LOCATION, QUEST, RESIDENT)')
  .option('-S, --stat <stat>', 'filter by stat id')
  .option('-o, --output <file>', 'write JSON output to file')
  .action((options) => {
    const modifiers = options.scope
      ? getModifiersByScope(options.scope, options.stat)
      : options.stat
        ? getModifiersByStat(options.stat)
        : getAllRegisteredModifiers();

    const payload = modifiers.map((m: GameplayModifier) => ({
      id: m.id,
      statId: m.statId,
      operation: m.operation,
      scope: m.scope,
      value: m.value,
      sourceConfigId: m.sourceConfigId,
      owner: m.owner,
    }));

    const json = JSON.stringify(payload, null, 2);
    if (options.output) {
      writeFile(options.output, json, 'utf8').then(() => console.log(`Wrote ${payload.length} modifiers to ${options.output}`));
    } else {
      console.log(json);
    }
  });

program
  .command('validate')
  .description('Validate a JSON file containing GameplayModifier objects')
  .argument('<file>', 'JSON file to validate')
  .action(async (file) => {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    const modifiers = Array.isArray(parsed) ? parsed : [parsed];
    const errors: string[] = [];
    for (const modifier of modifiers) {
      const result = GameplayModifierSchema.safeParse(modifier);
      if (!result.success) {
        errors.push(`Modifier ${modifier.id ?? '<unknown>'}: ${result.error.message}`);
      }
    }

    if (errors.length > 0) {
      console.error('Validation failed:');
      for (const error of errors) {
        console.error(`  - ${error}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(`Validated ${modifiers.length} modifier(s) successfully.`);
  });

program
  .command('register')
  .description('Register modifiers from a JSON file into the in-memory registry')
  .argument('<file>', 'JSON file with modifiers to register')
  .option('-m, --merge', 'merge with existing registry instead of replacing')
  .action(async (file, options) => {
    const raw = await readFile(file, 'utf8');
    const modifiers = JSON.parse(raw);
    registerModifiers(modifiers, { merge: options.merge });
    console.log(`Registered ${modifiers.length} modifier(s). Total now ${getAllRegisteredModifiers().length}.`);
  });

program
  .command('example')
  .description('Print an example modifier built with the fluent builder')
  .action(() => {
    const modifier = new ModifierBuilder()
      .forStat('stat_core_focus')
      .add(5)
      .inScope('LOCATION')
      .ownedBy('building', 'barracks', 'Barracks')
      .fromConfig('idleVillage.modifiers.barracksLvl1')
      .withLifetime('SESSION')
      .withTags('barracks')
      .build();

    console.log(JSON.stringify(modifier, null, 2));
  });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  program.parse(process.argv);
}

export { program };
