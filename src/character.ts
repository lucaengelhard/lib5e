import {
  getValue,
  hasValue,
  parse,
  ResolverMap,
  setValue,
} from "@lucaengelhard/libttrpg";
import {
  type ComponentTree,
  desugarComponent,
  GLOBAL_VALUES,
} from "./components.ts";

export class Character {
  #tree: Extract<ComponentTree, { $type: "MULTIPLE" }> = {
    $type: "MULTIPLE",
    values: [
      GLOBAL_VALUES.LEVEL,
      GLOBAL_VALUES.PROFICIENCY_BONUS,
      GLOBAL_VALUES.WALKING_SPEED,
      GLOBAL_VALUES.SWIMMING_SPEED,
      GLOBAL_VALUES.CLIMBING_SPEED,
      GLOBAL_VALUES.FLYING_SPEED,
    ],
  };

  constructor(tree?: Extract<ComponentTree, { $type: "MULTIPLE" }>) {
    if (tree) this.#tree = tree;
  }

  getTree() {
    return structuredClone(this.#tree);
  }

  desugar() {
    return desugarComponent(this.#tree);
  }

  resolve() {
    return parse(this.desugar(), ResolverMap);
  }

  setAbilityBase(name: string, base: number) {
    if (hasValue(this.#tree, "ABILITY", name, "name")) {
      this.#tree = setValue(this.#tree, "ABILITY", name, "base", base);
    } else {
      this.#tree.values.push({ $type: "ABILITY", name, base });
    }

    return this;
  }

  addSkill(name: string, ability: string, hasPassive?: boolean) {
    if (hasValue(this.#tree, "SKILL", name, "name")) return this;
    this.#tree.values.push({ $type: "SKILL", name, ability, hasPassive });
    return this;
  }

  addClass(name: string, value: ComponentTree) {
    if (hasValue(this.#tree, "CLASS", name, "name")) return this;

    this.#tree.values.push({
      $type: "CLASS",
      name,
      value: value as any,
      level: 1,
    });

    return this;
  }

  setClassLevel(name: string, level: number) {
    if (!Number.isInteger(level) || level < 1 || level > 20) return this;
    this.#tree = setValue(this.#tree, "CLASS", name, "level", level);
    return this;
  }

  setChoice(name: string, active: string[]) {
    const choices = this.resolve().choices;
    const choice = choices.get(name);

    if (!choice) return this;

    this.#tree = setValue(this.#tree, choice.type, name, "active", active);

    return this;
  }

  toggleSwitch(name: string) {
    const current = getValue(this.#tree, "SWITCH", name, "active");
    if (typeof current !== "boolean") return this;
    this.#tree = setValue(this.#tree, "SWITCH", name, "active", !current);
    return this;
  }
}
