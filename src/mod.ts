// TODO: Exports

import libraryfile from "../../data/src/library.json" with { type: "json" };
import { importLibrary } from "@lucaengelhard/libttrpg";

import { DND_SCHEMATA } from "./components/index.ts";
import { Character } from "./character.ts";

const { library } = importLibrary(libraryfile, ...DND_SCHEMATA);

console.time();
const character = new Character(library);

character
  .set("ABILITY", "strength", "base", 12)
  .set("ABILITY", "dexterity", "base", 15)
  .set("ABILITY", "constitution", "base", 14)
  .set("ABILITY", "intelligence", "base", 13)
  .set("ABILITY", "wisdom", "base", 13)
  .set("ABILITY", "charisma", "base", 8)
  .setSpecies("half_elf")
  .addClass("ranger")
  .addClass("druid")
  .setClassLevel("ranger", 5)
  .setClassLevel("druid", 3)
  .setChoice("Ability Score Increase (Half-Elf)", [
    "abilities.dexterity",
    "abilities.wisdom",
  ])
  .setChoice("Proficiencies (Ranger)", [
    "proficiencies.skills.perception",
    "proficiencies.skills.nature",
    "proficiencies.skills.insight",
  ])
  .setChoice("Skill Versatility (Half-Elf)", [
    "proficiencies.skills.stealth",
    "proficiencies.skills.athletics",
  ])
  .setChoice("Natural/Deft Explorer (Ranger)", ["deft_explorer"])
  .setChoice("Canny (Ranger/Deft Explorer)", [
    "proficiencies.skills.perception",
  ])
  .setBackground("noble");

const res = character.getValues();
console.timeEnd();
