import * as z from "@zod/zod";
import {
  type BaseNode,
  BaseResolverMap,
  deleteNode,
  getAll,
  getValue,
  hashObj,
  hasValue,
  type Library,
  lookup,
  memoize,
  parse,
  setValue,
} from "@lucaengelhard/libttrpg";
import {
  desugarComponent,
  DnDFactory,
  type DndNode,
  DnDSchema,
} from "./components/index.ts";
import { GLOBAL_VALUES } from "./components/global.ts";
import type { Class } from "./components/nodes.ts";

const { MULTIPLE, SECTION } = DnDFactory;

type CharacterTree = Extract<DndNode, { $type: "MULTIPLE" }>;
export class Character {
  #library: Library<DndNode>;

  #tree: CharacterTree = MULTIPLE({
    values: [...Object.values(GLOBAL_VALUES)],
  });

  #caches = {
    desugar: new Map<string, BaseNode>(),
    parse: new Map<string, ReturnType<typeof parse>>(),
  };

  #memoized = {
    desugar: memoize(desugarComponent, this.#caches.desugar),
  };

  constructor(library: Library<DndNode> = {}, tree?: CharacterTree) {
    this.#library = library;
    if (tree) {
      this.#tree = tree;
      return;
    }

    for (const ability of this.lookup("ability")) {
      this.add({ ...ability });
    }

    for (const skill of this.lookup("skill")) {
      this.add(skill);
    }

    for (const flag of this.lookup("flag")) {
      this.add(flag);
    }
  }

  static fromString(input: string, library: Library<DndNode> = {}) {
    const parsed = JSON.parse(input);
    const { data, error } = DnDSchema
      .and(z.looseObject({ $type: z.literal("MULTIPLE") }))
      .safeParse(parsed);

    const character = data ? new Character(library, data) : undefined;

    return { character, error };
  }

  lookup(query: string): DndNode[] {
    return lookup(this.#library, query);
  }

  getTree(): CharacterTree {
    return structuredClone(this.#tree);
  }

  print(desugar?: boolean): string {
    return JSON.stringify(desugar ? this.desugar() : this.#tree, null, 2);
  }

  desugar(): BaseNode {
    return this.#memoized.desugar(this.#tree);
  }

  resolve() {
    const hashstr = hashObj(this.#tree);
    const cached = this.#caches.parse.get(hashstr);
    if (cached !== undefined) return cached;

    const res = parse(this.desugar(), BaseResolverMap);
    this.#caches.parse.set(hashstr, res);
    return res;
  }

  getChoices(key?: string) {
    if (key !== undefined) return this.resolve().choices.get(key);
    return this.resolve().choices;
  }

  getValues() {
    return this.resolve().values;
  }

  get<
    Type extends Extract<DndNode, { name?: string }>["$type"],
    Key extends keyof Extract<DndNode, { $type: Type }>,
  >(type: Type, name: string, key: Key) {
    return getValue(this.#tree as DndNode, type, name, key);
  }

  getAll<Type extends Extract<DndNode, { name?: string }>["$type"]>(
    type: Type,
    name?: string,
  ) {
    return getAll(this.#tree as DndNode, type, name);
  }

  has<
    Type extends Extract<DndNode, { name?: string }>["$type"],
  >(type: Type, name: string) {
    return hasValue(this.#tree as DndNode, type, name);
  }

  set<
    Type extends Extract<DndNode, { name?: string }>["$type"],
    Key extends Exclude<
      keyof Extract<DndNode, { $type: Type }>,
      "$type" | "name"
    >,
    Value extends Extract<DndNode, { $type: Type }>[Key],
  >(type: Type, name: string, key: Key, value: Value) {
    this.#tree = setValue(
      this.#tree as DndNode,
      type,
      name,
      key,
      value,
    ) as CharacterTree;

    return this;
  }

  add(node: DndNode) {
    this.#tree.values.push(node);
    return this;
  }

  delete(
    type: Extract<DndNode, { name?: string }>["$type"],
    name: string,
  ) {
    this.#tree = deleteNode(
      this.#tree as DndNode,
      type,
      name,
    ) as CharacterTree;

    return this;
  }

  addClass(name: string) {
    const result = this.lookup(`class.${name}`);

    if (result.length !== 1 || this.has("CLASS", name)) return this; // TODO better error handling?

    const classes = this.getAll("CLASS");
    return this.add({
      ...(result[0] as Class),
      level: 1,
      isMain: classes.length === 0,
    });
  }

  setClassLevel(name: string, level: number) {
    if (!Number.isInteger(level) || level < 1 || level > 20) return this;
    return this.set("CLASS", name, "level", level);
  }

  setHpRoll(className: string, level: number, value: number): this {
    const current = this.getAll("CLASS", className)[0];
    if (current === undefined) return this;

    return this.set("CLASS", className, "hpRolls", {
      ...current.hpRolls,
      [level]: value,
    });
  }

  setChoice(name: string, active: string[]) {
    const choices = this.resolve().choices;
    const choice = choices.get(name);

    if (!choice) return this;

    return this.set(choice.type, name, "active", active);
  }

  toggleFlag(name: string) {
    return this.set(
      "FLAG",
      name,
      "true",
      !this.get("FLAG", name, "true"),
    );
  }

  setSpecies(name: string) {
    const result = this.lookup(`species.${name}`);
    if (result.length !== 1) return this; // TODO better error handling?

    return this.has("SECTION", "__SPECIES__")
      ? this.set("SECTION", "__SPECIES__", "value", result[0])
      : this.add(
        SECTION({
          name: "__SPECIES__",
          value: result[0],
        }),
      );
  }

  setBackground(name: string) {
    const result = this.lookup(`backgrounds.${name}`);
    if (result.length !== 1) return this; // TODO better error handling?

    return this.has("SECTION", "__BACKGROUND__")
      ? this.set("SECTION", "__BACKGROUND__", "value", result[0])
      : this.add(
        SECTION({
          name: "__BACKGROUND__",
          value: result[0],
        }),
      );
  }

  addItem(name: string) {
    if (this.has("ITEM", name)) return this;
    const result = this.lookup(name);
    if (result.length !== 1) return this;

    return this.add(result[0]);
  }
}
