"use client";
import { useEffect, useState } from "react";
import { problems, problemById } from "@/lib/curriculum/catalog";
import { validateProblemInput } from "@/lib/curriculum/validate";
import { cloud, result } from "@/lib/product/cloud";
import { useAccount } from "../product/account";
type Course = { id: string; title: string; description: string };
type CourseLesson = {
  id: string;
  course_id: string;
  position: number;
  problem_id: string;
  title: string;
  instructions: string;
  language: string;
  input: Record<string, unknown>;
};
export function CourseBuilder({
  classes,
  onAssigned,
}: {
  classes: {
    id: string;
    name: string;
    teacher_id: string;
    archived?: boolean;
  }[];
  onAssigned: () => void;
}) {
  const { user } = useAccount(),
    [courses, setCourses] = useState<Course[]>([]),
    [selected, setSelected] = useState(""),
    [lessons, setLessons] = useState<CourseLesson[]>([]),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [problemId, setProblem] = useState(problems[0].id),
    [title, setTitle] = useState(problems[0].title),
    [instructions, setInstructions] = useState(""),
    [input, setInput] = useState(JSON.stringify(problems[0].input, null, 2)),
    [language, setLanguage] = useState("java"),
    [classId, setClass] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0),
    [editing, setEditing] = useState("");
  useEffect(() => {
    setCourses([]);
    setSelected("");
    if (!cloud || !user) return;
    let active = true;
    void result(
      cloud
        .from("courses")
        .select("id,title,description")
        .order("created_at", { ascending: false }),
    )
      .then((rows) => {
        if (active) {
          setCourses(rows ?? []);
          setSelected(rows?.[0]?.id ?? "");
        }
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [user]);
  useEffect(() => {
    setEditing("");
    setLessons([]);
    if (!cloud || !selected) return;
    let active = true;
    void result(
      cloud
        .from("course_lessons")
        .select("*")
        .eq("course_id", selected)
        .order("position"),
    )
      .then((rows) => {
        if (active) setLessons(rows ?? []);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [selected, refresh]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function changeProblem(id: string) {
    setProblem(id);
    setTitle(problemById[id].title);
    setInput(JSON.stringify(problemById[id].input, null, 2));
  }
  const owned = classes.filter((c) => c.teacher_id === user?.id && !c.archived);
  return (
    <section className="product-card">
      <h2>Reusable courses</h2>
      <p>
        Arrange problems into a course, add your questions, and assign the
        sequence to one of your classes.
      </p>
      {!cloud || !user ? (
        <p>Sign in after account setup to save courses.</p>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action(async () => {
                const row = await result(
                  cloud!
                    .from("courses")
                    .insert({
                      teacher_id: user.id,
                      title: name.trim(),
                      description,
                    })
                    .select("id,title,description")
                    .single(),
                );
                if (!row) throw Error("Course could not be created.");
                setCourses((c) => [row, ...c]);
                setSelected(row.id);
                setName("");
                setDescription("");
                setMessage("Course created. Add its lessons below.");
              });
            }}
          >
            <div className="product-form-grid">
              <label>
                Course name
                <input
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Description
                <input
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
            </div>
            <button disabled={busy}>Create course</button>
          </form>
          {courses.length > 0 && (
            <>
              <label>
                Course
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <ol className="course-sequence">
                {lessons.map((l, i) => (
                  <li key={l.id}>
                    <div>
                      <strong>{l.title}</strong>
                      <small>
                        {l.language} · {l.instructions}
                      </small>
                    </div>
                    <div className="product-actions">
                      <button
                        disabled={busy}
                        onClick={() => {
                          setEditing(l.id);
                          setProblem(l.problem_id);
                          setTitle(l.title);
                          setInstructions(l.instructions);
                          setLanguage(l.language);
                          setInput(JSON.stringify(l.input, null, 2));
                        }}
                      >
                        Edit lesson
                      </button>
                      <button
                        disabled={busy || i === 0}
                        aria-label={`Move ${l.title} earlier`}
                        onClick={() =>
                          void action(async () => {
                            const ids = lessons.map((x) => x.id);
                            [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                            await result(
                              cloud!.rpc("trace_reorder_course", {
                                cid: selected,
                                ids,
                              }),
                            );
                            setRefresh((n) => n + 1);
                          })
                        }
                      >
                        ↑
                      </button>
                      <button
                        disabled={busy || i === lessons.length - 1}
                        aria-label={`Move ${l.title} later`}
                        onClick={() =>
                          void action(async () => {
                            const ids = lessons.map((x) => x.id);
                            [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]];
                            await result(
                              cloud!.rpc("trace_reorder_course", {
                                cid: selected,
                                ids,
                              }),
                            );
                            setRefresh((n) => n + 1);
                          })
                        }
                      >
                        ↓
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
              <details open={editing ? true : undefined}>
                <summary>
                  {editing ? "Edit saved lesson" : "Add a lesson"}
                </summary>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void action(async () => {
                      const data = JSON.parse(input),
                        error = validateProblemInput(problemId, data);
                      if (error) throw Error(error);
                      if (editing) {
                        await result(
                          cloud!
                            .from("course_lessons")
                            .update({
                              problem_id: problemId,
                              title:
                                title.trim() || problemById[problemId].title,
                              instructions,
                              language,
                              input: data,
                            })
                            .eq("id", editing)
                            .eq("course_id", selected),
                        );
                        setEditing("");
                      } else
                        await result(
                          cloud!.from("course_lessons").insert({
                            course_id: selected,
                            position: lessons.length,
                            problem_id: problemId,
                            title: title.trim() || problemById[problemId].title,
                            instructions,
                            language,
                            input: data,
                          }),
                        );
                      setRefresh((n) => n + 1);
                      setMessage(
                        editing
                          ? "Lesson updated."
                          : "Lesson added to the course.",
                      );
                    });
                  }}
                >
                  <div className="product-form-grid">
                    <label>
                      Problem
                      <select
                        value={problemId}
                        onChange={(e) => changeProblem(e.target.value)}
                      >
                        {problems.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Language
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        {["java", "cpp", "python", "javascript"].map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Lesson title
                    <input
                      maxLength={120}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </label>
                  <label>
                    Question or instructions
                    <textarea
                      maxLength={3000}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    />
                  </label>
                  <label>
                    Input JSON
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </label>
                  <button
                    disabled={busy || (!editing && lessons.length >= 100)}
                  >
                    {editing ? "Save lesson changes" : "Add lesson"}
                  </button>
                  {editing && (
                    <button type="button" onClick={() => setEditing("")}>
                      Cancel editing
                    </button>
                  )}
                </form>
              </details>
              <label>
                Assign course to class
                <select
                  value={classId}
                  onChange={(e) => setClass(e.target.value)}
                >
                  <option value="">Choose a class</option>
                  {owned.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={busy || !classId || !lessons.length}
                onClick={() =>
                  void action(async () => {
                    const existing =
                      (await result(
                        cloud!
                          .from("assignments")
                          .select("source_lesson_id")
                          .eq("class_id", classId)
                          .in(
                            "source_lesson_id",
                            lessons.map((l) => l.id),
                          ),
                      )) ?? [];
                    const fresh = lessons.filter(
                      (l) => !existing.some((a) => a.source_lesson_id === l.id),
                    );
                    if (!fresh.length)
                      throw Error(
                        "All current course lessons are already assigned to this class.",
                      );
                    await result(
                      cloud!.from("assignments").insert(
                        fresh.map((l) => ({
                          class_id: classId,
                          title: l.title,
                          instructions: l.instructions,
                          problem_id: l.problem_id,
                          input: l.input,
                          language: l.language,
                          source_lesson_id: l.id,
                          course_order: l.position,
                        })),
                      ),
                    );
                    setMessage("Course lessons assigned to the class.");
                    onAssigned();
                  })
                }
              >
                Assign new course lessons
              </button>
              <p>
                Each course lesson can be assigned once to a class. Students
                open it from their class assignments.
              </p>
            </>
          )}
        </>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
export function TeacherFeedback({ submissionId }: { submissionId: string }) {
  const [note, setNote] = useState(""),
    [status, setStatus] = useState("reviewed"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!cloud) return;
    let active = true;
    void result(
      cloud
        .from("submission_feedback")
        .select("note,status")
        .eq("submission_id", submissionId)
        .maybeSingle(),
    )
      .then((row) => {
        if (active && row) {
          setNote(row.note);
          setStatus(row.status);
        }
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [submissionId]);
  return (
    <details className="teacher-feedback">
      <summary>Give written feedback</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!cloud) return;
          setBusy(true);
          void result(
            cloud.from("submission_feedback").upsert({
              submission_id: submissionId,
              note: note.trim(),
              status,
            }),
          )
            .then(() => setMessage("Feedback saved for this student."))
            .catch((e) => setMessage(e.message))
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Review status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="reviewed">Reviewed</option>
            <option value="revise">Needs revision</option>
            <option value="understood">Understood</option>
          </select>
        </label>
        <label>
          Feedback
          <textarea
            required
            maxLength={4000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button disabled={busy}>Save feedback</button>
      </form>
      <small role="status">{message}</small>
    </details>
  );
}
export function StudentFeedback({ assignmentId }: { assignmentId: string }) {
  const { user } = useAccount(),
    [value, setValue] = useState<{
      note: string;
      status: string;
      updated_at: string;
    } | null>(null),
    [message, setMessage] = useState(""),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    setValue(null);
    if (!cloud || !user) return;
    let active = true;
    void result(
      cloud
        .from("submissions")
        .select("id")
        .eq("assignment_id", assignmentId)
        .eq("user_id", user.id)
        .maybeSingle(),
    )
      .then((s) =>
        s
          ? result(
              cloud!
                .from("submission_feedback")
                .select("note,status,updated_at")
                .eq("submission_id", s.id)
                .maybeSingle(),
            )
          : null,
      )
      .then((v) => {
        if (active) setValue(v);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [assignmentId, user, refresh]);
  return (
    <section className="saved-item">
      <button onClick={() => setRefresh((n) => n + 1)}>
        Refresh teacher feedback
      </button>
      {value ? (
        <div className="saved-item">
          <h3>Your teacher’s feedback · {value.status}</h3>
          <p>{value.note}</p>
          <small>{new Date(value.updated_at).toLocaleString()}</small>
        </div>
      ) : message ? (
        <p>{message}</p>
      ) : null}
    </section>
  );
}
