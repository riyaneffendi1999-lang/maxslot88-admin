/*
# Add completed_at column to bonus_tasks

1. Purpose
   - Separate the completion time from the creation time for Lucky Spin rows.
   - `created_at` records when a ticket was first added to the left (pending) table.
   - `completed_at` records when the admin pressed Enter on the inject_bonus field
     (i.e. when the row moved from pending to complete).
   - The right table (Data Complete) should show `completed_at` for Tanggal/Jam,
     so the timestamp reflects the moment of completion, not ticket creation.

2. Changes
   - Add column `completed_at timestamptz` (nullable) to `bonus_tasks`.
   - Backfill existing complete rows with `created_at` so they still display.

3. Security
   - No policy changes. Existing RLS policies already cover the new column.

4. Notes
   - `edited_at` / `edited_by` remain and are now ONLY written when an admin
     uses the pencil edit button on a completed row — not on initial completion.
*/

ALTER TABLE bonus_tasks
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

UPDATE bonus_tasks
   SET completed_at = created_at
 WHERE status = 'complete' AND completed_at IS NULL;
