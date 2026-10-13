import test from "node:test";
import assert from "node:assert/strict";
import { arrayLayout } from "../lib/experience/array-layout";

test("every array cell fits its panel and stays in index order across responsive sizes", () => {
  for (const width of [240, 316, 390, 574, 720, 1100]) {
    for (const count of [0, 1, 3, 8, 13, 32, 100]) {
      const layout = arrayLayout(count, width);
      assert.ok(layout.width <= width + 0.01);
      assert.ok(layout.tile >= 36);
      for (let i = 0; i < count; i++) {
        const right = (i % layout.columns) * layout.gap + layout.tile;
        assert.ok(right <= width + 0.01, `${count} cells in ${width}px`);
        assert.ok(
          Math.floor(i / layout.columns) * layout.rowHeight < layout.height,
        );
      }
    }
  }
});
test("the reported 13-character input fits a laptop panel without horizontal scrolling", () => {
  assert.equal(arrayLayout(13, 574).rows, 1);
  assert.equal(arrayLayout(13, 316).rows, 2);
});
