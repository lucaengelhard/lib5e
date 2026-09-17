import {
  type BASE_NODES,
  type BaseNode,
  desugar,
  Factory,
  type Handlers,
  type Statement,
  SUGAR_HANDLERS,
  type SugarNode,
} from "@lucaengelhard/libttrpg";

const {
  LITERAL,
  VALUE_EXPRESSION,
  VALUE_STATEMENT,
  BINARYOPERATION,
  UNARYOPERATION,
  GET,
  MODIFIER,
  MULTIPLE,
  QUERY,
} = Factory;

export const GLOBAL_VALUES = {
  LEVEL: VALUE_STATEMENT({
    name: "stats.level",
    value: LITERAL({ value: 0 }),
  }),
  PROFICIENCY_BONUS: VALUE_STATEMENT({
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
  WALKING_SPEED: VALUE_STATEMENT({
    name: "stats.speed.walking",
    value: LITERAL({ value: 0 }),
  }),
  CLIMBING_SPEED: VALUE_STATEMENT({
    name: "stats.speed.climbing",
    value: LITERAL({ value: 0 }),
  }),
  SWIMMING_SPEED: VALUE_STATEMENT({
    name: "stats.speed.swimming",
    value: LITERAL({ value: 0 }),
  }),
  FLYING_SPEED: VALUE_STATEMENT({
    name: "stats.speed.flying",
    value: LITERAL({ value: 0 }),
  }),
} as const satisfies Record<
  string,
  & Extract<BaseNode | SugarNode, { name?: string }>
  & { name: string }
>;

export const GLOBAL_VALUE_NAMES = Object
  .fromEntries(
    Object.entries(GLOBAL_VALUES).map((
      [key, value],
    ) => [key, value.name] as const),
  ) as Readonly<Record<keyof typeof GLOBAL_VALUES, string>>;

type Ability = Statement<"Ability", { name: string; base: number }>;

type Skill = Statement<
  "Skill",
  { name: string; ability: string; hasPassive?: boolean }
>;

export type ProficiencyValue = 0.5 | 1 | 2;
type Proficiency = Statement<
  "Proficiency",
  {
    target: BASE_NODES["QUERY" | "SELECTOR"];
    value: ProficiencyValue;
  }
>;

type Class = Statement<
  "Class",
  { name: string; value: Statement; level: number }
>;

type ComponentStatement = Ability | Skill | Proficiency | Class;
type ComponentExpression = never;

type ComponentNode = ComponentStatement | ComponentExpression;

export type Nodes = ComponentNode | SugarNode | BaseNode;

const COMPONENT_HANDLERS: Handlers<ComponentNode, SugarNode | BaseNode> = {
  PROFICIENCY: (node) =>
    MODIFIER({
      value: LITERAL({ value: node.value }),
      target: node.target,
    }),
  ABILITY: (node) =>
    MULTIPLE({
      values: [
        VALUE_STATEMENT({
          name: `abilities.${node.name}`,
          value: LITERAL({ value: node.base }),
        }),
        VALUE_STATEMENT({
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
        VALUE_STATEMENT({
          name: `saves.${node.name}`,
          value: GET({ query: `modifiers.${node.name}` }),
        }),
        MODIFIER({
          value: BINARYOPERATION({
            kind: "MULTIPLY",
            left: BINARYOPERATION({
              kind: "MAX",
              left: LITERAL({ value: 0 }),
              right: VALUE_EXPRESSION({
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
    const { name, ability, hasPassive } = node;

    const passive = hasPassive
      ? [
        VALUE_STATEMENT({
          name: `passives.${name}`,
          value: BINARYOPERATION({
            kind: "ADD",
            left: LITERAL({ value: 10 }),
            right: GET({ query: `skills.${name}` }),
          }),
        }),
      ]
      : [];

    return MULTIPLE({
      values: [
        VALUE_STATEMENT({
          name: `skills.${name}`,
          value: GET({ query: `modifiers.${ability}` }),
        }),
        MODIFIER({
          value: BINARYOPERATION({
            kind: "MULTIPLY",
            left: VALUE_EXPRESSION({
              name: `proficiencies.skills.${name}`,
              reduceKind: "MAX",
              value: LITERAL({ value: 0 }),
            }),
            right: GET({ query: GLOBAL_VALUE_NAMES.PROFICIENCY_BONUS }),
          }),
          target: QUERY({ query: `skills.${name}` }),
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
          value: VALUE_EXPRESSION({
            name: `classes.${node.name}.level`,
            value: LITERAL({ value: node.level }),
          }),
        }),
        node.value,
      ],
    }),
};

export function desugarComponent<Target extends "SUGAR" | "BASE" = "BASE">(
  node: Nodes,
  target: Target,
): Target extends "SUGAR" ? SugarNode | BaseNode : BaseNode {
  const sugar = desugar(node, COMPONENT_HANDLERS);
  if (target === "SUGAR") return sugar as BaseNode;
  return desugar(sugar, SUGAR_HANDLERS);
}
