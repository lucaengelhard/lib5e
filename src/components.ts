import {
  type BaseNode,
  CORE_NODES,
  type CoreNode,
  CoreNodeFactory,
  createFactory,
  desugar,
  type Factory,
  type Handlers,
  NodeSchema,
  SUGAR_HANDLERS,
  z,
  type ZodNode,
} from "@lucaengelhard/libttrpg";
import { Child } from "../../libttrpg/src/system/schema.ts";

const {
  LITERAL,
  VALUE,
  BINARYOPERATION,
  UNARYOPERATION,
  GET,
  MODIFIER,
  MULTIPLE,
  QUERY,
} = CoreNodeFactory;

export const GLOBAL_VALUES: Record<
  string,
  Extract<CoreNode, { name?: string }>
> = {
  LEVEL: VALUE({
    name: "stats.level",
    value: LITERAL({ value: 0 }),
  }),
  PROFICIENCY_BONUS: VALUE({
    name: "stats.proficiencyBonus",
    value: BINARYOPERATION({
      kind: "ADD",
      left: LITERAL({ value: 1 }),
      right: UNARYOPERATION({
        kind: "CEIL",
        value: BINARYOPERATION({
          kind: "MULTIPLY",
          left: LITERAL({ value: 1 / 4 }),
          right: GET({ query: "stats.level" }),
        }),
      }),
    }),
  }),
  WALKING_SPEED: VALUE({
    name: "stats.speed.walking",
    value: LITERAL({ value: 0 }),
  }),
  CLIMBING_SPEED: VALUE({
    name: "stats.speed.climbing",
    value: LITERAL({ value: 0 }),
  }),
  SWIMMING_SPEED: VALUE({
    name: "stats.speed.swimming",
    value: LITERAL({ value: 0 }),
  }),
  FLYING_SPEED: VALUE({
    name: "stats.speed.flying",
    value: LITERAL({ value: 0 }),
  }),
};

export const GLOBAL_VALUE_NAMES = Object
  .fromEntries(
    Object.entries(GLOBAL_VALUES).map((
      [key, value],
    ) => [key, value.name] as const),
  ) as Readonly<Record<keyof typeof GLOBAL_VALUES, string>>;

type Ability = z.infer<typeof Ability>;
const Ability: ZodNode<"Ability", { name: z.ZodString; base: z.ZodNumber }> =
  NodeSchema(
    "Ability",
    { name: z.string(), base: z.number().int().gte(0) },
  );

type Skill = z.infer<typeof Skill>;
const Skill: ZodNode<"Skill", {
  name: z.ZodString;
  ability: z.ZodString;
  hasPassive: z.ZodOptional<z.ZodBoolean>;
}> = NodeSchema("Skill", {
  name: z.string(),
  ability: z.string(),
  hasPassive: z.boolean().optional(),
});

const PROFICIENCY_VALUES = [0.5, 1, 2] as const;
export type ProficiencyValue = typeof PROFICIENCY_VALUES[number];
const ProficiencyValue: z.ZodUnion<z.ZodLiteral<ProficiencyValue>[]> = z.union(
  PROFICIENCY_VALUES.map((o) => z.literal(o)),
);

type Proficiency = z.infer<typeof Proficiency>;
const Proficiency: ZodNode<"Proficiency", {
  target: ZodNode<"Query" | "Selector">;
  value: typeof ProficiencyValue;
}> = NodeSchema("Proficiency", {
  target: Child("Query", "Selector"),
  value: ProficiencyValue,
});

type Class = z.infer<typeof Class>;
const Class: ZodNode<"Class", {
  name: z.ZodString;
  value: ZodNode;
  level: z.ZodNumber;
}> = NodeSchema("Class", {
  name: z.string(),
  value: Child(),
  level: z.number().int().gt(1).lte(20),
});

export const COMPONENT_NODES = [Ability, Skill, Proficiency, Class] as const;

export type ComponentNode = z.infer<typeof ComponentNode>;
export const ComponentNode: z.ZodUnion<typeof COMPONENT_NODES> = z.union(
  COMPONENT_NODES,
);

export type Nodes = ComponentNode | CoreNode;

export const ComponentFactory: Factory<ComponentNode | CoreNode> =
  createFactory(
    ...COMPONENT_NODES,
    ...CORE_NODES,
  );

const COMPONENT_HANDLERS: Handlers<ComponentNode, CoreNode> = {
  PROFICIENCY: (node) =>
    MODIFIER({
      value: LITERAL({ value: node.value }),
      target: node.target,
    }),
  ABILITY: (node) =>
    MULTIPLE({
      values: [
        VALUE({
          name: `abilities.${node.name}`,
          value: LITERAL({ value: node.base }),
        }),
        VALUE({
          name: `modifiers.${node.name}`,
          value: UNARYOPERATION({
            kind: "FLOOR",
            value: BINARYOPERATION({
              kind: "DIVIDE",
              left: BINARYOPERATION({
                kind: "SUBTRACT",
                left: GET({ query: `abilities.${node.name}` }),
                right: LITERAL({ value: 10 }),
              }),
              right: LITERAL({ value: 2 }),
            }),
          }),
        }),
        VALUE({
          name: `saves.${node.name}`,
          value: GET({ query: `modifiers.${node.name}` }),
        }),
        MODIFIER({
          value: BINARYOPERATION({
            kind: "MULTIPLY",
            left: BINARYOPERATION({
              kind: "MAX",
              left: LITERAL({ value: 0 }),
              right: VALUE({
                name: `proficiencies.saves.${node.name}`,
                reduceKind: "MAX",
                value: LITERAL({ value: 0 }),
              }),
            }),
            right: GET({
              query: GLOBAL_VALUE_NAMES.PROFICIENCY_BONUS,
            }),
          }),
          target: QUERY({ query: `saves.${node.name}` }),
        }),
      ],
    }),
  SKILL: (node) => {
    const passive = node.hasPassive
      ? [
        VALUE({
          name: `passives.${node.name}`,
          value: BINARYOPERATION({
            kind: "ADD",
            left: LITERAL({ value: 10 }),
            right: GET({ query: `skills.${node.name}` }),
          }),
        }),
      ]
      : [];

    return MULTIPLE({
      values: [
        VALUE({
          name: `skills.${node.name}`,
          value: GET({ query: `modifiers.${node.ability}` }),
        }),
        MODIFIER({
          value: BINARYOPERATION({
            kind: "MULTIPLY",
            left: VALUE({
              name: `proficiencies.skills.${node.name}`,
              reduceKind: "MAX",
              value: LITERAL({ value: 0 }),
            }),
            right: GET({ query: GLOBAL_VALUE_NAMES.PROFICIENCY_BONUS }),
          }),
          target: QUERY({ query: `skills.${node.name}` }),
        }),
        ...passive,
      ],
    });
  },
  CLASS: (node) =>
    MULTIPLE({
      values: [
        MODIFIER({
          target: QUERY({ query: GLOBAL_VALUE_NAMES.LEVEL }),
          value: VALUE({
            name: `classes.${node.name}.level`,
            value: LITERAL({ value: node.level }),
          }),
        }),
        node.value,
      ],
    }),
};

export function desugarComponent(
  node: Nodes,
): BaseNode {
  const sugar = desugar(node, COMPONENT_HANDLERS);
  return desugar(sugar, SUGAR_HANDLERS);
}
