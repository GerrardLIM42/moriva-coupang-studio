-- Supabase Dashboard > SQL Editor에서 한 번만 실행하세요.
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
create policy "owners can read projects" on public.projects for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can create projects" on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owners can update projects" on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners can delete projects" on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('moriva-projects', 'moriva-projects', false)
on conflict (id) do update set public = false;

create policy "owners can read project files" on storage.objects for select to authenticated
using (bucket_id = 'moriva-projects' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can upload project files" on storage.objects for insert to authenticated
with check (bucket_id = 'moriva-projects' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can update project files" on storage.objects for update to authenticated
using (bucket_id = 'moriva-projects' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can delete project files" on storage.objects for delete to authenticated
using (bucket_id = 'moriva-projects' and (storage.foldername(name))[1] = (select auth.uid())::text);

create index if not exists projects_user_updated_idx on public.projects(user_id, updated_at desc);
