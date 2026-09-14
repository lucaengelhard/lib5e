import {
  type AnyNode,
  desugar,
  type Extend,
  type GetCtx,
  getOr,
  getValue,
  type Node,
  type NodeFactory,
  type SetCtx,
  setOr,
  setValue,
} from "@lucaengelhard/libttrpg";
import { createTraversal } from "../../libttrpg/src/system/traverse.ts";

export const GLOBAL_VALUES = {
  LEVEL: {
    type: "VALUE",
    name: "stats.level",
    value: { type: "VALUE", value: 0 },
  },
  PROFICIENCY_BONUS: {
    type: "VALUE",
    name: "stats.proficiencyBonus",
    value: {
      type: "VALUE",
      value: {
        type: "BINARYOPERATION",
        kind: "ADD",
        left: { type: "VALUE", value: 1 },
        right: {
          type: "UNARYOPERATION",
          kind: "CEIL",
          value: {
            type: "BINARYOPERATION",
            kind: "MULTIPLY",
            left: { type: "VALUE", value: 1 / 4 },
            right: { type: "QUERY", query: "stats.level" },
          },
        },
      },
    },
  },
  WALKING_SPEED: { type: "VALUE", name: "stats.speed.walking", value: 0 },
  CLIMBING_SPEED: { type: "VALUE", name: "stats.speed.climbing", value: 0 },
  SWIMMING_SPEED: { type: "VALUE", name: "stats.speed.swimming", value: 0 },
  FLYING_SPEED: { type: "VALUE", name: "stats.speed.flying", value: 0 },
} as const satisfies Record<string, Node>;

export const GLOBAL_VALUE_NAMES = Object
  .fromEntries(
    Object.entries(GLOBAL_VALUES).map((
      [key, value],
    ) => [key, value.name] as const),
  ) as Readonly<Record<keyof typeof GLOBAL_VALUES, string>>;

type Ability = NodeFactory<"Ability", { name: string; base: number }>;
function ABILITY(input: Ability): Node {
  return {
    type: "SECTION",
    name: `__abilities__${input.name}`,
    value: {
      type: "MULTIPLE",
      values: [
        { type: "VALUE", name: `abilities.${input.name}`, value: input.base },
        {
          type: "VALUE",
          name: `modifiers.${input.name}`,
          value: {
            type: "UNARYOPERATION",
            kind: "FLOOR",
            value: {
              type: "BINARYOPERATION",
              kind: "DIVIDE",
              left: {
                type: "BINARYOPERATION",
                kind: "SUBTRACT",
                left: { type: "QUERY", query: `abilities.${input.name}` },
                right: { type: "VALUE", value: 10 },
              },
              right: { type: "VALUE", value: 2 },
            },
          },
        },
        {
          type: "VALUE",
          name: `saves.${input.name}`,
          value: { type: "QUERY", query: `modifiers.${input.name}` },
        },
        {
          type: "MODIFIER",
          value: {
            type: "BINARYOPERATION",
            kind: "MULTIPLY",
            left: {
              type: "BINARYOPERATION",
              kind: "MAX",
              left: { type: "VALUE", value: 0 },
              right: {
                type: "AGGREGATOR",
                kind: "MAX",
                name: `proficiencies.saves.${input.name}`,
              },
            },
            right: {
              type: "QUERY",
              query: GLOBAL_VALUE_NAMES.PROFICIENCY_BONUS,
            },
          },
          target: `saves.${input.name}`,
        },
        {
          type: "MODIFIER",
          target: `proficiencies.saves.${input.name}`,
          value: { type: "VALUE", value: 0 },
        },
      ],
    },
  };
}

type Skill = NodeFactory<
  "Skill",
  { name: string; ability: string; hasPassive?: boolean }
>;
function SKILL(input: Skill): Node {
  const passive: Node[] = input.hasPassive
    ? [{
      type: "VALUE",
      name: `passives.${input.name}`,
      value: {
        type: "BINARYOPERATION",
        kind: "ADD",
        left: { type: "VALUE", value: 10 },
        right: { type: "QUERY", query: `skills.${input.name}` },
      },
    }]
    : [];

  return {
    type: "SECTION",
    name: `__skills__${input.name}`,
    value: {
      type: "MULTIPLE",
      values: [
        {
          type: "VALUE",
          name: `skills.${input.name}`,
          value: { type: "QUERY", query: `modifiers.${input.ability}` },
        },
        {
          type: "MODIFIER",
          value: {
            type: "BINARYOPERATION",
            kind: "MULTIPLY",
            left: {
              type: "AGGREGATOR",
              kind: "MAX",
              name: `proficiencies.skills.${input.name}`,
            },
            right: {
              type: "QUERY",
              query: GLOBAL_VALUE_NAMES.PROFICIENCY_BONUS,
            },
          },
          target: `skills.${input.name}`,
        },
        {
          type: "MODIFIER",
          target: `proficiencies.skills.${input.name}`,
          value: { type: "VALUE", value: 0 },
        },
        ...passive,
      ],
    },
  };
}

export type ProficiencyValue = 0.5 | 1 | 2;
type Proficiency = NodeFactory<"Proficiency", {
  target: string;
  value: ProficiencyValue;
}>;
function PROFICIENCY(input: Proficiency): Node {
  return {
    type: "MODIFIER",
    value: { type: "VALUE", value: input.value },
    target: `proficiencies.${input.target}`,
  };
}

type Class = NodeFactory<
  "Class",
  { name: string; value: Extend<Node, Component, Node>; level: number }
>;
function CLASS(input: Class): Node {
  return {
    type: "SECTION",
    name: `__classes__${input.name}`,
    value: {
      type: "MULTIPLE",
      values: [
        {
          type: "MODIFIER",
          target: GLOBAL_VALUE_NAMES.LEVEL,
          value: {
            type: "VALUE",
            name: `classes.${input.name}.level`,
            value: input.level,
          },
        },
        input.value as Node,
      ],
    },
  };
}

type Species = NodeFactory<
  "Species",
  { name: string; value: Extend<Node, Component, Node> }
>;
function SPECIES(input: Species): Node {
  return {
    type: "SECTION",
    name: `__species__${input.name}`,
    value: input.value as Node,
  };
}

export type Component = Ability | Skill | Proficiency | Class | Species;

export function desugarComponent(onlyOneLevel?: boolean) {
  return createTraversal<
    Component,
    AnyNode,
    Record<PropertyKey, never>
  >(
    {
      PROFICIENCY: (node, internal) => internal(PROFICIENCY(node)),
      ABILITY: (node, internal) => internal(ABILITY(node)),
      SKILL: (node, internal) => internal(SKILL(node)),
      CLASS: (node, internal) => internal(CLASS(node)),
      SPECIES: (node, internal) => internal(SPECIES(node)),
    },
    (node, tlt) => desugar(node, tlt as any, { passthrough: onlyOneLevel }),
  );
}

const setIdentity = setOr((node) => node);
export const setComponent = createTraversal<Component, AnyNode, SetCtx>({
  PROFICIENCY: setIdentity,
  ABILITY: setIdentity,
  SKILL: setIdentity,
  CLASS: setOr((node, traverse) => ({ ...node, value: traverse(node.value) })),
  SPECIES: setOr((node, traverse) => ({
    ...node,
    value: traverse(node.value),
  })),
}, setValue);

const getEmpty = getOr((_) => undefined as unknown);
export const getComponent = createTraversal<Component, unknown, GetCtx>({
  PROFICIENCY: getEmpty,
  ABILITY: getEmpty,
  SKILL: getEmpty,
  CLASS: getOr((node, traverse) => traverse(node.value)),
  SPECIES: getOr((node, traverse) => traverse(node.value)),
}, getValue);

export function hasComponent(tree: AnyNode, ctx: GetCtx): boolean {
  return getComponent(tree, undefined, ctx) !== undefined;
}
