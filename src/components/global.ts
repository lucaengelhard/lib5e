import { type CoreNode, CoreNodeFactory } from "@lucaengelhard/libttrpg";

const {
  LITERAL,
  VALUE,
  BINARYOPERATION,
  UNARYOPERATION,
  GET,
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
