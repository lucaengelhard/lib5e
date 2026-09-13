import { nestedMap } from "@lucaengelhard/libttrpg";
import { Character } from "./character.ts";

const char = new Character()
  .setAbilityBase("strength", 12)
  .setAbilityBase("dexterity", 16)
  .setAbilityBase("constitution", 14)
  .setAbilityBase("intelligence", 13)
  .setAbilityBase("wisdom", 13)
  .setAbilityBase("charisma", 8)
  .addSkill("perception", "wisdom")
  .addSkill("stealth", "dexterity")
  .addClass("ranger", {
    type: "MULTIPLE",
    values: [{ type: "PROFICIENCY", target: "skills.perception", value: 2 }],
  })
  .setClassLevel("ranger", 12)
  .setSpecies("halfElf", {
    type: "MULTIPLE",
    values: [{
      type: "MODIFIER",
      target: "abilities.charisma",
      value: { type: "VALUE", value: 2 },
    }, {
      type: "CHOICE",
      name: "Ability Score Increase (Half-Elf)",
      count: 2,
      options: {
        constitution: {
          type: "MODIFIER",
          target: "abilities.constitution",
          value: { type: "VALUE", value: 1 },
        },
        dexterity: {
          type: "MODIFIER",
          target: "abilities.dexterity",
          value: { type: "VALUE", value: 1 },
        },
        wisdom: {
          type: "MODIFIER",
          target: "abilities.wisdom",
          value: { type: "VALUE", value: 1 },
        },
        intelligence: {
          type: "MODIFIER",
          target: "abilities.intelligence",
          value: { type: "VALUE", value: 1 },
        },
        strength: {
          type: "MODIFIER",
          target: "abilities.strength",
          value: { type: "VALUE", value: 1 },
        },
      },
      active: [],
    }, {
      type: "CHOICE",
      name: "Skill Versatility (Half-Elf)",
      count: 2,
      active: [],
      options: {
        stealth: {
          type: "PROFICIENCY",
          target: "skills.stealth",
          value: 1,
        },
      },
    }],
  })
  .setChoice("Ability Score Increase (Half-Elf)", [
    "dexterity",
    "wisdom",
  ])
  .setChoice("Skill Versatility (Half-Elf)", ["stealth"]);

console.log(char.getChoicesAndSwitches());

console.log(nestedMap(char.resolve().values));
