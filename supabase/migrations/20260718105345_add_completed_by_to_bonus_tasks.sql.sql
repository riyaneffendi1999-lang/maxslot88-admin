/*
# Add completed_by column to bonus_tasks

## Purpose
Track which admin completed (injected bonus for) a bonus task. This supports
the Lucky Spin operator workflow where pressing ENTER on the inject_bonus input
marks the task complete and records the acting admin.

## Changes
1. New column on `bonus_tasks`:
   - `completed_by` (text, nullable) — email or username of the admin who set the
     task to `complete`. Mirrors the existing `edited_by` audit column.

## Security
- No RLS policy changes. Existing `auth_*_bonus_tasks` policies already allow
  authenticated admins to read/write all bonus_tasks rows (intentionally shared
  operational data across admins).
- No destructive operations. Column is added with `IF NOT EXISTS` so re-running
  the migration is safe.

## Notes
- `completed_by` is nullable because pre-existing rows completed before this
  migration have no recorded admin.
- The frontend writes `completed_by` together with `status='complete'` and
  `completed_at` in a single UPDATE.
*/

ALTER TABLE bonus_tasks
  ADD COLUMN IF NOT EXISTS completed_by TEXT;

COMMENT ON COLUMN bonus_tasks.completed_by IS 'Email/username of the admin who marked this task complete (inject bonus workflow).';
