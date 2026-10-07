import test from "node:test";
import assert from "node:assert/strict";
import {
  stepDuration,
  stageTransition,
  PLAYBACK_SPEEDS,
} from "../lib/playback-motion";
test("all playback speeds retain time for movement and reading", () => {
  assert.equal(stepDuration(1), 850);
  for (const speed of PLAYBACK_SPEEDS) {
    const ms = stepDuration(speed);
    assert.ok(stageTransition(speed).duration * 1000 < ms);
    assert.equal(stageTransition(speed, true).duration, 0);
  }
  assert.equal(stepDuration(0.5), 1700);
  assert.equal(stepDuration(4), 212.5);
});
test("invalid and extreme stored speeds cannot freeze or overload playback", () => {
  for (const speed of [NaN, Infinity, 0, -1])
    assert.equal(stepDuration(speed), 850);
  assert.equal(stepDuration(100), 212.5);
  assert.equal(stepDuration(0.001), 3400);
});
