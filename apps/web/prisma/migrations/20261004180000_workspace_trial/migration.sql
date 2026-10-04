-- Free plans become a 14-day trial. Existing workspaces get 14 days from when this migration runs
-- (the release), new ones 14 days from signup.
ALTER TABLE "Workspace" ADD COLUMN "trialEndsAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + '14 days'::interval);
