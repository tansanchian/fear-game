# Supabase setup

The website integration is ready, but it needs a Supabase project before shared collection starts.

1. Create a free project at <https://supabase.com/dashboard>.
2. Open **SQL Editor**, paste the contents of `supabase-schema.sql`, and run it once.
3. Open **Project Settings → API** and copy:
   - Project URL
   - Publishable key (sometimes labelled `anon` in older projects)
4. Put those two values into `supabase-config.js`.
5. In **Authentication → Users**, create the project-member account that should be allowed to open the response dashboard.
6. In the Authentication settings, keep public email sign-ups disabled unless the project specifically needs them.
7. Commit and push the changed files, then complete one test playthrough on GitHub Pages.
8. Open `dashboard.html` on the deployed site and sign in with the project-member account.

The public website uses only the publishable key. Never add the `service_role`, secret key, database password or dashboard password to this repository.

## Data access

- Signed-out visitors can insert completed responses.
- Signed-out visitors cannot read, update or delete responses.
- Signed-in Supabase users can read responses for the private dashboard.
- No browser receives the Supabase service-role key.
- The browser keeps a local backup and marks failed network submissions as pending.
