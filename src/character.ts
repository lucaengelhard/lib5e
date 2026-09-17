import {
  type BaseNode,
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

  getTree(): CharacterTree {
    return this.#tree;
  }

  desugar(): BaseNode {
    return desugarComponent(this.#tree as Nodes);
  }

  resolve(): ReturnType<typeof parse> {
    return parse(this.desugar(), ResolverMap);
  }

  get<
    Type extends Extract<Nodes, { name?: string }>["$type"],
    Key extends keyof Extract<Nodes, { $type: Type }>,
    Value extends Extract<Nodes, { $type: Type }>[Key],
  >(type: Type, name: string, key: Key): Value | undefined {
    return getValue(this.#tree as Nodes, type, name, key);
  }

  has<
    Type extends Extract<Nodes, { name?: string }>["$type"],
  >(type: Type, name: string): boolean {
    return hasValue(this.#tree as Nodes, type, name);
  }

  set<
    Type extends Extract<Nodes, { name?: string }>["$type"],
    Key extends Exclude<
      keyof Extract<Nodes, { $type: Type }>,
      "$type" | "name"
    >,
    Value extends Extract<Nodes, { $type: Type }>[Key],
  >(type: Type, name: string, key: Key, value: Value): this {
    this.#tree = setValue(
      this.#tree as Nodes,
      type,
      name,
      key,
      value,
    ) as CharacterTree;

    return this;
  }

  add(node: Statement): this {
    this.#tree.values.push(node);
    return this;
  }

  delete(
    type: Extract<Nodes, { name?: string }>["$type"],
    name: string,
  ): this {
    this.#tree = deleteNode(
      this.#tree as Nodes,
      type,
      name,
    ) as CharacterTree;

    return this;
  }

  setAbilityBase(name: string, base: number): this {
    return this.has("ABILITY", name)
      ? this.set("ABILITY", name, "base", base)
      : this.add(ABILITY({ name, base }));
  }

  addSkill(name: string, ability: string, hasPassive?: boolean): this {
    return this.has("SKILL", name)
      ? this
      : this.add(SKILL({ name, ability, hasPassive }));
  }

  addClass(
    name: string,
    value: Filter<Nodes, "CLASS">["value"],
  ): this {
    return this.has("CLASS", name)
      ? this
      : this.add(CLASS({ name, value, level: 1 }));
  }

  setClassLevel(name: string, level: number): this {
    if (!Number.isInteger(level) || level < 1 || level > 20) return this;
    return this.set("CLASS", name, "level", level);
  }

  setChoice(name: string, active: string[]): this {
    const choices = this.resolve().choices;
    const choice = choices.get(name);

    if (!choice) return this;

    return this.set(choice.type, name, "active", active);
  }

  toggleSwitch(name: string): this {
    return this.set(
      "SWITCH",
      name,
      "active",
      !this.get("SWITCH", name, "active"),
    );
  }

  setSpecies(value: Statement): this {
    return this.has("SECTION", "__SPECIES__")
      ? this.set("SECTION", "__SPECIES__", "value", value)
      : this.add(SECTION_STATEMENT({ name: "__SPECIES__", value }));
  }
}
