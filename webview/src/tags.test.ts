import { describe, expect, it } from "vitest";
import { normalizeTags } from "./tags";

describe("normalizeTags", () => {
  it("trims tags, ignores blanks, and preserves first spelling when deduplicating", () => {
    expect(normalizeTags(["  Research ", "research", "", "  ", "ModelE"])).toEqual([
      "Research",
      "ModelE",
    ]);
  });

  it("allows an empty result for clearing tags", () => {
    expect(normalizeTags([])).toEqual([]);
    expect(normalizeTags([" ", "\t"])).toEqual([]);
  });

  it("rejects non-string, overlong, and excessive tag payloads", () => {
    expect(() => normalizeTags(["ok", 42 as unknown as string])).toThrow();
    expect(() => normalizeTags(["a".repeat(31)])).toThrow();
    expect(() => normalizeTags(Array.from({ length: 11 }, (_, index) => `tag-${index}`))).toThrow();
  });
});
