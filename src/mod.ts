import { nestedMap } from "@lucaengelhard/libttrpg";
import { Character } from "./character.ts";

const char = new Character()
  .setAbilityBase("strength", 12)
  .setAbilityBase("dexterity", 16)
  .setAbilityBase("constitution", 14)
  .setAbilityBase("intelligence", 13)
  .setAbilityBase("wisdom", 13)
  .setAbilityBase("charisma", 8)
  .addSkill("perception", "wisdom", true)
  .addSkill("stealth", "dexterity")
  .addClass("ranger", {
    type: "MULTIPLE",
    values: [
      {
        type: "MODIFIER",
        value: { type: "VALUE", value: 2 },
        target: {
          type: "SELECTOR",
          name: "Expertise (Ranger)",
          count: 2,
          active: [],
          query: { type: "QUERY", query: "proficiencies.skills?value=(>=1)" },
        },
      },
    ],
  })
  .setChoice("Expertise (Ranger)", ["proficiencies.skills.perception"])
  .setClassLevel("ranger", 12)
  .setSpecies("halfElf", {
    type: "MULTIPLE",
    values: [
      {
        type: "MODIFIER",
        target: { type: "QUERY", query: "stats.speed.walking" },
        value: { type: "VALUE", value: 30 },
      },
      {
        type: "MODIFIER",
        target: { type: "QUERY", query: "abilities.charisma" },
        value: { type: "VALUE", value: 2 },
      },
      {
        type: "MODIFIER",
        value: { type: "VALUE", value: 1 },
        target: {
          type: "SELECTOR",
          name: "Ability Score Increase (Half-Elf)",
          count: 2,
          active: [],
          query: { type: "QUERY", query: "abilities" },
        },
      },
      {
        type: "PROFICIENCY",
        target: {
          type: "SELECTOR",
          name: "Skill Versatility (Half-Elf)",
          count: 2,
          active: [],
          query: { type: "QUERY", query: "proficiencies.skills" },
        },
        value: 1,
      },
    ],
  })
  .setChoice("Ability Score Increase (Half-Elf)", [
    "abilities.dexterity",
    "abilities.wisdom",
  ])
  .setChoice("Skill Versatility (Half-Elf)", ["proficiencies.skills.stealth"]);

console.log(nestedMap(char.resolve().values));
