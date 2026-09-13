import { Character } from "./character.ts";

console.log(
  new Character()
    .setAbilityBase("wisdom", 12)
    .setAbilityBase("wisdom", 16)
    .addSkill("perception", "wisdom")
    .addClass("ranger", { type: "MULTIPLE", values: [] })
    .setClassLevel("ranger", 12)
    .setSpecies("halfElf", { type: "MULTIPLE", values: [] })
    .getTree(),
);
