# Trace launch improvements

This release adds a five-stage lesson navigation, a public interactive introduction, six hands-on concept exercises, learning evidence and revision suggestions, executable SQLite tasks, model experiments inside track projects, runtime preparation/recovery controls, and a class progress matrix with CSV export.

Backups now cover lesson answers, capstone notes, solving plans, foundation drafts and inputs, the CS workspace, SQL drafts, and learning evidence. Existing account sync uses the same backup schema. Restoring remounts workspace readers and loads restored foundation drafts without executing them.

Learning evidence records actual practice success and the presence of hints/review support. Watching and self-review are labeled separately. Browser-reported practice results and teacher CSV scores are not independently verified exam grades. SQL tasks validate rows on a small fixed dataset. Model experiments retain their stated teaching assumptions.

## Verification

- TypeScript and Vercel production build.
- Backup round-trip, invalid backup atomicity, evidence/revision behavior, SQL query outputs and constraints.
- Existing course coverage and CS preset checks.
- Browser checks of the landing exercise, lesson navigation/focus, executable SQL, capstone capture and mobile layout.

## Launch dependency

Cloud accounts and shared classes require the existing Supabase configuration and database migrations. No credentials are bundled in this release. Verify with separate teacher and student accounts before advertising cross-device accounts or class submissions as generally available. The built-in local learning, export, SQL and simulation tools work without those services.

## Product boundaries

The practical projects combine a real SQLite sandbox and existing executable teaching models. They do not deploy production infrastructure or execute arbitrary OS kernels. The visual drills are small authored exercises; each roadmap problem also offers prediction against its actual trace. No subscription billing or payment processor is enabled by this release.
