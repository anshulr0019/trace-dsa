"use client";
import { useEffect, useState } from "react";
import { problems, problemById } from "@/lib/curriculum/catalog";
import { validateProblemInput } from "@/lib/curriculum/validate";
import { practiceCases, levels } from "@/lib/practice/cases";
import {
  lessonURL,
  openProblem,
  type SharedLesson,
} from "@/lib/product/lessons";
import { ClassOverview } from "./class-overview";
import { cloud, result } from "@/lib/product/cloud";
import { useAccount, AccountPanel } from "./account";
import {
  CourseBuilder,
  TeacherFeedback,
  StudentFeedback,
} from "../lab/course-builder";
type ClassRow = {
  id: string;
  name: string;
  teacher_id: string;
  invite_code: string;
  archived: boolean;
};
type Assignment = {
  id: string;
  class_id: string;
  title: string;
  instructions: string;
  problem_id: string;
  input: Record<string, unknown>;
  language: SharedLesson["language"];
  due_at: string | null;
};
type Submission = {
  id: string;
  assignment_id: string;
  user_id: string;
  display_name: string;
  problem_id: string;
  language: string;
  score: number | null;
  reflection: string;
  code: string;
  input: Record<string, unknown> | null;
  updated_at: string;
};
export function TeacherWorkspace() {
  const { user } = useAccount(),
    [problemId, setProblem] = useState(problems[0].id),
    [title, setTitle] = useState("Sliding window: explain every move"),
    [instructions, setInstructions] = useState(
      "Predict the answer first. Run the example, then explain why each window update is safe.",
    ),
    [input, setInput] = useState(JSON.stringify(problems[0].input, null, 2)),
    [language, setLanguage] = useState<SharedLesson["language"]>("python"),
    [url, setURL] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [classes, setClasses] = useState<ClassRow[]>([]),
    [classId, setClassId] = useState(""),
    [name, setName] = useState(""),
    [joinCode, setJoinCode] = useState(""),
    [assignments, setAssignments] = useState<Assignment[]>([]),
    [submissions, setSubmissions] = useState<Submission[]>([]),
    [due, setDue] = useState(""),
    [refresh, setRefresh] = useState(0),
    [members, setMembers] = useState(0),
    [enrollment, setEnrollment] = useState<
      { user_id: string; joined_at: string }[]
    >([]);
  async function perform(fn: () => Promise<void>) {
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
  async function reload() {
    if (!cloud || !user) return;
    const rows =
      (await result(
        cloud
          .from("classes")
          .select("*")
          .order("created_at", { ascending: false }),
      )) ?? [];
    setClasses(rows);
    if (rows.length && !classId) setClassId(rows[0].id);
  }
  useEffect(() => {
    if (user) void perform(reload);
    else {
      setClassId("");
      setClasses([]);
      setAssignments([]);
      setSubmissions([]);
    }
  }, [user]);
  useEffect(() => {
    setAssignments([]);
    setSubmissions([]);
    setMembers(0);
    if (!classId || !cloud || !user) return;
    let active = true;
    void perform(async () => {
      const a =
        (await result(
          cloud!
            .from("assignments")
            .select("*")
            .eq("class_id", classId)
            .order("created_at", { ascending: false })
            .order("course_order", { ascending: true, nullsFirst: false }),
        )) ?? [];
      const s = a.length
        ? ((await result(
            cloud!
              .from("submissions")
              .select(
                "id,assignment_id,user_id,display_name,problem_id,language,score,reflection,code,input,updated_at",
              )
              .in(
                "assignment_id",
                a.map((x) => x.id),
              ),
          )) ?? [])
        : [];
      const { count, error } = await cloud!
        .from("class_members")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classId);
      if (error) throw Error(error.message);
      const enrolled =
        (await result(
          cloud!
            .from("class_members")
            .select("user_id,joined_at")
            .eq("class_id", classId),
        )) ?? [];
      if (active) {
        setEnrollment(enrolled);
        setAssignments(a);
        setSubmissions(s);
        setMembers(count ?? 0);
      }
    });
    return () => {
      active = false;
    };
  }, [classId, user, refresh]);
  function draft() {
    const data = JSON.parse(input);
    const error = validateProblemInput(problemId, data);
    if (error) throw Error(error);
    return {
      version: 1 as const,
      problemId,
      title: title.trim() || problemById[problemId].title,
      instructions,
      input: data,
      language,
    };
  }
  const selected = classes.find((c) => c.id === classId),
    owner = selected?.teacher_id === user?.id;
  return (
    <section className="product-page">
      <div className="eyebrow mint">TEACH WITH TRACE</div>
      <h1>Lessons & classes</h1>
      <p>
        Build an example, share a lesson, and give your class something concrete
        to explain.
      </p>
      <details className="product-card">
        <summary>Preview a sample class overview</summary>
        <p>
          Example data. Sign in and configure class services to collect real
          submissions.
        </p>
        <ClassOverview
          assignments={[
            { id: "sample-a", title: "Explain a sliding window", due_at: null },
            { id: "sample-b", title: "Justify binary search", due_at: null },
          ]}
          enrollment={[
            { user_id: "sample-1", joined_at: "2026-10-01" },
            { user_id: "sample-2", joined_at: "2026-10-01" },
          ]}
          submissions={[
            {
              id: "sample-submission",
              assignment_id: "sample-a",
              user_id: "sample-1",
              display_name: "Sample learner",
              score: 62,
              reflection: "I moved the window.",
              language: "java",
              updated_at: "2026-10-01",
            },
          ]}
          onReview={() =>
            setMessage(
              "Sample review: ask the learner to explain why removing the outgoing value preserves a fixed-size window.",
            )
          }
        />
      </details>
      <section className="product-card">
        <h2>Create a shareable lesson</h2>
        <div className="product-form-grid">
          <label>
            Problem
            <select
              value={problemId}
              onChange={(e) => {
                setProblem(e.target.value);
                setInput(
                  JSON.stringify(problemById[e.target.value].input, null, 2),
                );
                setTitle(problemById[e.target.value].title);
                setURL("");
              }}
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
              onChange={(e) =>
                setLanguage(e.target.value as SharedLesson["language"])
              }
            >
              {["python", "cpp", "java", "javascript"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Lesson title
          <input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          What should students investigate?
          <textarea
            value={instructions}
            maxLength={3000}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </label>
        <label>
          Example input (JSON)
          <textarea
            className="mono"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
        <div className="product-actions">
          <button
            onClick={() => {
              try {
                setURL(lessonURL(draft()));
                setMessage(
                  "Lesson link created. The example runs only when the student presses Play.",
                );
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Invalid lesson.");
              }
            }}
          >
            Create lesson link
          </button>
          {url && (
            <>
              <button
                onClick={() =>
                  void perform(async () => {
                    await navigator.clipboard.writeText(url);
                    setMessage("Link copied.");
                  })
                }
              >
                Copy link
              </button>
              <a href={url}>Open lesson →</a>
            </>
          )}
        </div>
        {url && (
          <label>
            Share this link
            <input readOnly value={url} onFocus={(e) => e.target.select()} />
          </label>
        )}
      </section>
      <AccountPanel />
      <p>
        <a href="/?view=classroom">Host or join a live classroom →</a>
      </p>
      <CourseBuilder
        classes={classes}
        onAssigned={() => setRefresh((n) => n + 1)}
      />
      <section className="product-card">
        <h2>Your classes</h2>
        {!user ? (
          <p>
            Sign in to create or join a class. Shareable lessons work without an
            account.
          </p>
        ) : (
          <>
            <div className="product-form-grid">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void perform(async () => {
                    await result(
                      cloud!
                        .from("classes")
                        .insert({ name: name.trim(), teacher_id: user.id }),
                    );
                    setName("");
                    await reload();
                    setMessage(
                      "Class created. Select it below to see its invite code.",
                    );
                  });
                }}
              >
                <label>
                  New class name
                  <input
                    required
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <button disabled={busy}>Create class</button>
              </form>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void perform(async () => {
                    await result(
                      cloud!.rpc("join_trace_class", { code: joinCode.trim() }),
                    );
                    setJoinCode("");
                    await reload();
                    setMessage("Joined the class.");
                  });
                }}
              >
                <label>
                  Join with an invite code
                  <input
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </label>
                <button disabled={busy}>Join class</button>
              </form>
            </div>
            {classes.length > 0 && (
              <>
                <label>
                  Class
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                {owner && (
                  <>
                    <p>
                      Invite code: <code>{selected?.invite_code}</code>
                      {selected?.archived ? " · Class archived" : ""}
                    </p>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void perform(async () => {
                          await result(
                            cloud!
                              .from("classes")
                              .update({ archived: !selected?.archived })
                              .eq("id", classId),
                          );
                          await reload();
                          setMessage(
                            selected?.archived
                              ? "Class reopened."
                              : "Class archived. New joins are closed.",
                          );
                        })
                      }
                    >
                      {selected?.archived ? "Reopen class" : "Archive class"}
                    </button>
                    <details>
                      <summary>Manage enrollment</summary>
                      {enrollment.map((m) => (
                        <div className="saved-item" key={m.user_id}>
                          <small>
                            Joined {new Date(m.joined_at).toLocaleString()} ·
                            account {m.user_id.slice(0, 8)}
                          </small>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void perform(async () => {
                                await result(
                                  cloud!
                                    .from("class_members")
                                    .delete()
                                    .eq("class_id", classId)
                                    .eq("user_id", m.user_id),
                                );
                                setRefresh((n) => n + 1);
                                setMessage(
                                  "Student removed from the class. They can rejoin with its invite code.",
                                );
                              })
                            }
                          >
                            Remove enrollment
                          </button>
                        </div>
                      ))}
                    </details>
                    <label>
                      Due date (optional)
                      <input
                        type="datetime-local"
                        value={due}
                        onChange={(e) => setDue(e.target.value)}
                      />
                    </label>
                    <button
                      disabled={busy || selected?.archived}
                      onClick={() =>
                        void perform(async () => {
                          const d = draft();
                          await result(
                            cloud!.from("assignments").insert({
                              class_id: classId,
                              title: d.title,
                              instructions: d.instructions,
                              problem_id: problemId,
                              input: d.input,
                              language: d.language,
                              due_at: due ? new Date(due).toISOString() : null,
                            }),
                          );
                          setRefresh((n) => n + 1);
                          setMessage("Assigned to the class.");
                        })
                      }
                    >
                      Assign the lesson above
                    </button>
                  </>
                )}
                <div className="notebook-list">
                  {assignments.map((a) => (
                    <article key={a.id}>
                      <div>
                        <h3>{a.title}</h3>
                        <p>{a.instructions}</p>
                        <small>
                          {a.due_at
                            ? `Due ${new Date(a.due_at).toLocaleString()}`
                            : "No deadline"}{" "}
                          ·{" "}
                          {
                            submissions.filter((s) => s.assignment_id === a.id)
                              .length
                          }{" "}
                          submissions
                        </small>
                      </div>
                      <button
                        onClick={() =>
                          openProblem(
                            a.problem_id,
                            `&assignment=${a.id}&language=${a.language}`,
                          )
                        }
                      >
                        Open assignment →
                      </button>
                    </article>
                  ))}
                  {!assignments.length && <p>No assignments yet.</p>}
                </div>
                {owner && (
                  <>
                    <ClassOverview
                      assignments={assignments}
                      submissions={submissions}
                      enrollment={enrollment}
                      onReview={(id) =>
                        document
                          .getElementById(`submission-${id}`)
                          ?.scrollIntoView({
                            block: "start",
                            behavior: "instant",
                          })
                      }
                    />
                    <h3>Student reflections & progress</h3>
                    <p>
                      {members} enrolled students · {assignments.length}{" "}
                      assignments ·{" "}
                      {new Set(submissions.map((s) => s.user_id)).size} students
                      have submitted
                    </p>
                    <button
                      disabled={busy}
                      onClick={() => setRefresh((n) => n + 1)}
                    >
                      Refresh results
                    </button>
                    <p>
                      Scores are learner-reported browser practice results. Use
                      the submitted explanation to discuss understanding.
                    </p>
                    <div className="notebook-list">
                      {submissions.map((s) => (
                        <article
                          id={`submission-${s.id}`}
                          className="journey-anchor"
                          key={s.id}
                        >
                          <div>
                            <h3>{s.display_name}</h3>
                            <small>
                              {
                                assignments.find(
                                  (a) => a.id === s.assignment_id,
                                )?.title
                              }{" "}
                              · {s.language} ·{" "}
                              {s.score === null
                                ? "No practice score"
                                : `${s.score}/100`}
                            </small>
                            <p>{s.reflection}</p>
                            <TeacherFeedback submissionId={s.id} />
                            {s.code && (
                              <details>
                                <summary>View submitted draft</summary>
                                <pre className="submitted-code">{s.code}</pre>
                                {s.input && (
                                  <pre>{JSON.stringify(s.input, null, 2)}</pre>
                                )}
                              </details>
                            )}
                          </div>
                        </article>
                      ))}
                      {!submissions.length && (
                        <p>Students’ submissions will appear here.</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>
      <p role="status">{message}</p>
    </section>
  );
}
export function AssignmentPanel({
  problemId,
  language,
  code,
  input,
  inputError,
}: {
  problemId: string;
  language: string;
  code: string;
  input: Record<string, unknown>;
  inputError?: string;
}) {
  const { user } = useAccount(),
    [assignment, setAssignment] = useState<Assignment | null>(null),
    [reflection, setReflection] = useState(""),
    [displayName, setName] = useState(""),
    [source, setSource] = useState("editor"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setAssignment(null);
    setMessage("");
    const id = new URLSearchParams(location.search).get("assignment");
    if (!id) return;
    if (!cloud || !user) {
      setMessage("Sign in from Lessons & classes to view this assignment.");
      return;
    }
    let active = true;
    void result(
      cloud
        .from("assignments")
        .select("*")
        .eq("id", id)
        .eq("problem_id", problemId)
        .single(),
    )
      .then((a) => {
        if (active) setAssignment(a);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [user, problemId]);
  if (!assignment && !message) return null;
  return (
    <details className="product-card">
      <summary>
        Class assignment · {assignment?.title ?? "Sign in to view"}
      </summary>
      {assignment && (
        <>
          <p>{assignment.instructions}</p>
          <StudentFeedback assignmentId={assignment.id} />
          <button
            onClick={() => {
              const lesson: SharedLesson = {
                version: 1,
                problemId,
                title: assignment.title,
                instructions: assignment.instructions,
                input: assignment.input,
                language: assignment.language,
              };
              const url = new URL(lessonURL(lesson));
              url.searchParams.set("assignment", assignment.id);
              location.assign(url.href);
            }}
          >
            Load teacher example
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!cloud || !user) return;
              if (source === "editor" && inputError) {
                setMessage(inputError);
                return;
              }
              let submittedCode = code,
                submittedInput = input;
              if (source === "practice") {
                try {
                  const level =
                    localStorage.getItem(`trace:practice:level:${problemId}`) ??
                    "independent";
                  if (!levels.some((l) => l.id === level))
                    throw Error("Select a practice level first.");
                  const draft = JSON.parse(
                    localStorage.getItem(
                      `trace:practice:draft:${problemId}:${language}:${level}`,
                    ) ?? "null",
                  );
                  const example = practiceCases(problemById[problemId])[
                    draft?.caseIndex
                  ];
                  if (!draft || typeof draft.code !== "string" || !example)
                    throw Error(
                      "No saved practice draft for this language and level. Open Practice & improve first.",
                    );
                  submittedCode = draft.code;
                  submittedInput = example.input;
                } catch (err) {
                  setMessage(
                    err instanceof Error
                      ? err.message
                      : "Cannot read your practice draft.",
                  );
                  return;
                }
              }
              setBusy(true);
              let score: number | null = null;
              try {
                const attempts = JSON.parse(
                  localStorage.getItem(
                    `trace:practice:attempts:${problemId}`,
                  ) ?? "[]",
                );
                score = Array.isArray(attempts)
                  ? (attempts
                      .filter((a) => a.language === language && a.total > 1)
                      .at(-1)?.score ?? null)
                  : null;
              } catch {}
              void result(
                cloud.from("submissions").upsert(
                  {
                    assignment_id: assignment.id,
                    user_id: user.id,
                    display_name: displayName.trim(),
                    problem_id: problemId,
                    language,
                    score,
                    reflection,
                    code: submittedCode,
                    input: submittedInput,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "assignment_id,user_id" },
                ),
              )
                .then(() =>
                  setMessage("Your reflection was submitted to your teacher."),
                )
                .catch((e) => setMessage(e.message))
                .finally(() => setBusy(false));
            }}
          >
            <label>
              Include code from
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="editor">Learn & explore editor</option>
                <option value="practice">
                  Saved draft for my selected practice level
                </option>
              </select>
            </label>
            <label>
              Name shown to your teacher
              <input
                required
                maxLength={100}
                value={displayName}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Explain your approach and one thing you learned
              <textarea
                required
                minLength={20}
                maxLength={8000}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
            </label>
            <p>
              The selected draft and input will be included. A previous practice
              score, if available for this language, is learner-reported.
            </p>
            <button disabled={busy}>Submit reflection & draft</button>
          </form>
        </>
      )}
      <p role="status">{message}</p>
    </details>
  );
}
