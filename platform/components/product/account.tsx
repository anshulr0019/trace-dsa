"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { cloud, result } from "@/lib/product/cloud";
import { notebookSnapshot, restoreNotebook } from "@/lib/product/notebook";
import { useNotebookSync } from "@/lib/lab/notebook-sync";
import { signInReturn, safeReturnPath } from "@/lib/lab/auth-return";
const Context = createContext<{
  user: User | null;
  ready: boolean;
  sync: ReturnType<typeof useNotebookSync> | null;
}>({
  user: null,
  ready: false,
  sync: null,
});
export const useAccount = () => useContext(Context);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(!cloud);
  useEffect(() => {
    if (!cloud) return;
    void cloud.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
      if (data.session) {
        const next = safeReturnPath(location.search, location.origin);
        if (next && next !== location.pathname + location.search)
          location.replace(next);
      }
    });
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session) {
        const next = safeReturnPath(location.search, location.origin);
        if (next && next !== location.pathname + location.search)
          location.replace(next);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const sync = useNotebookSync(user);
  return (
    <Context.Provider value={{ user, ready, sync }}>
      {children}
    </Context.Provider>
  );
}
export function AccountPanel() {
  const { user, sync } = useAccount(),
    [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [restore, setRestore] = useState<Record<string, string> | null>(null),
    [shareHealth, setShareHealth] = useState(false);
  useEffect(() => {
    try {
      setShareHealth(
        localStorage.getItem(`trace:health:optin:${user?.id}`) === "on",
      );
    } catch {}
    setRestore(null);
  }, [user?.id]);
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
  if (!cloud)
    return (
      <section className="product-card">
        <h2>Your account</h2>
        <p>
          Cloud accounts are awaiting setup. Your notebook and drafts are saved
          on this browser. You can export a backup below.
        </p>
      </section>
    );
  return (
    <section className="product-card">
      <h2>{user ? "Your account" : "Save your learning across devices"}</h2>
      {user ? (
        <>
          <p>Signed in as {user.email}</p>
          <details>
            <summary>Automatic notebook sync</summary>
            <p>
              Choose the initial version for this device. Sync covers notes,
              drafts, custom problems, versions and revision dates. Conflicting
              changes pause sync for your choice.
            </p>
            {sync?.enabled ? (
              <button onClick={() => sync.stop()}>
                Turn automatic sync off
              </button>
            ) : (
              <div className="product-actions">
                <button
                  disabled={sync?.busy}
                  onClick={() => void sync?.choose("device")}
                >
                  Use this device’s notebook & start sync
                </button>
                <button
                  disabled={sync?.busy}
                  onClick={() => void sync?.choose("account")}
                >
                  Use account notebook & start sync
                </button>
              </div>
            )}
            {sync?.conflict && (
              <p className="workspace-pending">
                Conflicting account version from{" "}
                {new Date(sync.conflict.updated_at).toLocaleString()}. Choosing
                a version replaces matching saved work. Export a backup first if
                you want to keep both.
              </p>
            )}
            <p role="status">{sync?.status}</p>
          </details>
          <label>
            <input
              type="checkbox"
              checked={shareHealth}
              onChange={(e) => {
                setShareHealth(e.target.checked);
                try {
                  localStorage.setItem(
                    `trace:health:optin:${user.id}`,
                    e.target.checked ? "on" : "off",
                  );
                } catch {}
              }}
            />{" "}
            Share run timing and status with Trace’s owner to help improve the
            runtime.
          </label>
          <div className="product-actions">
            <button
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  sync?.stop();
                  await result(
                    cloud!.from("notebooks").upsert({
                      user_id: user.id,
                      data: notebookSnapshot(),
                      updated_at: new Date().toISOString(),
                    }),
                  );
                  setMessage(
                    "Notebook saved to your account. Restore it on another device to continue.",
                  );
                })
              }
            >
              Save notebook to account
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  const row = await result(
                    cloud!
                      .from("notebooks")
                      .select("data,updated_at")
                      .eq("user_id", user.id)
                      .maybeSingle(),
                  );
                  if (!row) throw Error("No account backup yet.");
                  setRestore(row.data);
                  setMessage(
                    `Backup found from ${new Date(row.updated_at).toLocaleString()}. Restore replaces matching local notes and drafts.`,
                  );
                })
              }
            >
              Restore from account
            </button>
            <button
              onClick={() =>
                void action(async () => {
                  const { error } = await cloud!.auth.signOut();
                  if (error) throw error;
                  setMessage("Signed out. Local drafts remain on this device.");
                })
              }
            >
              Sign out
            </button>
          </div>
          {restore && (
            <button
              disabled={busy}
              onClick={() => {
                void action(async () => {
                  sync?.stop();
                  restoreNotebook(restore);
                  setRestore(null);
                  setMessage(
                    "Restored. Reopen a problem to load its saved draft.",
                  );
                });
              }}
            >
              Confirm restore
            </button>
          )}
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action(async () => {
              const { error } = await cloud!.auth.signInWithOtp({
                email,
                options: {
                  emailRedirectTo: signInReturn(
                    location.origin,
                    location.pathname + location.search,
                  ),
                },
              });
              if (error) throw error;
              setMessage("Check your email for the sign-in link.");
            });
          }}
        >
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button disabled={busy}>
            {busy ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
