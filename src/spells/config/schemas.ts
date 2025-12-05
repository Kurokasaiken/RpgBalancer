import { z } from 'zod';

// --- Shared primitives ---

const idSchema = z
  .string()
  .min(1, 'ID obbligatorio')
  .regex(/^[a-zA-Z0-9_\-]+$/, 'Usa solo lettere, numeri, _ e -');

const nonEmptyString = z.string().min(1, 'Campo obbligatorio');

// --- SpellDefinition ---

export const SpellComponentsSchema = z.object({
  v: z.boolean(),
  s: z.boolean(),
  m: z.string().min(1).nullable(),
});

export const SpellDefinitionSchema = z
  .object({
    id: idSchema,
    name: nonEmptyString,
    description: nonEmptyString,
    school: z.enum([
      'evocation',
      'abjuration',
      'conjuration',
      'divination',
      'enchantment',
      'illusion',
      'necromancy',
      'transmutation',
    ]),
    level: z
      .number()
      .int('Il livello deve essere un intero')
      .min(0, 'Livello minimo 0')
      .max(9, 'Livello massimo 9'),
    castTime: nonEmptyString,
    range: nonEmptyString,
    components: SpellComponentsSchema,
    duration: nonEmptyString,

    baseDamage: z.number(),
    scaling: z.number(),
    areaOfEffect: z.number(),
    saveDC: z.number(),

    isDerived: z.boolean(),
    formula: z.string().min(1).optional(),

    icon: z.string().optional(),
    bgColor: z.string().optional(),
    isLocked: z.boolean(),
    isHidden: z.boolean(),
  })
  .refine(
    (spell) => {
      // Se è derived deve avere formula; se non è derived, formula opzionale o assente
      if (spell.isDerived) {
        return typeof spell.formula === 'string' && spell.formula.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Le spell derivate richiedono una formula',
      path: ['formula'],
    },
  );

export type SpellDefinitionInput = z.infer<typeof SpellDefinitionSchema>;

// --- SpellCard ---

export const SpellCardSchema = z.object({
  id: idSchema,
  title: nonEmptyString,
  color: nonEmptyString,
  icon: nonEmptyString,
  spellIds: z.array(idSchema),
  isCore: z.boolean(),
  order: z.number().int(),
  isHidden: z.boolean(),
});

export type SpellCardInput = z.infer<typeof SpellCardSchema>;

// --- SpellPreset ---

export const SpellPresetSchema = z.object({
  id: idSchema,
  name: nonEmptyString,
  description: z.string().optional(),
  spellOverrides: z.record(z.string(), z.record(z.string(), z.any())),
});

export type SpellPresetInput = z.infer<typeof SpellPresetSchema>;

// --- SpellConfig ---

export const SpellConfigSchema = z.object({
  version: z.number().int().min(1),
  spells: z.record(idSchema, SpellDefinitionSchema),
  cards: z.record(idSchema, SpellCardSchema),
  presets: z.record(idSchema, SpellPresetSchema),
  activePresetId: idSchema,
});

export type SpellConfigInput = z.infer<typeof SpellConfigSchema>;
