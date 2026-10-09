import test from "node:test";
import assert from "node:assert/strict";
import { modules } from "../lib/computer-science/catalog";
import { lessons as foundationLessons, lessonInputs } from "../lib/lessons";
import { problems } from "../lib/curriculum/catalog";
import {
  csCourseContent,
  type CourseUnit,
} from "../lib/learning/cs-course-content";
import { foundationCourseContent } from "../lib/learning/foundation-course-content";
import { patternUnits } from "../lib/learning/dsa-course-content";
import { courseBenchmarks } from "../lib/learning/benchmarks";
import { trackProjects } from "../lib/learning/projects";
import { foundationSource } from "../lib/foundations/sources";
import { runCode } from "../lib/trace/interpreter";
function checkUnit(unit: CourseUnit, id: string) {
  assert.ok(unit, id);
  assert.ok(unit.prerequisites.length >= 2, id);
  assert.ok(unit.concept.length > 100, id);
  assert.ok(unit.worked.prompt.length > 20, id);
  assert.ok(unit.worked.steps.length >= 2, id);
  assert.ok(unit.worked.answer.length > 15, id);
  assert.ok(unit.comparison.baseline !== unit.comparison.improved, id);
  assert.ok(
    unit.transfer.prompt.length > 20 && unit.transfer.solution.length > 60,
    id,
  );
  assert.equal(unit.rubric.length, 3, id);
  assert.ok(!JSON.stringify(unit).match(/TODO|coming soon|placeholder/i), id);
}
test("every supported CS and foundation lesson has a substantive study unit", () => {
  assert.equal(Object.keys(csCourseContent).length, modules.length);
  for (const m of modules) checkUnit(csCourseContent[m.id], m.id);
  assert.equal(
    Object.keys(foundationCourseContent).length,
    foundationLessons.length,
  );
  for (const l of foundationLessons)
    checkUnit(foundationCourseContent[l.id], l.id);
});
test("every roadmap problem has a complete pattern workshop", () => {
  assert.equal(patternUnits.length, 25);
  for (const p of problems) {
    const unit = patternUnits[p.group - 1];
    assert.ok(unit, p.id);
    for (const field of Object.values(unit))
      assert.ok(field.trim().length > 20, p.id);
  }
});
test("each track has three distinct references and an actionable project", () => {
  assert.equal(Object.keys(courseBenchmarks).length, 7);
  for (const [track, sources] of Object.entries(courseBenchmarks)) {
    assert.equal(sources.length, 3, track);
    assert.equal(new Set(sources.map((s) => s.url)).size, 3, track);
    for (const s of sources)
      assert.ok(s.access.length > 10 && s.focus.length > 20);
  }
  for (const project of Object.values(trackProjects)) {
    assert.equal(project.milestones.length, 3);
    assert.equal(project.checks.length, 4);
    for (const milestone of project.milestones)
      assert.ok(milestone.task.length > 60 && milestone.model.length > 100);
    for (const id of project.labIds)
      assert.ok(
        modules.some((m) => m.id === id),
        id,
      );
  }
});
test("foundation worked examples agree with executable references", () => {
  const cases: Record<
    string,
    { nums: number[]; parameter: number; expected: unknown }
  > = {
    "binary-search": {
      nums: [2, 4, 7, 9, 11, 14, 18, 21],
      parameter: 14,
      expected: 5,
    },
    "two-sum": { nums: [1, 3, 4, 8], parameter: 11, expected: [1, 3] },
    "sliding-window": { nums: [-5, -2, -4], parameter: 2, expected: -6 },
    "bubble-sort": { nums: [4, 1, 3], parameter: 0, expected: [1, 3, 4] },
    "insertion-sort": { nums: [2, 5, 3], parameter: 0, expected: [2, 3, 5] },
    "prefix-sum": { nums: [2, -1, 4], parameter: 0, expected: [0, 2, 1, 5] },
  };
  for (const lesson of foundationLessons) {
    const c = cases[lesson.id];
    const run = runCode(
      foundationSource(lesson, c.nums.length, "python"),
      lessonInputs(lesson, c.nums, c.parameter),
    );
    assert.equal(run.error, undefined);
    assert.deepEqual(run.frames.at(-1)!.vars.result, c.expected);
  }
});
