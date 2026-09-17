import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedState } from "./seed";
import { migrateState, reducer, validateState, loadState, saveState } from "./state";
import type { DemoState } from "./models";

/** 为每个测试创建独立的 seed 状态副本。 */
function freshState(): DemoState {
  return reducer(seedState, { type: "reset" });
}

describe("demo state reducer", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("moves selected extensions to one group", () => {
    const state = freshState();
    const next = reducer(state, { type: "move", ids: ["ms-python.python", "github.copilot"], groupId: "writing" });

    expect(next.extensions.find((extension) => extension.id === "ms-python.python")?.groupId).toBe("writing");
    expect(next.extensions.find((extension) => extension.id === "github.copilot")?.groupId).toBe("writing");
    expect(next.extensions.filter((extension) => extension.groupId === "writing")).toHaveLength(4);
    expect(state.extensions.find((extension) => extension.id === "ms-python.python")?.groupId).toBe("python-data");
  });

  it("deletes a group and clears only its assignments", () => {
    const state = freshState();
    const next = reducer(state, { type: "deleteGroup", id: "writing" });

    expect(next.groups.some((group) => group.id === "writing")).toBe(false);
    expect(next.extensions.filter((extension) => extension.groupId === null)).toHaveLength(4);
    expect(next.extensions.find((extension) => extension.id === "ms-python.python")?.groupId).toBe("python-data");
  });

  it("validates schema, duplicate IDs, and broken references", () => {
    const state = freshState();
    expect(validateState(state)).toBe(true);
    expect(validateState({ ...state, schemaVersion: 2 })).toBe(false);
    expect(validateState({ ...state, groups: [...state.groups, { ...state.groups[0] }] })).toBe(false);
    expect(
      validateState({
        ...state,
        extensions: state.extensions.map((extension, index) =>
          index === 0 ? { ...extension, groupId: "missing-group" } : extension,
        ),
      }),
    ).toBe(false);
    expect(
      validateState({
        ...state,
        extensions: state.extensions.map((extension, index) =>
          index === 0 ? { ...extension, tags: [" Data "] } : extension,
        ),
      }),
    ).toBe(false);
    expect(
      validateState({
        ...state,
        extensions: state.extensions.map((extension, index) =>
          index === 0 ? { ...extension, tags: "data" } : extension,
        ),
      }),
    ).toBe(false);
  });

  it("rejects invalid or duplicate group names", () => {
    const state = freshState();
    expect(reducer(state, { type: "createGroup", name: "   " })).toBe(state);
    expect(reducer(state, { type: "createGroup", name: "a".repeat(51) })).toBe(state);
    expect(reducer(state, { type: "createGroup", name: " ai CODING " })).toBe(state);
    expect(reducer(state, { type: "renameGroup", id: "writing", name: " PYTHON & DATA " })).toBe(state);
  });

  it("keeps visibility and history when organizing a missing extension", () => {
    const state = freshState();
    const source = state.extensions.find(extension => extension.visibility === "NotVisible")!;
    const next = reducer(state, { type: "move", ids: [source.id], groupId: "writing" });
    expect(next.extensions.find(extension => extension.id === source.id)?.visibility).toBe("NotVisible");
    expect(source.groupId).not.toBe("writing");
  });

  it("sets independent tags without changing group assignments", () => {
    const state = freshState();
    const original = state.extensions.find((extension) => extension.id === "ms-toolsai.jupyter")!;
    const next = reducer(state, {
      type: "setTags",
      ids: [original.id],
      tags: [" Data ", "data", "Research"],
    });
    const jupyter = next.extensions.find((extension) => extension.id === original.id)!;

    expect(jupyter.tags).toEqual(["Data", "Research"]);
    expect(jupyter.groupId).toBe(original.groupId);
    expect(original.tags).toEqual(["Python", "Data"]);

    const cleared = reducer(next, { type: "setTags", ids: [original.id], tags: [] });
    expect(cleared.extensions.find((extension) => extension.id === original.id)?.tags).toEqual([]);
    expect(cleared.extensions.find((extension) => extension.id === original.id)?.groupId).toBe(original.groupId);
  });

  it("reorders groups and keeps extensions untouched", () => {
    const state = freshState();
    const next = reducer(state, { type: "reorderGroup", id: "writing", targetId: "ai-coding" });

    expect(next.groups.map((group) => group.id)).toEqual(["writing", "ai-coding", "python-data", "web-development"]);
    expect(next.extensions).toEqual(state.extensions);
  });

  it("falls back to a seed copy for invalid stored data", () => {
    localStorage.setItem("extension-nest-demo-v1", "{broken json");
    const loaded = loadState();
    expect(loaded).toEqual(seedState);
    expect(loaded).not.toBe(seedState);
    expect(loaded.groups).not.toBe(seedState.groups);
  });

  it("migrates schema 1 states that do not have tags", () => {
    const state = freshState();
    const legacy = {
      ...state,
      extensions: state.extensions.map(({ tags: _tags, ...extension }) => extension),
    };
    const migrated = migrateState(legacy)!;

    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.extensions.every((extension) => Array.isArray(extension.tags))).toBe(true);
    expect(migrated.extensions.every((extension) => extension.tags.length === 0)).toBe(true);
    expect(migrated.groups).toEqual(state.groups);
    expect(migrated.extensions.map((extension) => extension.groupId)).toEqual(
      state.extensions.map((extension) => extension.groupId),
    );
    expect(migrated.extensions.map((extension) => extension.visibility)).toEqual(
      state.extensions.map((extension) => extension.visibility),
    );
  });

  it("saves and loads a valid state", () => {
    const state = freshState();
    expect(saveState(state)).toBe(true);
    expect(loadState()).toEqual(state);
  });
});
