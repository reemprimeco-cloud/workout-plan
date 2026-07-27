-- The users.authProvider column defaulted to 'manus', an auth system removed
-- in the standalone migration. Every signup path sets the value explicitly, so
-- this is a latent default rather than an active bug — but any insert that
-- omits the column (a seed, a manual row, a future code path) records a
-- provider the app cannot act on.
--
-- The 'manus' enum VALUE is deliberately kept: accounts created before the
-- migration still carry it, and dropping it would orphan those rows.
ALTER TABLE "users" ALTER COLUMN "authProvider" SET DEFAULT 'email';
