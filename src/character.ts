import {
  deleteNode,
  type Filter,
  getValue,
  hasValue,
  parse,
  ResolverMap,
  setValue,
  type Statement,
} from "@lucaengelhard/libttrpg";
import {
  ComponentFactory,
  desugarComponent,
  GLOBAL_VALUES,
  type Nodes,
} from "./components.ts";

const { MULTIPLE, ABILITY, CLASS, SKILL, SECTION_STATEMENT } = ComponentFactory;

type CharacterTree = Extract<Nodes, { $type: "MULTIPLE" }>;
export class Character {
  #tree: CharacterTree = MULTIPLE({
    values: [
      GLOBAL_VALUES.LEVEL,
      GLOBAL_VALUES.PROFICIENCY_BONUS,
      GLOBAL_VALUES.WALKING_SPEED,
      GLOBAL_VALUES.SWIMMING_SPEED,
      GLOBAL_VALUES.CLIMBING_SPEED,
      GLOBAL_VALUES.FLYING_SPEED,
    ],
  });

  constructor(tree?: CharacterTree) {
    if (tree) this.#tree = tree;
  }

  getTree() {
    return this.#tree;
  }

  desugar() {
    return desugarComponent(this.#tree as Nodes);
  }

  resolve() {
    return parse(this.desugar(), ResolverMap);
  }

  get<
    Type extends Extract<Nodes, { name?: string }>["$type"],
    Key extends keyof Extract<Nodes, { $type: Type }>,
  >(type: Type, name: string, key: Key) {
    return getValue(this.#tree as Nodes, type, name, key);
  }

  has<
    Type extends Extract<Nodes, { name?: string }>["$type"],
  >(type: Type, name: string) {
    return hasValue(this.#tree as Nodes, type, name);
  }

  set<
    Type extends Extract<Nodes, { name?: string }>["$type"],
    Key extends Exclude<
      keyof Extract<Nodes, { $type: Type }>,
      "$type" | "name"
    >,
    Value extends Extract<Nodes, { $type: Type }>[Key],
  >(type: Type, name: string, key: Key, value: Value) {
    this.#tree = setValue(
      this.#tree as Nodes,
      type,
      name,
      key,
      value,
    ) as CharacterTree;

    return this;
  }

  add(node: Statement) {
    this.#tree.values.push(node);
    return this;
  }

  delete(
    type: Extract<Nodes, { name?: string }>["$type"],
    name: string,
  ) {
    this.#tree = deleteNode(
      this.#tree as Nodes,
      type,
      name,
    ) as CharacterTree;

    return this;
  }

  setAbilityBase(name: string, base: number) {
    return this.has("ABILITY", name)
      ? this.set("ABILITY", name, "base", base)
      : this.add(ABILITY({ name, base }));
  }

  addSkill(name: string, ability: string, hasPassive?: boolean) {
    return this.has("SKILL", name)
      ? this
      : this.add(SKILL({ name, ability, hasPassive }));
  }

  addClass(
    name: string,
    value: Filter<Nodes, "CLASS">["value"],
  ) {
    return this.has("CLASS", name)
      ? this
      : this.add(CLASS({ name, value, level: 1 }));
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

  setSpecies(value: Statement) {
    return this.has("SECTION", "__SPECIES__")
      ? this.set("SECTION", "__SPECIES__", "value", value)
      : this.add(SECTION_STATEMENT({ name: "__SPECIES__", value }));
  }
}
