import * as z from "@zod/zod";
import { CORE, type Infer, Schema } from "@lucaengelhard/libttrpg";

export type Ability = Infer<typeof Ability>;
export const Ability = Schema(
  "Ability",
  () => ({ name: z.string(), base: z.number().int().gte(0).optional() }),
);

export type Skill = Infer<typeof Skill>;
export const Skill = Schema("Skill", () => ({
  name: z.string(),
  ability: z.string(),
  hasPassive: z.boolean().optional(),
}));

const PROFICIENCY_VALUES = [0.5, 1, 2] as const;
export type ProficiencyValue = typeof PROFICIENCY_VALUES[number];
const ProficiencyValue: z.ZodUnion<z.ZodLiteral<ProficiencyValue>[]> = z.union(
  PROFICIENCY_VALUES.map((o) => z.literal(o)),
);

export type Proficiency = Infer<typeof Proficiency>;
export const Proficiency = Schema("Proficiency", (node) => ({
  target: z.union([CORE.QUERY(node), CORE.SELECTOR(node)]),
  value: ProficiencyValue,
}));

export type Class = Infer<typeof Class>;
export const Class = Schema("Class", (node) => ({
  name: z.string(),
  dice: z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
  value: node,
  level: z.number().int().gt(0).lte(20).optional(),
  saves: z.array(z.string()),
  isMain: z.boolean().optional(),
  hpRolls: z.record(z.number(), z.number()).optional(),
}));

export type Item = Infer<typeof Item>;
export const Item = Schema("Item", (node) => ({
  name: z.string(),
  equipped: z.boolean().optional(),
  needsAttunement: z.boolean().optional(),
  attuned: z.boolean().optional(),
  effect: node.optional(),
}));

export type Armor = Infer<typeof Armor>;
export const Armor = Schema(
  "Armor",
  (node) => ({
    kind: z.string(),
    name: z.string(),
    base: z.number(),
    calculation: node.optional(),
    equipped: z.boolean().optional(),
    needsAttunement: z.boolean().optional(),
    attuned: z.boolean().optional(),
    effect: node.optional(),
  }),
);
