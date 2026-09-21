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
  value: SchemaNode;
  level: z.ZodOptional<z.ZodNumber>;
  saves: z.ZodArray<z.ZodString>;
  isSecondary: z.ZodOptional<z.ZodBoolean>;
}> = Schema("Class", (node) => ({
  name: z.string(),
  value: node,
  level: z.number().int().gt(0).lte(20).optional(),
  saves: z.array(z.string()),
  isSecondary: z.boolean().optional(),
}));
