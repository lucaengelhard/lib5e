import {
  type BaseNode,
  CORE_SCHEMATA,
  type CoreNode,
  createFactory,
  createSchema,
  desugar,
  type Factory,
  type Handlers,
  type Infer,
  SUGAR_HANDLERS,
} from "@lucaengelhard/libttrpg";
import { Ability, Class, Item, Proficiency, Skill } from "./nodes.ts";
import { GLOBAL_VALUE_NAMES } from "./global.ts";

const COMPONENT_SCHEMATA = [
  Ability,
  Skill,
  Proficiency,
  Class,
  Item,
] as const;
type ComponentNode = Infer<typeof COMPONENT_SCHEMATA[number]>;

export const DND_SCHEMATA = [...COMPONENT_SCHEMATA, ...CORE_SCHEMATA] as const;
export const DnDSchema = createSchema(...DND_SCHEMATA);

export type DndNode = Infer<typeof DND_SCHEMATA[number]>;
export const DnDFactory: Factory<DndNode> = createFactory<DndNode>();

const {
  LITERAL,
  VALUE,
  BINARYOPERATION,
  UNARYOPERATION,
  GET,
  MODIFIER,
  MULTIPLE,
  QUERY,
  PROFICIENCY,
  LEVEL,
  NULL,
  SECTION,
} = DnDFactory;

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
          value: LITERAL({ value: node.base ?? 0 }),
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
  CLASS: (node) => {
    const rolls = node.hpRolls ?? {};

    const hpLevels: Record<number, DndNode> = {};

    Array.from({ length: node.level ?? 0 }, (_, i) => {
      const currentLevel = i + 1;

      const roll = currentLevel === 1 && node.isMain
        ? node.dice
        : rolls[currentLevel] ?? (node.dice / 2 + 1);

      hpLevels[currentLevel] = MODIFIER({
        value: LITERAL({ value: roll }),
        target: QUERY({ query: "stats.hp" }),
      });
    }).filter((v) => v !== undefined);

    const mainClassFeatures = MULTIPLE({
      values: node.isMain
        ? [
          ...node.saves.map((ability) =>
            PROFICIENCY({
              target: QUERY({ query: `proficiencies.saves.${ability}` }),
              value: 1,
            })
          ),
        ]
        : [],
    });

    return MULTIPLE({
      values: [
        MODIFIER({
          target: QUERY({ query: GLOBAL_VALUE_NAMES.LEVEL }),
          value: VALUE({
            name: `classes.${node.name}.level`,
            value: LITERAL({ value: node.level ?? 0 }),
          }),
        }),
        LEVEL({
          reference: GET({ query: "stats.level" }),
          levels: hpLevels,
        }),
        mainClassFeatures,
        node.value,
      ],
    });
  },
  ITEM: (node) =>
    !node.equipped || (node.needsAttunement && !node.attuned)
      ? NULL({})
      : SECTION({
        name: `__ITEM__${node.name.toUpperCase()}`,
        value: node.effect,
      }),
};

export function desugarComponent(
  node: DndNode,
): BaseNode {
  const sugar = desugar(node, COMPONENT_HANDLERS);
  return desugar(sugar, SUGAR_HANDLERS);
}
