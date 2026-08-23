-- AD-7 / AD-20 — Row-level security: forced, unowned, never silently absent.
--
-- The app connects as giapha_app, which does NOT own these tables and holds no BYPASSRLS,
-- so FORCE ROW LEVEL SECURITY binds every query it makes. Policies read the per-transaction
-- variable app.clan_id set by db/index.ts withClanContext() via SET LOCAL, and FAIL CLOSED:
-- unset or empty context yields zero rows, never all rows.
--
-- The release gates for this file live in core/gates/ (two-clan isolation test + schema check
-- that every partitioned table has an enabled, forced policy). Editing the table list here
-- without updating PARTITIONED_TABLES in db/schema/domain.ts fails the gate — on purpose.

-- ── Grants ──────────────────────────────────────────────────────────────────────────────────
-- Identity tables (Better Auth — no clan key, AD-8): plain table access, no RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "user", "session", "account", "verification" TO giapha_app;

-- Clan + partitioned tables: access granted, rows filtered by policy below.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "clan", "person", "source", "union", "assertion", "attachment",
  "recording", "recording_subject", "revision", "notification", "merge_proposal"
TO giapha_app;
--> statement-breakpoint

-- ── Helper: the clan context, fail-closed ──────────────────────────────────────────────────
-- nullif guards the empty string ('' ::uuid would raise instead of filtering).
CREATE OR REPLACE FUNCTION current_clan_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE AS
$$ SELECT nullif(current_setting('app.clan_id', true), '')::uuid $$;
--> statement-breakpoint

-- ── clan: visible only when it IS the current context ──────────────────────────────────────
ALTER TABLE "clan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clan" FORCE ROW LEVEL SECURITY;
CREATE POLICY clan_isolation ON "clan"
  USING (id = current_clan_id())
  WITH CHECK (id = current_clan_id());
--> statement-breakpoint

-- ── every partitioned table: clan_id must equal the context ────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'person', 'source', 'union', 'assertion', 'attachment',
    'recording', 'recording_subject', 'revision', 'notification', 'merge_proposal'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (clan_id = current_clan_id()) WITH CHECK (clan_id = current_clan_id())',
      t || '_isolation', t
    );
  END LOOP;
END $$;
