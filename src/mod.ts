/* console.log(
  parse(
    desugar({
      type: "MULTIPLE",
      values: [
        GLOBAL_VALUES.LEVEL,
        GLOBAL_VALUES.PROFICIENCY_BONUS,
        GLOBAL_VALUES.WALKING_SPEED,
        GLOBAL_VALUES.SWIMMING_SPEED,
        GLOBAL_VALUES.CLIMBING_SPEED,
        GLOBAL_VALUES.FLYING_SPEED,
        ABILITY({
          type: "ABILITY",
          name: "wisdom",
          base: 12,
        }),
        ABILITY({
          type: "ABILITY",
          name: "charisma",
          base: 8,
        }),
        SKILL({
          type: "SKILL",
          name: "perception",
          ability: "wisdom",
          hasPassive: true,
        }),
        CLASS({
          type: "CLASS",
          name: "ranger",
          level: 4,
          value: { type: "MULTIPLE", values: [] },
        }),
        SPECIES({
          type: "SPECIES",
          name: "halfElf",
          value: {
            type: "MULTIPLE",
            values: [
              {
                type: "MODIFIER",
                target: "stats.speed.walking",
                value: { type: "VALUE", value: 30 },
              },
              {
                type: "MODIFIER",
                target: "abilities.charisma",
                value: { type: "VALUE", value: 2 },
              },
            ],
          },
        }),
      ],
    }),
  ),
); */

import { componentDesugar } from "./components.ts";

console.log(
  componentDesugar({
    type: "CLASS",
    name: "Ranger",
    level: 4,
    value: { type: "MULTIPLE", values: [] },
  }),
);

/* console.log(desugar({
  type: "MULTIPLE",
  values: [
    GLOBAL_VALUES.LEVEL,
    GLOBAL_VALUES.PROFICIENCY_BONUS,
    GLOBAL_VALUES.WALKING_SPEED,
    GLOBAL_VALUES.SWIMMING_SPEED,
    GLOBAL_VALUES.CLIMBING_SPEED,
    GLOBAL_VALUES.FLYING_SPEED,
    ABILITY({
      type: "ABILITY",
      name: "wisdom",
      base: 12,
    }),
    ABILITY({
      type: "ABILITY",
      name: "charisma",
      base: 8,
    }),
    SKILL({
      type: "SKILL",
      name: "perception",
      ability: "wisdom",
      hasPassive: true,
    }),
    CLASS({
      type: "CLASS",
      name: "ranger",
      level: 4,
      value: { type: "MULTIPLE", values: [] },
    }),
    SPECIES({
      type: "SPECIES",
      name: "halfElf",
      value: {
        type: "MULTIPLE",
        values: [
          {
            type: "MODIFIER",
            target: "stats.speed.walking",
            value: { type: "VALUE", value: 30 },
          },
          {
            type: "MODIFIER",
            target: "abilities.charisma",
            value: { type: "VALUE", value: 2 },
          },
        ],
      },
    }),
  ],
})); */
