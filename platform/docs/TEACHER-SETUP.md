# Accounts and classes setup

Trace's public examples, lesson links, predictions, presentation mode and local notebook work without a backend. Email sign-in, account notebook backups, classes, assignments and student submissions use Supabase. These cloud features remain visibly unavailable until configuration is supplied.

## Connect Supabase

1. Create a Supabase project, or select an existing project with an empty application schema. The schema below is a **first-install migration**, not a reset script.
2. Run [`supabase/schema.sql`](../supabase/schema.sql) in the SQL editor. It creates tables, indexes, row access policies and a class invitation function in one transaction. Keep row level security enabled.
3. In Authentication → URL Configuration, set the Site URL to `https://trace-six-theta.vercel.app` and allow `https://trace-six-theta.vercel.app/?view=notebook`. Add your own domain and local development redirect separately if used.
4. Keep the default email magic-link template for this browser application. Configure an email delivery provider for a public pilot; Supabase's default email service has delivery restrictions. See [passwordless sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless) and [SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp).
5. Add these variables in Vercel → Project → Settings → Environment Variables:

   ```text
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

   Use the project URL and **publishable** client key. Never put a secret or service-role key in a `VITE_` variable. The browser receives these variables; database access is enforced by the SQL policies.
6. Redeploy after changing environment variables. For local development, copy `.env.example` to `.env.local`, fill in the public values and restart the Vite server.

## Teacher workflow

- Open **Lessons & classes**, choose a problem, language, input and question, then create a lesson link. Links work without sign-in and run only after the recipient presses Play.
- Sign in, create a class and give students the invite code. Anyone with that code can enroll. Share it only with the intended class.
- Select the class, optionally set a due date, and assign the lesson. Due dates are displayed; they do not prohibit late submissions.
- Students sign in, join the class, open the assignment, load the teacher's input, practice, and submit a reflection. They can include the Learn & explore editor or the saved draft for their selected practice level.
- The teacher can refresh results to see enrollment, submissions, explanations and submitted code. Students see their own submissions; teachers see submissions for classes they own.

Assignment scores are **learner-reported** browser practice scores for the selected language. They are not tamper-resistant exam grades and may come from earlier practice. Use explanations and code for discussion. Competitive ranking and high-stakes grading would require authoritative judging on a separate execution service.

## Notebook behavior

Notes, bookmarks, revision lists, understanding marks, editor drafts and practice history are saved on the current browser. **Save notebook to account** uploads a snapshot; **Restore from account** offers confirmation before replacing matching local entries. This is explicit cross-device backup/restore, not background synchronization or automatic conflict resolution.

JSON export/import provides the same workflow without an account. Backups contain code and notes; keep them private. A shared example link contains the chosen input, code and instructions in its URL fragment. Anyone receiving it can read those contents.

## Pilot readiness

The UI and migration are implemented, but actual authentication and database behavior require a configured project and teacher/student acceptance testing. The project owner is handling testing. Follow your organization's requirements for student consent, retention and deletion before a class pilot.

Java runs with CheerpJ. A business deployment needs an appropriate licence under [CheerpJ's terms](https://cheerpj.com/docs/licensing.html); do not market the current Java runtime as universally free for commercial use.
