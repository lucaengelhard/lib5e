import {
  type BaseNode,
  type Extend,
  type Node,
  parse,
} from "@lucaengelhard/libttrpg";
import {
  type Component,
  desugarComponent,
  getComponent,
  GLOBAL_VALUES,
  hasComponent,
  setComponent,
} from "./components.ts";

type Tree = { type: "MULTIPLE"; values: Extend<Node, Component, Node>[] };
export class Character {
  #tree: Tree = {
    type: "MULTIPLE",
    values: [
      {
        type: "SECTION",
        name: "__GLOBAL_VALUES__",
        value: {
          type: "MULTIPLE",
          values: [
            GLOBAL_VALUES.LEVEL,
            GLOBAL_VALUES.PROFICIENCY_BONUS,
            GLOBAL_VALUES.WALKING_SPEED,
            GLOBAL_VALUES.SWIMMING_SPEED,
            GLOBAL_VALUES.CLIMBING_SPEED,
            GLOBAL_VALUES.FLYING_SPEED,
          ],
        },
      },
    ],
  };

  constructor(tree?: Tree) {
    if (tree) this.#tree = tree;
  }

  getTree() {
    return structuredClone(this.#tree);
  }

  desugar(onlyOneLevel?: boolean) {
    return desugarComponent(onlyOneLevel)(
      this.#tree,
      undefined,
      {},
    ) as BaseNode;
  }

  resolve() {
    return parse(this.desugar());
  }

  setAbilityBase(name: string, base: number) {
    const existing = hasComponent(this.#tree, {
      nodeType: "ABILITY",
      name,
      key: "name",
    });

    if (existing) {
      this.#tree = setComponent(this.#tree, undefined, {
        nodeType: "ABILITY",
        name,
        key: "base",
        value: base,
      }) as Tree;
    } else {
      this.#tree.values.push({ type: "ABILITY", name, base });
    }

    return this;
  }

  addSkill(name: string, ability: string) {
    const existing = hasComponent(this.#tree, {
      nodeType: "SKILL",
      name,
      key: "name",
    });

    if (!existing) {
      this.#tree.values.push({ type: "SKILL", name, ability });
    }

    return this;
  }

  addClass(name: string, value: Extend<Node, Component, Node>) {
    const existing = hasComponent(this.#tree, {
      nodeType: "CLASS",
      name,
      key: "name",
    });

    if (!existing) {
      this.#tree.values.push({
        type: "CLASS",
        name,
        value: value as Node,
        level: 1,
      });
    }

    return this;
  }

  setClassLevel(name: string, level: number) {
    if (!Number.isInteger(level) || level < 1 || level > 20) return this;

    this.#tree = setComponent(this.#tree, undefined, {
      nodeType: "CLASS",
      name,
      key: "level",
      value: level,
    }) as Tree;

    return this;
  }

  setSpecies(name: string, value: Extend<Node, Component, Node>) {
    const existing = hasComponent(this.#tree, {
      nodeType: "SPECIES",
      name,
      key: "name",
    });

    if (!existing) {
      this.#tree.values.push({ type: "SPECIES", name, value: value as Node });
    }

    return this;
  }

  setChoice(name: string, active: string[]) {
    const choices = this.resolve().choices;
    const choice = choices.get(name);

    if (!choice) return this;

    this.#tree = setComponent(this.#tree, undefined, {
      nodeType: choice.type,
      name,
      key: "active",
      value: active,
    }) as Tree;

    return this;
  }

  toggleSwitch(name: string) {
    const current = getComponent(this.#tree, undefined, {
      nodeType: "SWITCH",
      name,
      key: "active",
    });

    if (typeof current !== "boolean") return this;

    this.#tree = setComponent(this.#tree, undefined, {
      nodeType: "SWITCH",
      name,
      key: "active",
      value: !current,
    }) as Tree;

    return this;
  }
}
