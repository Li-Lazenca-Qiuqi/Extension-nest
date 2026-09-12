import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedState } from "./seed";
import { reducer, validateState, loadState, saveState } from "./state";
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
  });

  it("rejects invalid or duplicate group names", () => {
    const state = freshState();
    expect(reducer(state, { type: "createGroup", name: "   " })).toBe(state);
    expect(reducer(state, { type: "createGroup", name: "a".repeat(51) })).toBe(state);
    expect(reducer(state, { type: "createGroup", name: " ai CODING " })).toBe(state);
    expect(reducer(state, { type: "renameGroup", id: "writing", name: " PYTHON & DATA " })).toBe(state);
  });

  it("applies update and uninstall without mutating the input", () => {
    const state = freshState();
    const updated = reducer(state, { type: "update", id: "ms-python.python" });
    const python = updated.extensions.find((extension) => extension.id === "ms-python.python");
    expect(python?.version).toBe("2024.22.0");
    expect(python?.update).toBeUndefined();
    expect(state.extensions.find((extension) => extension.id === "ms-python.python")?.update).toBe("2024.22.0");

    const uninstalled = reducer(updated, { type: "uninstall", id: "ms-python.python" });
    expect(uninstalled.extensions.some((extension) => extension.id === "ms-python.python")).toBe(false);
    expect(updated.extensions.some((extension) => extension.id === "ms-python.python")).toBe(true);
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

  it("saves and loads a valid state", () => {
    const state = freshState();
    expect(saveState(state)).toBe(true);
    expect(loadState()).toEqual(state);
  });
});
