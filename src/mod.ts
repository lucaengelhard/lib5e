import { nestedMap, parse } from "@lucaengelhard/libttrpg";
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
  .setClassLevel("ranger", 12)
  .setSpecies("halfElf", {
    type: "MULTIPLE",
    values: [{
      type: "MODIFIER",
      target: { type: "QUERY", query: "stats.speed.walking" },
      value: { type: "VALUE", value: 30 },
    }, {
      type: "MODIFIER",
      target: { type: "QUERY", query: "abilities.charisma" },
      value: { type: "VALUE", value: 2 },
    }, {
      type: "CHOICE",
      name: "Ability Score Increase (Half-Elf)",
      count: 2,
      options: {
        constitution: {
          type: "MODIFIER",
          target: { type: "QUERY", query: "abilities.constitution" },
          value: { type: "VALUE", value: 1 },
        },
        dexterity: {
          type: "MODIFIER",
          target: { type: "QUERY", query: "abilities.dexterity" },
          value: { type: "VALUE", value: 1 },
        },
        wisdom: {
          type: "MODIFIER",
          target: { type: "QUERY", query: "abilities.wisdom" },
          value: { type: "VALUE", value: 1 },
        },
        intelligence: {
          type: "MODIFIER",
          target: { type: "QUERY", query: "abilities.intelligence" },
          value: { type: "VALUE", value: 1 },
        },
        strength: {
          type: "MODIFIER",
          target: { type: "QUERY", query: "abilities.strength" },
          value: { type: "VALUE", value: 1 },
        },
      },
      active: [],
    }, {
      type: "PROFICIENCY",
      target: {
        type: "SELECTOR",
        name: "Skill Versatility (Half-Elf)",
        count: 2,
        active: [],
        query: { type: "QUERY", query: "proficiencies.skills" },
      },
      value: 1,
    }],
  })
  .setChoice("Ability Score Increase (Half-Elf)", [
    "dexterity",
    "wisdom",
  ])
  .setChoice("Skill Versatility (Half-Elf)", ["proficiencies.skills.stealth"])
  .setChoice("Expertise (Ranger)", ["proficiencies.skills.stealth"]);

//console.log(nestedMap(char.resolve().choices));
console.log(nestedMap(char.resolve().values));
