create table if not exists public.posts (
id uuid primary key default gen_random_uuid(),
user_id uuid references public.profiles(id) on delete cascade,
image_url text not null,
caption text,
created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "posts readable by everyone"
on public.posts
for select
using (true);

create policy "authenticated users can insert posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict do nothing;
