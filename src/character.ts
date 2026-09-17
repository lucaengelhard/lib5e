import {
  deleteNode,
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

type CharacterTree = Extract<ComponentTree, { $type: "MULTIPLE" }>;
export class Character {
  #tree: CharacterTree = {
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
    return structuredClone(this.#tree as ComponentTree);
  }

  desugar() {
    return desugarComponent(this.#tree as ComponentTree);
  }

  resolve() {
    return parse(this.desugar(), ResolverMap);
  }

  get<
    Type extends Extract<ComponentTree, { name?: string }>["$type"],
    Key extends keyof Extract<ComponentTree, { $type: Type }>,
  >(type: Type, name: string, key: Key) {
    return getValue(this.#tree as ComponentTree, type, name, key);
  }

  has<
    Type extends Extract<ComponentTree, { name?: string }>["$type"],
  >(type: Type, name: string) {
    return hasValue(this.#tree as ComponentTree, type, name);
  }

  set<
    Type extends Extract<ComponentTree, { name?: string }>["$type"],
    Key extends Exclude<
      keyof Extract<ComponentTree, { $type: Type }>,
      "$type" | "name"
    >,
    Value extends Extract<ComponentTree, { $type: Type }>[Key],
  >(type: Type, name: string, key: Key, value: Value) {
    this.#tree = setValue(
      this.#tree as ComponentTree,
      type,
      name,
      key,
      value,
    ) as CharacterTree;

    return this;
  }

  add(node: Extract<ComponentTree, { $type: "MULTIPLE" }>["values"][number]) {
    this.#tree.values.push(node);
    return this;
  }

  delete(
    type: Extract<ComponentTree, { name?: string }>["$type"],
    name: string,
  ) {
    this.#tree = deleteNode(
      this.#tree as ComponentTree,
      type,
      name,
    ) as CharacterTree;

    return this;
  }

  setAbilityBase(name: string, base: number) {
    return this.has("ABILITY", name)
      ? this.set("ABILITY", name, "base", base)
      : this.add({ $type: "ABILITY", name, base });
  }

  addSkill(name: string, ability: string, hasPassive?: boolean) {
    return this.has("SKILL", name)
      ? this
      : this.add({ $type: "SKILL", name, ability, hasPassive });
  }

  addClass(
    name: string,
    value: Extract<ComponentTree, { $type: "CLASS" }>["value"],
  ) {
    return this.has("CLASS", name)
      ? this
      : this.add({ $type: "CLASS", name, value, level: 1 });
  }

  setClassLevel(name: string, level: number) {
    if (!Number.isInteger(level) || level < 1 || level > 20) return this;
    return this.set("CLASS", name, "level", level);
  }

  setChoice(name: string, active: string[]) {
    const choices = this.resolve().choices;
    const choice = choices.get(name);

    if (!choice) return this;

    return this.set(choice.type, name, "active", active);
  }

  toggleSwitch(name: string) {
    return this.set(
      "SWITCH",
      name,
      "active",
      !this.get("SWITCH", name, "active"),
    );
  }
}
