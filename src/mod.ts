export { Character } from "./character.ts";

export type { Nodes, ProficiencyValue } from "./components.ts";
export {
  COMPONENT_EXPRESSION_NAMES,
  COMPONENT_STATEMENT_NAMES,
  ComponentFactory,
  GLOBAL_VALUE_NAMES,
} from "./components.ts";

import { Character } from "./character.ts";

const char = new Character({
  "skills.acrobatics": {
    $type: "SKILL",
    name: "acrobatics",
    ability: "dexterity",
  },
  "skills.animal_handling": {
    $type: "SKILL",
    name: "animal_handling",
    ability: "wisdom",
  },
  "skills.arcana": {
    $type: "SKILL",
    name: "arcana",
    ability: "intelligence",
  },
  "skills.athletics": {
    $type: "SKILL",
    name: "athletics",
    ability: "strength",
  },
  "skills.deception": {
    $type: "SKILL",
    name: "deception",
    ability: "charisma",
  },
  "skills.history": {
    $type: "SKILL",
    name: "history",
    ability: "intelligence",
  },
  "skills.insight": {
    $type: "SKILL",
    name: "insight",
    ability: "wisdom",
    hasPassive: true,
  },
  "skills.intimidation": {
    $type: "SKILL",
    name: "intimidation",
    ability: "charisma",
  },
  "skills.investigation": {
    $type: "SKILL",
    name: "investigation",
    ability: "intelligence",
    hasPassive: true,
  },
  "skills.medicine": {
    $type: "SKILL",
    name: "medicine",
    ability: "wisdom",
  },
  "skills.nature": {
    $type: "SKILL",
    name: "nature",
    ability: "intelligence",
  },
  "skills.perception": {
    $type: "SKILL",
    name: "perception",
    ability: "wisdom",
    hasPassive: true,
  },
  "skills.performance": {
    $type: "SKILL",
    name: "performance",
    ability: "charisma",
  },
  "skills.persuasion": {
    $type: "SKILL",
    name: "persuasion",
    ability: "charisma",
  },
  "skills.religion": {
    $type: "SKILL",
    name: "religion",
    ability: "intelligence",
  },
  "skills.sleight_of_hand": {
    $type: "SKILL",
    name: "sleight_of_hand",
    ability: "dexterity",
  },
  "skills.stealth": {
    $type: "SKILL",
    name: "stealth",
    ability: "dexterity",
  },
  "skills.survival": {
    $type: "SKILL",
    name: "survival",
    ability: "wisdom",
  },
  "abilities.strength": { $type: "ABILITY", name: "strength" },
  "abilities.dexterity": { $type: "ABILITY", name: "dexterity" },
  "abilities.constitution": { $type: "ABILITY", name: "constitution" },
  "abilities.intelligence": { $type: "ABILITY", name: "intelligence" },
  "abilities.wisdom": { $type: "ABILITY", name: "wisdom" },
  "abilities.charisma": { $type: "ABILITY", name: "charisma" },
  "classes.ranger": {
    $type: "CLASS",
    name: "ranger",
    value: {
      $type: "MULTIPLE",
      values: [{
        $type: "MODIFIER",
        value: { $type: "LITERAL", value: 2 },
        target: {
          $type: "SELECTOR",
          name: "Expertise (Ranger)",
          count: 2,
          active: [],
          query: { type: "", query: "proficiencies.skills?value=(>=1)" }, // This doesnt get applied :(
        },
      }],
    },
  },
  "classes.druid": {
    $type: "CLASS",
    name: "druid",
    value: { $type: "MULTIPLE", values: [] },
  },
  "species.half_elf": {
    $type: "MULTIPLE",
    values: [
      {
        $type: "MODIFIER",
        value: { $type: "LITERAL", value: 2 },
        target: { $type: "QUERY", query: "abilities.charisma" },
      },
      {
        $type: "MODIFIER",
        target: {
          $type: "SELECTOR",
          name: "Ability Score Increase (Half-Elf)",
          count: 2,
          active: [],
          query: { $type: "QUERY", query: "abilities" },
        },
        value: { $type: "LITERAL", value: 1 },
      },
      {
        $type: "MODIFIER",
        value: { $type: "LITERAL", value: 30 },
        target: { $type: "QUERY", query: "stats.speed.walking" },
      },
      {
        $type: "CHOICE",
        name: "Skill Versatility (Half-Elf)",
        active: [],
        count: 2,
        options: {
          "proficiencies.skills.stealth": {
            $type: "PROFICIENCY",
            target: { $type: "QUERY", query: "proficiencies.skills.stealth" },
            value: 1,
          },
          "proficiencies.skills.athletics": {
            $type: "PROFICIENCY",
            target: { $type: "QUERY", query: "proficiencies.skills.athletics" },
            value: 1,
          },
        },
      },
    ],
  },
})
  .set("ABILITY", "strength", "base", 12)
  .set("ABILITY", "dexterity", "base", 16)
  .set("ABILITY", "constitution", "base", 14)
  .set("ABILITY", "intelligence", "base", 13)
  .set("ABILITY", "wisdom", "base", 13)
  .set("ABILITY", "charisma", "base", 8)
  .setSpecies("half_elf")
  .addClass("ranger")
  .setClassLevel("ranger", 5)
  .addClass("druid")
  .setClassLevel("druid", 3)
  .setChoice("Expertise (Ranger)", ["proficiencies.skills.perception"])
  .setChoice("Ability Score Increase (Half-Elf)", [
    "abilities.dexterity",
    "abilities.wisdom",
  ])
  .setChoice("Skill Versatility (Half-Elf)", [
    "proficiencies.skills.stealth",
    "proficiencies.skills.athletics",
  ]);

console.log(char.resolve().values);
