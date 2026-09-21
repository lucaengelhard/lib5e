import * as z from "zod";
import {
  CORE,
  type Infer,
  Schema,
  type SchemaNode,
  type ZodNode,
} from "@lucaengelhard/libttrpg";

export type Ability = Infer<typeof Ability>;
export const Ability: Schema<
  "Ability",
  { name: z.ZodString; base: z.ZodOptional<z.ZodNumber> }
> = Schema(
  "Ability",
  () => ({ name: z.string(), base: z.number().int().gte(0).optional() }),
);

export type Skill = Infer<typeof Skill>;
export const Skill: Schema<"Skill", {
  name: z.ZodString;
  ability: z.ZodString;
  hasPassive: z.ZodOptional<z.ZodBoolean>;
}> = Schema("Skill", () => ({
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
export const Proficiency: Schema<"Proficiency", {
  target: z.ZodUnion<(ZodNode<"Query"> | ZodNode<"Selector">)[]>;
  value: typeof ProficiencyValue;
}> = Schema("Proficiency", (node) => ({
  target: z.union([CORE.QUERY(node), CORE.SELECTOR(node)]),
  value: ProficiencyValue,
}));

export type Class = Infer<typeof Class>;
export const Class: Schema<"Class", {
  name: z.ZodString;
  dice: z.ZodUnion<
    [z.ZodLiteral<6>, z.ZodLiteral<8>, z.ZodLiteral<10>, z.ZodLiteral<12>]
  >;
  level: z.ZodOptional<z.ZodNumber>;
  saves: z.ZodArray<z.ZodString>;
  value: SchemaNode;
  isMain: z.ZodOptional<z.ZodBoolean>;
  hpRolls: z.ZodOptional<z.ZodRecord<z.ZodNumber, z.ZodNumber>>;
}> = Schema("Class", (node) => ({
  name: z.string(),
  dice: z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
  value: node,
  level: z.number().int().gt(0).lte(20).optional(),
  saves: z.array(z.string()),
  isMain: z.boolean().optional(),
  hpRolls: z.record(z.number(), z.number()).optional(),
}));

export type Item = Infer<typeof Item>;
export const Item: Schema<"Item", {
  name: z.ZodString;
  equipped: z.ZodOptional<z.ZodBoolean>;
  needsAttunement: z.ZodOptional<z.ZodBoolean>;
  attuned: z.ZodOptional<z.ZodBoolean>;
  effect: SchemaNode;
}> = Schema("Item", (node) => ({
  name: z.string(),
  equipped: z.boolean().optional(),
  needsAttunement: z.boolean().optional(),
  attuned: z.boolean().optional(),
  effect: node,
}));

export type Armor = Infer<typeof Armor>;
export const Armor: Schema<
  "Armor",
  {
    kind: z.ZodString;
    name: z.ZodString;
    base: z.ZodNumber;
    calculation: z.ZodOptional<SchemaNode>;
    effect: z.ZodOptional<SchemaNode>;
    // TODO respect kind proficiency???
  }
> = Schema(
  "Armor",
  (node) => ({
    kind: z.string(),
    name: z.string(),
    base: z.number(),
    calculation: node.optional(),
    effect: node.optional(),
  }),
);
