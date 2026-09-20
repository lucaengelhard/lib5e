// TODO: Exports

import libraryfile from "./library.json" with { type: "json" };
import { importLibrary } from "@lucaengelhard/libttrpg";

import { DND_SCHEMATA } from "./components/index.ts";
import { Character } from "./character.ts";

const { library } = importLibrary(libraryfile, ...DND_SCHEMATA);

const character = new Character(library);

character
  .set("ABILITY", "strength", "base", 12)
  .set("ABILITY", "dexterity", "base", 16)
  .set("ABILITY", "constitution", "base", 14)
  .set("ABILITY", "intelligence", "base", 13)
  .set("ABILITY", "wisdom", "base", 13)
  .set("ABILITY", "charisma", "base", 8)
  .setSpecies("half_elf");

console.log(character.resolve().choices);

/* console.log(error); */

/* console.log(error); */

/* const char = new Character(library)
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
  .setChoice("Proficiencies (Ranger)", [
    "proficiencies.skills.perception",
    "proficiencies.skills.nature",
    "proficiencies.skills.insight",
  ])
  .setChoice("Ability Score Increase (Half-Elf)", [
    "abilities.dexterity",
    "abilities.wisdom",
  ])
  .setChoice("Skill Versatility (Half-Elf)", [
    "proficiencies.skills.stealth",
    "proficiencies.skills.athletics",
  ])
  .setChoice("Natural/Deft Explorer (Ranger)", ["deft_explorer"])
  .setChoice("Expertise (Ranger)", ["proficiencies.skills.perception"]); */
