import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { cloud, result } from "../product/cloud";
import { notebookSnapshot, restoreNotebook } from "../product/notebook";
import { readLocal } from "./storage";
type Backup = { data: Record<string, string>; updated_at: string };
type SyncMeta = { updatedAt: string; hash: string };
async function digest(data: Record<string, string>) {
  const text = JSON.stringify(
    Object.fromEntries(
      Object.entries(data).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(bytes)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
export function useNotebookSync(user: User | null) {
  const [enabled, setEnabled] = useState(false),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [conflict, setConflict] = useState<Backup | null>(null);
  const identity = useRef(""),
    baseline = useRef(""),
    stamp = useRef(""),
    uploading = useRef(false),
    generation = useRef(0);
  identity.current = user?.id ?? "";
  const persist = async (data: Record<string, string>, updatedAt: string) => {
    if (!user) return;
    const id = user.id,
      op = generation.current;
    const hash = await digest(data);
    if (identity.current !== id || generation.current !== op) return;
    localStorage.setItem(
      `trace:sync:${id}`,
      JSON.stringify({ updatedAt, hash }),
    );
  };
  async function choose(direction: "device" | "account") {
    if (!cloud || !user) return;
    const id = user.id,
      op = ++generation.current;
    const alive = () => identity.current === id && op === generation.current;
    setBusy(true);
    setStatus("Connecting notebook sync…");
    try {
      const remote = await result(
        cloud
          .from("notebooks")
          .select("data,updated_at")
          .eq("user_id", id)
          .maybeSingle(),
      );
      if (identity.current !== id || op !== generation.current) return;
      if (direction === "account") {
        if (!remote) throw Error("No account notebook has been saved yet.");
        const hash = await digest(remote.data);
        if (!alive()) return;
        baseline.current = hash;
        stamp.current = remote.updated_at;
        restoreNotebook(remote.data);
        await persist(remote.data, remote.updated_at);
      } else {
        const data = notebookSnapshot();
        const row = remote
          ? await result(
              cloud
                .from("notebooks")
                .update({ data })
                .eq("user_id", id)
                .eq("updated_at", remote.updated_at)
                .select("updated_at")
                .maybeSingle(),
            )
          : await result(
              cloud
                .from("notebooks")
                .insert({ user_id: id, data })
                .select("updated_at")
                .single(),
            );
        if (!row)
          throw Error(
            "The account notebook changed. Choose which version to use again.",
          );
        const hash = await digest(data);
        if (!alive()) return;
        baseline.current = hash;
        stamp.current = row.updated_at;
        await persist(data, row.updated_at);
      }
      if (identity.current !== id || op !== generation.current) return;
      setEnabled(true);
      setConflict(null);
      setStatus("Automatic notebook sync is on for this device.");
    } catch (e) {
      if (identity.current === id && op === generation.current)
        setStatus(e instanceof Error ? e.message : "Could not start sync.");
    } finally {
      if (identity.current === id && op === generation.current) setBusy(false);
    }
  }
  function stop() {
    generation.current++;
    setEnabled(false);
    setBusy(false);
    setConflict(null);
    if (user)
      try {
        localStorage.removeItem(`trace:sync:${user.id}`);
      } catch {}
    setStatus("Automatic sync is off. Manual backups remain available.");
  }
  useEffect(() => {
    setEnabled(false);
    setBusy(false);
    setConflict(null);
    setStatus("");
    generation.current++;
    if (!cloud || !user) return;
    const id = user.id,
      op = generation.current;
    let active = true;
    const alive = () =>
      active && identity.current === id && op === generation.current;
    const meta = readLocal<SyncMeta | null>(`trace:sync:${id}`, null);
    if (!meta) return;
    void (async () => {
      try {
        const remote = await result(
          cloud!
            .from("notebooks")
            .select("data,updated_at")
            .eq("user_id", id)
            .maybeSingle(),
        );
        if (!active || op !== generation.current || !remote) return;
        const data = notebookSnapshot(),
          hash = await digest(data);
        if (!alive()) return;
        if (remote.updated_at !== meta.updatedAt && hash !== meta.hash) {
          setConflict(remote);
          setStatus(
            "The account notebook and this device both changed. Choose a version before syncing.",
          );
          return;
        }
        stamp.current = remote.updated_at;
        if (remote.updated_at !== meta.updatedAt) {
          const remoteHash = await digest(remote.data);
          if (!alive()) return;
          if ((await digest(notebookSnapshot())) !== hash) {
            if (!alive()) return;
            setConflict(remote);
            setStatus(
              "This device changed while connecting. Choose a version before syncing.",
            );
            return;
          }
          if (!alive()) return;
          baseline.current = remoteHash;
          restoreNotebook(remote.data);
          await persist(remote.data, remote.updated_at);
        } else baseline.current = meta.hash;
        if (alive()) {
          setEnabled(true);
          setStatus("Automatic notebook sync resumed.");
        }
      } catch (e) {
        if (alive())
          setStatus(e instanceof Error ? e.message : "Sync could not resume.");
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);
  useEffect(() => {
    if (!enabled || !cloud || !user) return;
    const id = user.id,
      op = generation.current;
    let active = true,
      timer: ReturnType<typeof setTimeout> | undefined;
    const alive = () =>
      active && identity.current === id && op === generation.current;
    const conflictWith = async () => {
      const remote = await result(
        cloud!
          .from("notebooks")
          .select("data,updated_at")
          .eq("user_id", id)
          .maybeSingle(),
      );
      if (alive()) {
        setEnabled(false);
        setConflict(remote);
        setStatus(
          "This notebook changed on another device. Choose the version to keep.",
        );
      }
    };
    async function upload() {
      if (!alive() || uploading.current) return;
      const data = notebookSnapshot(),
        hash = await digest(data);
      if (hash === baseline.current || !alive()) return;
      uploading.current = true;
      setStatus("Saving notebook…");
      try {
        const row = await result(
          cloud!
            .from("notebooks")
            .update({ data })
            .eq("user_id", id)
            .eq("updated_at", stamp.current)
            .select("updated_at")
            .maybeSingle(),
        );
        if (!row) {
          await conflictWith();
          return;
        }
        if (alive()) {
          baseline.current = hash;
          stamp.current = row.updated_at;
          await persist(data, row.updated_at);
          if (alive()) setStatus("Notebook synced.");
        }
      } catch (e) {
        if (alive()) {
          setEnabled(false);
          setStatus(
            e instanceof Error
              ? e.message
              : "Sync failed. Your work remains saved on this browser.",
          );
        }
      } finally {
        uploading.current = false;
        const dirty =
          alive() && (await digest(notebookSnapshot())) !== baseline.current;
        if (alive() && dirty) timer = setTimeout(() => void upload(), 1200);
      }
    }
    const changed = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void upload(), 1200);
    };
    async function refresh() {
      if (!alive() || uploading.current || document.hidden) return;
      const previousStamp = stamp.current;
      try {
        const remote = await result(
          cloud!
            .from("notebooks")
            .select("data,updated_at")
            .eq("user_id", id)
            .maybeSingle(),
        );
        if (
          !remote ||
          !alive() ||
          uploading.current ||
          previousStamp !== stamp.current ||
          remote.updated_at === stamp.current
        )
          return;
        const localHash = await digest(notebookSnapshot());
        if (!alive() || uploading.current || previousStamp !== stamp.current)
          return;
        if (localHash !== baseline.current) {
          await conflictWith();
          return;
        }
        const remoteHash = await digest(remote.data);
        const latestHash = await digest(notebookSnapshot());
        if (!alive() || uploading.current || previousStamp !== stamp.current)
          return;
        if (localHash !== latestHash) {
          await conflictWith();
          return;
        }
        baseline.current = remoteHash;
        stamp.current = remote.updated_at;
        restoreNotebook(remote.data);
        await persist(remote.data, remote.updated_at);
        if (alive()) setStatus("Notebook updated from your account.");
      } catch (e) {
        if (alive())
          setStatus(
            e instanceof Error
              ? e.message
              : "Could not check the account notebook.",
          );
      }
    }
    window.addEventListener("trace:notebook", changed);
    const interval = setInterval(() => void refresh(), 30000);
    changed();
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("trace:notebook", changed);
    };
  }, [enabled, user?.id]);
  return { enabled, status, busy, conflict, choose, stop };
}
