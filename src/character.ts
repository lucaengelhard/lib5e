import {
  type BaseNode,
  BaseResolverMap,
  deleteNode,
  getValue,
  hasValue,
  type Library,
  lookup,
  parse,
  setValue,
} from "@lucaengelhard/libttrpg";
import {
  desugarComponent,
  DnDFactory,
  type DndNode,
} from "./components/index.ts";
import { GLOBAL_VALUES } from "./components/global.ts";

const { MULTIPLE, SECTION } = DnDFactory;

type CharacterTree = Extract<DndNode, { $type: "MULTIPLE" }>;
export class Character {
  #library: Library<DndNode>;

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

  constructor(library: Library<DndNode> = {}, tree?: CharacterTree) {
    this.#library = library;
    if (tree) this.#tree = tree;

    for (const ability of this.lookup("abilities")) {
      this.add({ ...ability });
    }

    for (const skill of this.lookup("skills")) {
      this.add(skill);
    }
  }

  lookup(query: string): DndNode[] {
    return lookup(this.#library, query);
  }

  getTree(): CharacterTree {
    return this.#tree;
  }

  desugar(): BaseNode {
    return desugarComponent(this.#tree);
  }

  resolve(): ReturnType<typeof parse> {
    return parse(this.desugar(), BaseResolverMap);
  }

  get<
    Type extends Extract<DndNode, { name?: string }>["$type"],
    Key extends keyof Extract<DndNode, { $type: Type }>,
    Value extends Extract<DndNode, { $type: Type }>[Key],
  >(type: Type, name: string, key: Key): Value | undefined {
    return getValue(this.#tree as DndNode, type, name, key);
  }

  has<
    Type extends Extract<DndNode, { name?: string }>["$type"],
  >(type: Type, name: string): boolean {
    return hasValue(this.#tree as DndNode, type, name);
  }

  set<
    Type extends Extract<DndNode, { name?: string }>["$type"],
    Key extends Exclude<
      keyof Extract<DndNode, { $type: Type }>,
      "$type" | "name"
    >,
    Value extends Extract<DndNode, { $type: Type }>[Key],
  >(type: Type, name: string, key: Key, value: Value): this {
    this.#tree = setValue(
      this.#tree as DndNode,
      type,
      name,
      key,
      value,
    ) as CharacterTree;

    return this;
  }

  add(node: DndNode): this {
    this.#tree.values.push(node);
    return this;
  }

  delete(
    type: Extract<DndNode, { name?: string }>["$type"],
    name: string,
  ): this {
    this.#tree = deleteNode(
      this.#tree as DndNode,
      type,
      name,
    ) as CharacterTree;

    return this;
  }

  addClass(name: string): this {
    const result = this.lookup(`classes.${name}`);
    if (result.length !== 1 || this.has("CLASS", name)) return this; // TODO better error handling?
    return this.add({ ...result[0], level: 0 } as DndNode);
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
    const result = this.lookup(`species.${name}`);
    if (result.length !== 1) return this; // TODO better error handling?

    return this.has("SECTION", "__SPECIES__")
      ? this.set("SECTION", "__SPECIES__", "value", result[0] as DndNode)
      : this.add(
        SECTION({
          name: "__SPECIES__",
          value: result[0] as DndNode,
        }),
      );
  }
}
