import { test } from 'node:test';
import assert from 'node:assert/strict';
import { problemById } from '../lib/curriculum/catalog.ts';
import { cells, rootOf, gridData, gridCursor, dpFocus, dpIndex, dpDependencies, dpInputs, visualStory } from '../lib/curriculum/visual-state.ts';

test('visited cells support coordinate snapshots and Java boolean matrices', () => {
  assert.deepEqual([...cells([[0, 2], [1, 0]])], ['0,2', '1,0']);
  assert.deepEqual([...cells([[false, true], [true, false]])], ['0,1', '1,0']);
  assert.deepEqual([...cells([[false, false]])], []);
  assert.deepEqual([...cells(null)], []);
});
test('component lookup handles absent parents and cyclic user snapshots', () => {
  assert.equal(rootOf([0, 0, 1], '2'), '0');
  assert.equal(rootOf([-1], '0'), '0');
  assert.ok(['0', '1'].includes(rootOf([1, 0], '0')));
});
test('grid snapshots override input without changing the original values', () => {
  const p = problemById['number-islands'];
  const input = { grid: [[1, 0], [1, 1]] };
  const g = gridData(p, input, { grid: [[0, 0], [1, 1]] });
  assert.equal(g.original[0][0], 1);
  assert.equal(g.values[0][0], 0);
  assert.deepEqual(gridCursor({ row: 0, col: 0, r: 1, c: 1 }, 'grid[r][c] = 0'), [1, 1]);
  assert.deepEqual(gridData(problemById['n-queens'], { n: 2 }, {}).values, [['.', '.'], ['.', '.']]);
});
test('DP dependencies and axes retain boundaries and prefix offsets', () => {
  const p = problemById['edit-distance'];
  assert.deepEqual(dpInputs(p, { word1: 'a', word2: '' }).col, ['∅']);
  assert.deepEqual(dpDependencies(p, {}, [0, 0]), []);
  assert.deepEqual(dpFocus(problemById['burst-balloons-dp'], { left: 0, right: 5 }), [0, 5]);
  assert.equal(dpIndex(problemById['house-robber'], { i: 0 }), 2);
});
test('queen explanations distinguish rejected choices from removed queens', () => {
  const p = problemById['n-queens'];
  const frame = { event: 'checkpoint', line: 12, function: 'visit', stack: [], vars: { board: ['Q.', '..'], row: 1, col: 0, phase: 'reject' } };
  assert.match(visualStory(p, frame, undefined, { n: 2 }).text, /Reject this square/);
  assert.match(visualStory(p, { ...frame, vars: { ...frame.vars, phase: 'undo' } }, undefined, { n: 2 }).text, /removed/);
});
