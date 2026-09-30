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
const Context = createContext<{ user: User | null; ready: boolean }>({
  user: null,
  ready: false,
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
    });
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <Context.Provider value={{ user, ready }}>{children}</Context.Provider>
  );
}
export function AccountPanel() {
  const { user } = useAccount(),
    [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [restore, setRestore] = useState<Record<string, string> | null>(null);
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
          <div className="product-actions">
            <button
              disabled={busy}
              onClick={() =>
                void action(async () => {
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
                  emailRedirectTo: `${location.origin}/?view=notebook`,
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
