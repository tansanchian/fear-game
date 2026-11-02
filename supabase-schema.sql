-- Run this once in Supabase → SQL Editor.
create table if not exists public.game_responses (
  id text primary key,
  participant_name text not null check (char_length(participant_name) between 1 and 80),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  ending_choice text not null check (ending_choice in ('buy', 'pass')),
  response jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.game_responses enable row level security;

revoke all on table public.game_responses from anon, authenticated;
grant insert on table public.game_responses to anon;
grant select on table public.game_responses to authenticated;

drop policy if exists "Visitors can submit completed responses" on public.game_responses;
create policy "Visitors can submit completed responses"
on public.game_responses
for insert
to anon
with check (
  completed_at is not null
  and ending_choice in ('buy', 'pass')
  and jsonb_typeof(response) = 'object'
);

drop policy if exists "Signed-in project members can view responses" on public.game_responses;
create policy "Signed-in project members can view responses"
on public.game_responses
for select
to authenticated
using (true);
