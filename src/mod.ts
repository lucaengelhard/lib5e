import { nestedMap } from "@lucaengelhard/libttrpg";
import { Character } from "./character.ts";
import { ComponentFactory } from "./components.ts";

const { MULTIPLE, MODIFIER, SELECTOR, QUERY, LITERAL, PROFICIENCY, CHOICE } =
  ComponentFactory;

const char = new Character()
  .setAbilityBase("strength", 12)
  .setAbilityBase("dexterity", 16)
  .setAbilityBase("constitution", 14)
  .setAbilityBase("intelligence", 13)
  .setAbilityBase("wisdom", 13)
  .setAbilityBase("charisma", 8)
  .addSkill("perception", "wisdom", true)
  .addSkill("stealth", "dexterity")
  .addSkill("athletics", "strength")
  .setSpecies(MULTIPLE({
    values: [
      MODIFIER({
        value: LITERAL({ value: 2 }),
        target: QUERY({ query: "abilities.charisma" }),
      }),
      MODIFIER({
        target: SELECTOR({
          name: "Ability Score Increase (Half-Elf)",
          count: 2,
          active: [],
          query: QUERY({ query: "abilities" }),
        }),
        value: LITERAL({ value: 1 }),
      }),
      MODIFIER({
        value: LITERAL({ value: 30 }),
        target: QUERY({ query: "stats.speed.walking" }),
      }),
      CHOICE({
        name: "Skill Versatility (Half-Elf)",
        active: [],
        count: 2,
        options: {
          "proficiencies.skills.stealth": PROFICIENCY({
            target: QUERY({ query: "proficiencies.skills.stealth" }),
            value: 1,
          }),
          "proficiencies.skills.athletics": PROFICIENCY({
            target: QUERY({ query: "proficiencies.skills.athletics" }),
            value: 1,
          }),
        },
      }),
    ],
  }))
  .addClass(
    "ranger",
    MULTIPLE({
      values: [
        MODIFIER({
          value: LITERAL({ value: 2 }),
          target: SELECTOR({
            name: "Expertise (Ranger)",
            count: 2,
            active: [],
            query: QUERY({ query: "proficiencies.skills?value=(>=1)" }),
          }),
        }),
      ],
    }),
  )
  .setClassLevel("ranger", 5)
  .addClass("druid", MULTIPLE({ values: [] }))
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

console.log(nestedMap(char.resolve().values));
