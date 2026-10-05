# Accounts, classrooms and owner access

The visual builders, recorded debugger, custom problem variants, code versions, revision calendar, failing-case inspector and local check matrix work without a backend. Accounts, automatic notebook sync, courses, written feedback, live classrooms, private site diagnostics and published teaching notes use Supabase.

## First setup or upgrade

1. Select your Supabase project. For a new application schema, run [`schema.sql`](../supabase/schema.sql) once. If these base tables already exist, keep them and proceed to the upgrade.
2. Run [`002-interactive-workspace.sql`](../supabase/002-interactive-workspace.sql) once. It adds features in a transaction without resetting existing user data. Keep row level security enabled.
3. Set the Authentication Site URL to `https://trace-six-theta.vercel.app`. Allow `https://trace-six-theta.vercel.app/?view=notebook*` for the fixed sign-in callback and its varying continuation query. The app checks the return target against its own origin and supported views. Add your own domain/local callback separately when needed. See [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).
4. Use the default email magic-link template for the browser's implicit flow. Configure an email delivery provider for a public pilot. See [passwordless sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless) and [SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp).
5. Set the public client variables in Vercel, then redeploy:

   ```text
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

   The publishable key belongs in the browser. Never put a secret/service-role key in a `VITE_` variable. For local development, fill `.env.local` from `.env.example` and restart Vite.
6. Sign in to Trace, then register **your account** as owner through Supabase's SQL editor:

   ```sql
   insert into public.app_admins(user_id)
   select id from auth.users where email = 'YOUR_EMAIL'
   on conflict do nothing;
   ```

   Replace the placeholder with the email you signed in with. Owner access comes from this protected database row. Editing browser storage or a URL does not grant it.

The migration enables Realtime publication for classroom state, polls, responses and enrollment. See [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes). The UI also refreshes classroom state periodically if events are interrupted.

## Teacher workflow

- Create a custom lesson link in **Lessons & classes**. Inputs and source run only when the recipient presses Play.
- Create a class and share its invite code. Select it to assign individual lessons, view submissions, remove enrollment or archive/reopen the class.
- Build a reusable course with ordered problems, editable prompts, inputs and language choices. Assign new course lessons to a class. Previously assigned tasks retain their copied input and instructions.
- Review submitted code and reflections, then save written feedback with Reviewed, Needs revision or Understood status. Students can refresh feedback from the assignment panel.

Browser practice scores remain learner-reported educational feedback. They can originate from earlier practice and are not authoritative exam grades.

## Live classroom

- Open **Live classroom**, create a session and give students the invite link/code. Students sign in and join with a display name.
- The host chooses a problem/language, edits the source/input, and presses **Run & share**. Students receive the actual captured execution, without executing the teacher's source on their own device.
- Play, pause, seek and speed changes update small session records. Each student follows the same saved run. Students can switch to their own pace and return to teacher playback.
- The host can reveal the return value early, ask prediction questions, view response counts, close questions, and end/reopen the session.
- Captures are bounded to 1,199 states and approximately 2.5 MB. Oversized results/states are rejected; omitted later states are labelled. Ending prevents new joins and votes while preserving the recorded session for existing participants.

Classroom access and host controls use authenticated database policies. Questions support live discussion; their responses are not exam grading.

## Notebook sync and backups

Your browser saves notes, bookmarks, understanding marks, editor/practice drafts, custom variants, code versions, mistake journals and revision dates.

Use **Automatic notebook sync** to choose the initial device or account version. Sync saves changes after a short delay and checks for remote changes periodically. It uses the previously seen account timestamp to avoid overwriting a concurrent update. If both versions changed, it pauses for your choice. Export a backup before choosing if you want to preserve both. An active editor reloads restored drafts.

Manual account backup/restore and JSON export/import remain available. Account notebook data is limited to 4 MB; backups may contain private code and notes. Local run reports and owner checks are exported separately and do not enter notebook sync.

## Owner workspace

Without cloud configuration, **Workspace checks** holds a matrix and logs on the current browser only. With configuration, the owner role gates private diagnostics, shared quality checks and publishing.

- Execution checks run the five authored examples for each selected problem/language. Animation, alignment, explanation and mobile checks are manually recorded with dates and evidence.
- Website workflow checks cover navigation, sharing, sign-in, sync, enrollment, courses, feedback, live playback and polls. Preview screens use sample content; they do not validate access permissions.
- Local run reports contain source/input, status and latency including runtime loading/compilation. An account can opt into sharing timing/status metadata; those reports omit source/input.
- The lesson editor publishes additional teaching explanations and records their history. Existing algorithm references and complexity annotations remain separately labelled.

Actual sign-in, policies, cross-device conflicts and teacher/student classroom behavior require a configured project and acceptance testing. The project owner is handling that testing.

Java uses CheerpJ. Its current Community License includes qualifying individuals/one-person companies, including revenue-generating projects with appropriate credits. Company, redistribution and OEM arrangements may need other terms. Check the intended arrangement against [the official licence](https://cheerpj.com/docs/licensing.html).
