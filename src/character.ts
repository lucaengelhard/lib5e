import {
  type BaseNode,
  BaseResolverMap,
  deleteNode,
  deserialize,
  getValue,
  hasValue,
  type Library,
  libraryLookup,
  parse,
  setValue,
} from "@lucaengelhard/libttrpg";
import {
  ComponentFactory,
  desugarComponent,
  GLOBAL_VALUES,
  type Nodes,
} from "./components.ts";

const { MULTIPLE, SECTION } = ComponentFactory;

type CharacterTree = Extract<Nodes, { $type: "MULTIPLE" }>;
export class Character {
  #library: Library;

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

  constructor(library: Library, tree?: CharacterTree) {
    this.#library = library;
    if (tree) this.#tree = tree;

    for (const ability of this.libraryGet("abilities")) {
      this.add({ ...ability, base: 0 } as Nodes);
    }

    for (const skill of this.libraryGet("skills")) {
      this.add(skill as Nodes);
    }
  }

  libraryGet(query: string): Partial<Nodes>[] {
    return libraryLookup(this.#library, query).map((n) =>
      deserialize(ComponentFactory, n) // TODO
    );
  }

  getTree(): CharacterTree {
    return this.#tree;
  }

  desugar(): BaseNode {
    return desugarComponent(this.#tree as Nodes);
  }

  resolve(): ReturnType<typeof parse> {
    return parse(this.desugar(), BaseResolverMap);
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

  add(node: Nodes): this {
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

  addClass(name: string): this {
    const result = this.libraryGet(`classes.${name}`);
    if (result.length !== 1 || this.has("CLASS", name)) return this; // TODO better error handling?
    return this.add({ ...result[0], level: 0 } as Nodes);
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

  setSpecies(name: string): this {
    const result = this.libraryGet(`species.${name}`);
    if (result.length !== 1) return this; // TODO better error handling?

    return this.has("SECTION", "__SPECIES__")
      ? this.set("SECTION", "__SPECIES__", "value", result[0] as Nodes)
      : this.add(
        SECTION({
          name: "__SPECIES__",
          value: result[0] as Nodes,
        }),
      );
  }
}
