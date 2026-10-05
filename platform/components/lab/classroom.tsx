"use client";
import { useEffect, useRef, useState } from "react";
import { problems, problemById } from "@/lib/curriculum/catalog";
import type { Language } from "@/lib/curriculum/playground";
import { referenceCode } from "@/lib/practice/evaluate";
import { validateProblemInput } from "@/lib/curriculum/validate";
import {
  executeSubmission,
  runtimeCapabilities,
} from "@/lib/curriculum/runtime-client";
import {
  shareableRun,
  validLiveRun,
  roomStep,
  type LiveRoom,
  type LiveRun,
  type LivePoll,
} from "@/lib/lab/classroom";
import { cloud, result } from "@/lib/product/cloud";
import { AccountPanel, useAccount } from "../product/account";
import { InputBuilder } from "./input-builder";
import { Editor } from "../curriculum/editor";
import { Scene, display } from "../curriculum/scene";
import { useFramePlayback } from "../curriculum/use-frame-playback";
export function Classroom() {
  const { user, ready } = useAccount(),
    [roomId, setRoom] = useState(""),
    [rooms, setRooms] = useState<LiveRoom[]>([]),
    [name, setName] = useState(""),
    [title, setTitle] = useState("Live DSA lesson"),
    [invite, setInvite] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setRoom(query.get("room") ?? "");
    setInvite(query.get("invite") ?? "");
  }, []);
  useEffect(() => {
    setRooms([]);
    if (!cloud || !user) return;
    let active = true;
    void result(
      cloud
        .from("live_sessions")
        .select("*")
        .order("created_at", { ascending: false }),
    )
      .then((rows) => {
        if (active) setRooms(rows ?? []);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [user, roomId]);
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
  function enter(id: string) {
    setRoom(id);
    history.replaceState(
      null,
      "",
      `?view=classroom&room=${encodeURIComponent(id)}`,
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  if (roomId && user && cloud)
    return (
      <LiveBoard
        id={roomId}
        onBack={() => {
          setRoom("");
          history.replaceState(null, "", "?view=classroom");
        }}
      />
    );
  return (
    <section className="product-page">
      <div className="eyebrow mint">TEACH TOGETHER</div>
      <h1>Live classroom</h1>
      <p>
        Share a recorded run, control its playback, and ask students to predict
        the next decision. Students see the teacher’s actual captured states.
      </p>
      <AccountPanel />
      {!ready ? (
        <p>Loading your account…</p>
      ) : user && cloud ? (
        <>
          <div className="lab-columns">
            <section className="product-card">
              <h2>Host a session</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    const row = await result(
                      cloud!
                        .from("live_sessions")
                        .insert({ host_id: user.id, title: title.trim() })
                        .select("*")
                        .single(),
                    );
                    if (!row) throw Error("Session could not be created.");
                    enter(row.id);
                  });
                }}
              >
                <label>
                  Session title
                  <input
                    required
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <button disabled={busy}>Create live session</button>
              </form>
            </section>
            <section className="product-card">
              <h2>Join your teacher</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    const id = await result(
                      cloud!.rpc("join_trace_live", {
                        code: invite.trim(),
                        display_name: name.trim(),
                      }),
                    );
                    if (typeof id !== "string")
                      throw Error("Session could not be joined.");
                    enter(id);
                  });
                }}
              >
                <label>
                  Name shown to your teacher
                  <input
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  Session code
                  <input
                    required
                    value={invite}
                    onChange={(e) => setInvite(e.target.value)}
                  />
                </label>
                <button disabled={busy}>Join live session</button>
              </form>
            </section>
          </div>
          <section className="product-card">
            <h2>Your sessions</h2>
            {rooms.map((r) => (
              <article className="saved-item" key={r.id}>
                <strong>{r.title}</strong>
                <small>
                  {r.ended
                    ? "Ended · saved run available"
                    : r.host_id === user.id
                      ? "You are the host"
                      : "Joined session"}
                </small>
                <button onClick={() => enter(r.id)}>Open session</button>
              </article>
            ))}
            {!rooms.length && <p>Create or join your first session.</p>}
          </section>
        </>
      ) : (
        <p>
          Live sessions need the account connection and classroom migration.
          Sign in once setup is complete.
        </p>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
function LiveBoard({ id, onBack }: { id: string; onBack: () => void }) {
  const { user } = useAccount(),
    [room, setRoom] = useState<LiveRoom | null>(null),
    [run, setRun] = useState<LiveRun | null>(null),
    [problemId, setProblem] = useState(problems[0].id),
    [language, setLanguage] = useState<Language>("java"),
    [code, setCode] = useState(referenceCode(problems[0].id, "java")),
    [input, setInput] = useState(JSON.stringify(problems[0].input, null, 2)),
    [message, setMessage] = useState(""),
    [running, setRunning] = useState(false),
    [controlBusy, setControlBusy] = useState(false),
    [follow, setFollow] = useState(true),
    [connection, setConnection] = useState("Connecting…"),
    [polls, setPolls] = useState<LivePoll[]>([]),
    [answers, setAnswers] = useState<
      { poll_id: string; user_id: string; choice: number }[]
    >([]),
    [members, setMembers] = useState<
      { user_id: string; display_name: string }[]
    >([]),
    [question, setQuestion] = useState(""),
    [options, setOptions] = useState("Move left\nMove right"),
    [pollBusy, setPollBusy] = useState(false);
  const controller = useRef<AbortController | null>(null),
    inFlight = useRef(false),
    controlLock = useRef(false),
    roomRef = useRef(room),
    stepRef = useRef(0),
    active = useRef(true),
    syncPending = useRef(false),
    hydrated = useRef(false);
  roomRef.current = room;
  const host = !!room && room.host_id === user?.id;
  const { step, setStep, playing, setPlaying } = useFramePlayback(
    run?.run.frames.length ?? 0,
    Number(room?.speed ?? 1),
  );
  stepRef.current = step;
  useEffect(() => {
    active.current = true;
    let alive = true;
    const refresh = async () => {
      try {
        const row = await result(
          cloud!.from("live_sessions").select("*").eq("id", id).single(),
        );
        if (alive) setRoom(row);
      } catch (e) {
        if (alive)
          setMessage(
            e instanceof Error
              ? e.message
              : "Session unavailable. Join using the session code first.",
          );
      }
    };
    void refresh();
    const channel = cloud!
      .channel(`trace-room-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (alive) setRoom(payload.new as LiveRoom);
        },
      )
      .subscribe((status) => {
        if (alive)
          setConnection(
            status === "SUBSCRIBED"
              ? "Live connection"
              : status === "CHANNEL_ERROR" || status === "TIMED_OUT"
                ? "Connection interrupted · retrying"
                : "Connecting…",
          );
      });
    const fallback = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 10000);
    return () => {
      alive = false;
      active.current = false;
      clearInterval(fallback);
      void cloud!.removeChannel(channel);
      controller.current?.abort();
    };
  }, [id]);
  useEffect(() => {
    if (!room?.run_id) {
      setRun(null);
      return;
    }
    if (run?.id === room.run_id) return;
    setPlaying(false);
    let alive = true;
    void result(
      cloud!.from("live_runs").select("*").eq("id", room.run_id).single(),
    )
      .then((record) => {
        if (!validLiveRun(record as LiveRun))
          throw Error(
            "This classroom capture cannot be displayed. Ask the host to share a new run.",
          );
        if (alive) {
          setRun(record as LiveRun);
          syncPending.current = true;
          if (!hydrated.current && room.host_id === user?.id) {
            hydrated.current = true;
            setProblem(record.problem_id);
            setLanguage(record.language);
            setCode(record.code);
            setInput(JSON.stringify(record.input, null, 2));
          }
        }
      })
      .catch((e) => {
        if (alive) setMessage(e.message);
      });
    return () => {
      alive = false;
    };
  }, [room?.run_id]);
  useEffect(() => {
    if (!room || !run || run.id !== room.run_id) return;
    if (host) {
      if (syncPending.current) {
        setStep(room.step);
        syncPending.current = false;
      }
      setPlaying(room.playing && !room.ended);
    } else if (follow) {
      setStep(roomStep(room, run.run.frames.length));
      setPlaying(room.playing && !room.ended);
    }
  }, [room?.updated_at, run, follow, host, setStep, setPlaying]);
  useEffect(() => {
    if (!host || !room) return;
    const paused = () => {
      if (document.hidden && roomRef.current?.playing)
        void updateControl({ step: stepRef.current, playing: false });
    };
    window.addEventListener("visibilitychange", paused);
    return () => window.removeEventListener("visibilitychange", paused);
  }, [host, room?.id]);
  useEffect(() => {
    if (host || !follow || !room || !run || run.id !== room.run_id) return;
    const timer = setInterval(() => {
      if (!document.hidden) {
        setStep(roomStep(room, run.run.frames.length));
        setPlaying(room.playing && !room.ended);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [host, follow, room, run, setStep, setPlaying]);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const p =
          (await result(
            cloud!
              .from("live_polls")
              .select("*")
              .eq("session_id", id)
              .order("created_at", { ascending: false }),
          )) ?? [];
        const a = p.length
          ? ((await result(
              cloud!
                .from("live_answers")
                .select("poll_id,user_id,choice")
                .in(
                  "poll_id",
                  p.map((x) => x.id),
                ),
            )) ?? [])
          : [];
        const m =
          (await result(
            cloud!
              .from("live_members")
              .select("user_id,display_name")
              .eq("session_id", id),
          )) ?? [];
        if (alive) {
          setPolls(
            p.filter(
              (v) =>
                Array.isArray(v.options) &&
                v.options.length >= 2 &&
                v.options.length <= 5 &&
                v.options.every((o: unknown) => typeof o === "string"),
            ),
          );
          setAnswers(a);
          setMembers(m);
        }
      } catch (e) {
        if (alive)
          setMessage(
            e instanceof Error ? e.message : "Could not load responses.",
          );
      }
    };
    void refresh();
    const channel = cloud!
      .channel(`trace-polls-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_polls",
          filter: `session_id=eq.${id}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_answers" },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_members",
          filter: `session_id=eq.${id}`,
        },
        () => void refresh(),
      )
      .subscribe();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
      void cloud!.removeChannel(channel);
    };
  }, [id]);
  async function updateControl(patch: Partial<LiveRoom>) {
    if (!host || !room || controlLock.current) return;
    controlLock.current = true;
    setControlBusy(true);
    try {
      const row = await result(
        cloud!
          .from("live_sessions")
          .update(patch)
          .eq("id", id)
          .select("*")
          .single(),
      );
      if (active.current) {
        setRoom(row);
        if (patch.step !== undefined) setStep(patch.step);
      }
    } catch (e) {
      if (active.current)
        setMessage(
          e instanceof Error ? e.message : "Playback could not be shared.",
        );
    } finally {
      controlLock.current = false;
      if (active.current) setControlBusy(false);
    }
  }
  async function capture() {
    if (!host || inFlight.current || room?.ended) return;
    inFlight.current = true;
    controller.current = new AbortController();
    setRunning(true);
    setPlaying(false);
    setMessage("Running the teacher’s code…");
    try {
      const data = JSON.parse(input),
        invalid = validateProblemInput(problemId, data);
      if (invalid) throw Error(invalid);
      const runtime = await runtimeCapabilities(controller.current.signal);
      const value = await executeSubmission(
        { problemId, language, code, input: data, automatic: true },
        runtime,
        controller.current.signal,
      );
      controller.current.signal.throwIfAborted();
      const share = shareableRun(value);
      const row = await result(
        cloud!
          .from("live_runs")
          .insert({
            session_id: id,
            problem_id: problemId,
            language,
            code,
            input: data,
            run: share,
          })
          .select("*")
          .single(),
      );
      if (!row) throw Error("The capture could not be saved.");
      const updated = await result(
        cloud!
          .from("live_sessions")
          .update({
            run_id: row.id,
            step: 0,
            playing: false,
            reveal_result: false,
          })
          .eq("id", id)
          .select("*")
          .single(),
      );
      if (active.current) {
        setRun(row as LiveRun);
        hydrated.current = true;
        syncPending.current = true;
        setRoom(updated);
        setMessage(
          share.truncated
            ? "Shared a bounded capture. Some later states are omitted."
            : "Actual execution shared. Students can follow your playback.",
        );
      }
    } catch (e) {
      if (active.current)
        setMessage(
          controller.current.signal.aborted
            ? "Run cancelled."
            : e instanceof Error
              ? e.message
              : "Run could not be shared.",
        );
    } finally {
      inFlight.current = false;
      if (active.current) setRunning(false);
    }
  }
  const displayProblem = run
      ? problemById[run.problem_id]
      : problemById[problemId],
    frame = run?.run.frames[step];
  let preview = problemById[problemId].input;
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      preview = parsed;
  } catch {}
  const draftChanged =
    host &&
    !!run &&
    (run.problem_id !== problemId ||
      run.language !== language ||
      run.code !== code ||
      JSON.stringify(run.input) !== JSON.stringify(preview));
  if (!room)
    return (
      <section className="product-page">
        <button onClick={onBack}>Back to live sessions</button>
        <p>{message || "Loading session…"}</p>
      </section>
    );
  return (
    <section className="product-page live-classroom">
      <button className="text-action" onClick={onBack}>
        ← All live sessions
      </button>
      <h1>{room.title}</h1>
      <p>
        {connection} ·{" "}
        {host
          ? "You control the session"
          : follow
            ? "Following teacher playback"
            : "Exploring the captured run"}
        {room.ended ? " · Session ended" : ""}
      </p>
      {host ? (
        <div className="product-card">
          <p>
            Session code: <code>{room.join_code}</code> · {members.length}{" "}
            students joined
          </p>
          <button
            onClick={() =>
              void navigator.clipboard
                .writeText(
                  `${location.origin}/?view=classroom&invite=${room.join_code}`,
                )
                .then(() => setMessage("Session invite copied."))
                .catch(() =>
                  setMessage(`Share this session code: ${room.join_code}`),
                )
            }
          >
            Copy invite link
          </button>
          <details>
            <summary>Prepare the next example</summary>
            <div className="product-form-grid">
              <label>
                Problem
                <select
                  value={problemId}
                  disabled={running}
                  onChange={(e) => {
                    setProblem(e.target.value);
                    setInput(
                      JSON.stringify(
                        problemById[e.target.value].input,
                        null,
                        2,
                      ),
                    );
                    setCode(referenceCode(e.target.value, language));
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
                  disabled={running}
                  onChange={(e) => {
                    const next = e.target.value as Language;
                    setLanguage(next);
                    setCode(referenceCode(problemId, next));
                  }}
                >
                  {["java", "cpp", "python", "javascript"].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
            </div>
            <InputBuilder
              problem={problemById[problemId]}
              input={preview}
              disabled={running}
              onApply={(v) => setInput(JSON.stringify(v, null, 2))}
            />
            <label>
              Input JSON
              <textarea
                value={input}
                disabled={running}
                onChange={(e) => setInput(e.target.value)}
              />
            </label>
            <div className="product-actions">
              <button
                disabled={running || room.ended}
                onClick={() => void capture()}
              >
                Run & share this example
              </button>
              {running && (
                <button onClick={() => controller.current?.abort()}>
                  Cancel run
                </button>
              )}
            </div>
          </details>
        </div>
      ) : (
        <div className="product-actions">
          <button
            onClick={() => {
              setFollow((v) => !v);
              setPlaying(false);
            }}
          >
            {follow ? "Explore at my own pace" : "Follow the teacher"}
          </button>
        </div>
      )}
      {draftChanged && (
        <p className="workspace-pending">
          Your edited example has not been shared. Run & share to update the
          classroom capture.
        </p>
      )}
      <div className="classroom-workbench">
        <section className="product-card">
          <h2>{run ? displayProblem.title : "Waiting for an example"}</h2>
          {!run && <p>The teacher will share a captured run here.</p>}
          <Scene
            problem={displayProblem}
            input={run?.input ?? preview}
            frame={frame}
            previous={run?.run.frames[step - 1]}
            language={run?.language ?? language}
            speed={Number(room.speed)}
          />
          {run && (
            <>
              <p>
                State {step + 1} / {run.run.frames.length}
                {(host ||
                  room.reveal_result ||
                  frame?.event === "complete") && (
                  <>
                    {" "}
                    · Return value preview:{" "}
                    <code>{display(run.run.result).slice(0, 2000)}</code>
                  </>
                )}
              </p>
              {run.run.error &&
                (host || room.reveal_result || frame?.event === "error") && (
                  <p className="check-fail">{run.run.error}</p>
                )}
              {run.run.truncated && (
                <p className="workspace-pending">
                  This classroom capture is limited to the shared states.
                </p>
              )}
            </>
          )}
        </section>
        <section className="product-card classroom-code">
          <h2>
            {host ? "Teacher source" : "Shared source"} ·{" "}
            {host ? language : run?.language}
          </h2>
          <Editor
            value={host ? code : (run?.code ?? "")}
            language={host ? language : (run?.language ?? "java")}
            line={draftChanged ? 0 : (frame?.line ?? 0)}
            readOnly={!host || running}
            onChange={setCode}
            onRun={() => {
              if (host) void capture();
            }}
          />
        </section>
      </div>
      <div className="product-card">
        <div className="product-actions">
          <button
            disabled={
              !run || controlBusy || (room.ended && host) || (!host && follow)
            }
            onClick={() => {
              if (host)
                void updateControl({
                  step: step === run!.run.frames.length - 1 ? 0 : step,
                  playing:
                    step === run!.run.frames.length - 1 ? true : !playing,
                });
              else {
                if (step === run!.run.frames.length - 1) setStep(0);
                setPlaying(!playing);
              }
            }}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            disabled={!run || step === 0 || controlBusy || (!host && follow)}
            onClick={() => {
              if (host) void updateControl({ step: step - 1, playing: false });
              else {
                setPlaying(false);
                setStep(step - 1);
              }
            }}
          >
            Previous state
          </button>
          <button
            disabled={
              !run ||
              step === run.run.frames.length - 1 ||
              controlBusy ||
              (!host && follow)
            }
            onClick={() => {
              if (host) void updateControl({ step: step + 1, playing: false });
              else {
                setPlaying(false);
                setStep(step + 1);
              }
            }}
          >
            Next state
          </button>
          {host && (
            <label>
              Speed
              <select
                value={room.speed}
                disabled={controlBusy}
                onChange={(e) =>
                  void updateControl({
                    step,
                    playing: room.playing,
                    speed: Number(e.target.value),
                  })
                }
              >
                {[0.5, 1, 2, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <input
          aria-label="Classroom execution step"
          type="range"
          min={0}
          max={Math.max(0, (run?.run.frames.length ?? 0) - 1)}
          value={step}
          disabled={!run || controlBusy || (!host && follow)}
          onChange={(e) => {
            const target = Number(e.target.value);
            if (host) void updateControl({ step: target, playing: false });
            else {
              setPlaying(false);
              setStep(target);
            }
          }}
        />
      </div>
      {host && (
        <section className="product-card">
          <h2>Ask a prediction question</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const choices = options
                .split("\n")
                .map((v) => v.trim())
                .filter(Boolean);
              if (
                choices.length < 2 ||
                choices.length > 5 ||
                choices.some((v) => v.length > 120)
              ) {
                setMessage(
                  "Use two to five options of at most 120 characters each.",
                );
                return;
              }
              setPollBusy(true);
              void result(
                cloud!.from("live_polls").insert({
                  session_id: id,
                  question: question.trim(),
                  options: choices,
                }),
              )
                .then(() => {
                  setQuestion("");
                  setMessage("Prediction question shared.");
                })
                .catch((e) => setMessage(e.message))
                .finally(() => setPollBusy(false));
            }}
          >
            <label>
              Question
              <input
                required
                maxLength={400}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </label>
            <label>
              Answer options, one per line
              <textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
              />
            </label>
            <button disabled={pollBusy || room.ended}>Ask the class</button>
          </form>
        </section>
      )}
      {polls.map((p) => (
        <section className="product-card" key={p.id}>
          <h2>{p.question}</h2>
          <small>
            {p.active && !room.ended
              ? "Accepting responses"
              : "Responses closed"}
          </small>
          {host ? (
            <>
              <div className="poll-results">
                {p.options.map((option, i) => (
                  <div key={i}>
                    <span>{option}</span>
                    <strong>
                      {
                        answers.filter(
                          (a) => a.poll_id === p.id && a.choice === i,
                        ).length
                      }{" "}
                      responses
                    </strong>
                  </div>
                ))}
              </div>
              <p>
                {answers.filter((a) => a.poll_id === p.id).length} /{" "}
                {members.length} students responded
              </p>
              {p.active && (
                <button
                  onClick={() =>
                    void result(
                      cloud!
                        .from("live_polls")
                        .update({ active: false })
                        .eq("id", p.id),
                    ).catch((e) => setMessage(e.message))
                  }
                >
                  Close question
                </button>
              )}
            </>
          ) : (
            <div className="product-actions">
              {p.options.map((option, i) => (
                <button
                  key={i}
                  disabled={!p.active || room.ended}
                  aria-pressed={answers.some(
                    (a) =>
                      a.poll_id === p.id &&
                      a.user_id === user!.id &&
                      a.choice === i,
                  )}
                  onClick={() =>
                    void result(
                      cloud!.from("live_answers").upsert({
                        poll_id: p.id,
                        user_id: user!.id,
                        choice: i,
                      }),
                    )
                      .then(() => {
                        setAnswers((v) => [
                          ...v.filter(
                            (a) => a.poll_id !== p.id || a.user_id !== user!.id,
                          ),
                          { poll_id: p.id, user_id: user!.id, choice: i },
                        ]);
                        setMessage("Your prediction was sent to the teacher.");
                      })
                      .catch((e) => setMessage(e.message))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </section>
      ))}
      {host && (
        <section className="product-card">
          <div className="product-actions">
            <button
              disabled={controlBusy}
              onClick={() =>
                void updateControl({
                  step,
                  playing: room.playing,
                  reveal_result: !room.reveal_result,
                })
              }
            >
              {room.reveal_result
                ? "Hide early result"
                : "Reveal result to students"}
            </button>
          </div>
          <h2>Session students</h2>
          {members.map((m) => (
            <p key={m.user_id}>{m.display_name}</p>
          ))}
          <button
            disabled={controlBusy}
            onClick={() =>
              void updateControl({ step, playing: false, ended: !room.ended })
            }
          >
            {room.ended ? "Reopen session" : "End session"}
          </button>
          <p>
            Ending closes new joins. Existing participants retain access to the
            captured run.
          </p>
        </section>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
