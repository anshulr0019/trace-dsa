# Trace — DSA Learning Studio

The application lives in [`platform/`](platform/). See the [platform README](platform/README.md) for setup, features, and validation.

[Live demo](https://trace-six-theta.vercel.app/) · [Accounts and classes setup](platform/docs/TEACHER-SETUP.md) · [Teacher/startup demo material](platform/docs/DEMO-AND-PITCH.md)

[Interactive workspace guide](platform/docs/INTERACTIVE-WORKSPACE.md) · [LinkedIn launch draft](platform/docs/LINKEDIN-POST.md)

```sh
cd platform
npm install
npm run dev
```

## Computer science learning tracks

Open `/?view=cs` or choose **Computer science** in the sidebar. This area loads separately from the existing DSA workspace.

- **System Design:** five editable architecture labs for request routing, URL shorteners, chat, notifications, and feeds. Connect and position components, inject failures, change incoming traffic/cache hit rates, and replay a ten-second capacity/queue model.
- **Databases & SQL:** INNER/LEFT joins, a sorted-key index, atomic commit/rollback, and normalization/update anomalies.
- **Operating Systems:** FCFS/SJF/round-robin scheduling, FIFO/LRU page replacement, lock ordering, and synchronized counters.
- **Networks:** DNS caching/referrals, an HTTPS-over-TCP connection journey, and sequence-number/retry traces.
- **OOP & Design Patterns:** Strategy, Observer, and a simple notifier factory with illustrative Java contracts.
- **Interview Practice:** 18 prompts, a pausable timer, answer drafts, and self-review checklists.

All 19 guided labs include playback, parameter controls, explanations, invariants, experiment prompts, a quiz, notes, and a user-controlled reviewed flag. Deep links use `view=cs&topic=...&module=...`. Notes, scenarios, reviewed flags, and interview drafts use the browser-local `trace-computer-science-v1` key; they do not sync to an account. Interview timers stop when the page is left.

These are bounded educational simulations. The architecture model pools equal-role capacity along available routes, requires a complete destination route, and caps queue storage at 2,000 jobs; it is not a production performance estimator. The SQL area is a guided query builder, not a SQL server. Reference snippets are explanatory and are not compiled or executed. TCP uses one segment in flight and omits congestion/window management. No real infrastructure is provisioned or notification sent.

Focused model verification: from `platform`, run `node --import tsx --test tests/computer-science.test.ts`, `npx tsc --noEmit`, and `npm run build:vercel`.
