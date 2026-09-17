import {
  type BASE_NODES,
  type BaseNode,
  desugar,
  type Handlers,
  type OmitDistributive,
  type Statement,
  SUGAR_HANDLERS,
  type SugarNode,
  type Tree,
} from "@lucaengelhard/libttrpg";

export const GLOBAL_VALUES = {
  LEVEL: {
    $type: "VALUE",
    name: "stats.level",
    value: { $type: "VALUE", value: { $type: "LITERAL", value: 0 } },
  },
  PROFICIENCY_BONUS: {
    $type: "VALUE",
    name: "stats.proficiencyBonus",
    value: {
      $type: "VALUE",
      value: {
        $type: "BINARYOPERATION",
        kind: "ADD",
        left: { $type: "VALUE", value: { $type: "LITERAL", value: 1 } },
        right: {
          $type: "UNARYOPERATION",
          kind: "CEIL",
          value: {
            $type: "BINARYOPERATION",
            kind: "MULTIPLY",
            left: { $type: "VALUE", value: { $type: "LITERAL", value: 1 / 4 } },
            right: { $type: "GET", query: "stats.level" },
          },
        },
      },
    },
  },
  WALKING_SPEED: {
    $type: "VALUE",
    name: "stats.speed.walking",
    value: { $type: "LITERAL", value: 0 },
  },
  CLIMBING_SPEED: {
    $type: "VALUE",
    name: "stats.speed.climbing",
    value: { $type: "LITERAL", value: 0 },
  },
  SWIMMING_SPEED: {
    $type: "VALUE",
    name: "stats.speed.swimming",
    value: { $type: "LITERAL", value: 0 },
  },
  FLYING_SPEED: {
    $type: "VALUE",
    name: "stats.speed.flying",
    value: { $type: "LITERAL", value: 0 },
  },
} as const satisfies Record<
  string,
  & Extract<Tree<BaseNode | SugarNode, BaseNode | SugarNode>, { name?: string }>
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
export type ComponentTree = Tree<Nodes, Nodes>;

const COMPONENT_HANDLERS: Handlers<ComponentNode, SugarNode | BaseNode> = {
  PROFICIENCY: (node) => ({
    $type: "MODIFIER",
    value: {
      $type: "VALUE",
      value: {
        $type: "VALUE",
        value: { $type: "LITERAL", value: node.value },
      },
    },
    target: node.target,
  }),
  ABILITY: (node) => ({
    $type: "MULTIPLE",
    values: [
      {
        $type: "VALUE",
        name: `abilities.${node.name}`,
        value: { $type: "LITERAL", value: node.base },
      },
      {
        $type: "VALUE",
        name: `modifiers.${node.name}`,
        value: {
          $type: "UNARYOPERATION",
          kind: "FLOOR",
          value: {
            $type: "BINARYOPERATION",
            kind: "DIVIDE",
            left: {
              $type: "BINARYOPERATION",
              kind: "SUBTRACT",
              left: { $type: "GET", query: `abilities.${node.name}` },
              right: {
                $type: "VALUE",
                value: { $type: "LITERAL", value: 10 },
              },
            },
            right: { $type: "VALUE", value: { $type: "LITERAL", value: 2 } },
          },
        },
      },
      {
        $type: "VALUE",
        name: `saves.${node.name}`,
        value: { $type: "GET", query: `modifiers.${node.name}` },
      },
      {
        $type: "MODIFIER",
        value: {
          $type: "BINARYOPERATION",
          kind: "MULTIPLY",
          left: {
            $type: "BINARYOPERATION",
            kind: "MAX",
            left: { $type: "VALUE", value: { $type: "LITERAL", value: 0 } },
            right: {
              $type: "VALUE",
              name: `proficiencies.saves.${node.name}`,
              reduceKind: "MAX",
              value: { $type: "LITERAL", value: 0 },
            },
          },
          right: {
            $type: "GET",
            query: GLOBAL_VALUE_NAMES.PROFICIENCY_BONUS,
          },
        },
        target: { $type: "QUERY", query: `saves.${node.name}` },
      },
    ],
  }),
  SKILL: (node) => {
    const { name, ability, hasPassive } = node;

    const passive: OmitDistributive<Statement, "$kind">[] = hasPassive
      ? [{
        $type: "VALUE",
        name: `passives.${name}`,
        value: {
          $type: "BINARYOPERATION",
          kind: "ADD",
          left: { $type: "VALUE", value: { $type: "LITERAL", value: 10 } },
          right: { $type: "GET", query: `skills.${name}` },
        },
      }]
      : [];

    return {
      $type: "MULTIPLE",
      values: [
        {
          $type: "VALUE",
          name: `skills.${name}`,
          value: { $type: "GET", query: `modifiers.${ability}` },
        },
        {
          $type: "MODIFIER",
          value: {
            $type: "BINARYOPERATION",
            kind: "MULTIPLY",
            left: {
              $type: "VALUE",
              name: `proficiencies.skills.${name}`,
              reduceKind: "MAX",
              value: { $type: "LITERAL", value: 0 },
            },
            right: {
              $type: "GET",
              query: GLOBAL_VALUE_NAMES.PROFICIENCY_BONUS,
            },
          },
          target: { $type: "QUERY", query: `skills.${name}` },
        },
        ...passive,
      ],
    };
  },
  CLASS: (node) => ({
    $type: "MULTIPLE",
    values: [{
      $type: "MODIFIER",
      target: { $type: "QUERY", query: GLOBAL_VALUE_NAMES.LEVEL },
      value: {
        $type: "VALUE",
        name: `classes.${node.name}.level`,
        value: { $type: "LITERAL", value: node.level },
      },
    }, node.value],
  }),
};

export function desugarComponent(
  node: ComponentTree,
): Tree<BaseNode, BaseNode> {
  return desugar(desugar(node, COMPONENT_HANDLERS), SUGAR_HANDLERS);
}
