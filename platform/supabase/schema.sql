-- Run once in a new Supabase project's SQL editor.
begin;
create table public.notebooks (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}' check (jsonb_typeof(data)='object' and octet_length(data::text)<4000000),
 updated_at timestamptz not null default now()
);
create table public.classes (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 120),
 invite_code text not null unique default replace(gen_random_uuid()::text,'-',''),
 created_at timestamptz not null default now()
);
create table public.class_members (
 class_id uuid not null references public.classes(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(), primary key(class_id,user_id)
);
create table public.assignments (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 title text not null check(length(title) between 1 and 120),
 instructions text not null default '' check(length(instructions)<=3000),
 problem_id text not null check(length(problem_id)<=100),
 input jsonb not null check(jsonb_typeof(input)='object' and octet_length(input::text)<24000),
 language text not null default 'python' check(language in ('python','cpp','java','javascript')),
 due_at timestamptz, created_at timestamptz not null default now()
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(),
 assignment_id uuid not null references public.assignments(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 100),
 problem_id text not null, language text not null check(language in ('python','cpp','java','javascript')),
 code text not null default '' check(length(code)<=18000),
 input jsonb check(input is null or (jsonb_typeof(input)='object' and octet_length(input::text)<24000)),
 score integer check(score between 0 and 100),
 reflection text not null check(length(reflection) between 20 and 8000),
 updated_at timestamptz not null default now(), unique(assignment_id,user_id)
);
create index on public.classes(teacher_id);
create index on public.class_members(user_id);
create index on public.assignments(class_id);
create index on public.submissions(assignment_id);
alter table public.notebooks enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
-- Definer helpers use fixed search paths and only the current authenticated identity.
create function public.trace_class_access(cid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (exists(select 1 from public.classes where id=cid and teacher_id=auth.uid()) or exists(select 1 from public.class_members where class_id=cid and user_id=auth.uid()));
$$;
create function public.trace_class_owner(cid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.classes where id=cid and teacher_id=auth.uid());
$$;
create function public.join_trace_class(code text) returns uuid
language plpgsql security definer set search_path='' as $$
declare cid uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select id into cid from public.classes where invite_code=code;
 if cid is null then raise exception 'Invite code not found'; end if;
 insert into public.class_members(class_id,user_id) values(cid,auth.uid()) on conflict do nothing;
 return cid;
end;
$$;
revoke all on function public.trace_class_access(uuid),public.trace_class_owner(uuid),public.join_trace_class(text) from public;
grant execute on function public.trace_class_access(uuid),public.trace_class_owner(uuid),public.join_trace_class(text) to authenticated;
create policy notebook_owner on public.notebooks for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy class_read on public.classes for select to authenticated using(public.trace_class_access(id));
create policy class_create on public.classes for insert to authenticated with check(teacher_id=auth.uid());
create policy class_update on public.classes for update to authenticated using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());
create policy member_read on public.class_members for select to authenticated using(user_id=auth.uid() or public.trace_class_owner(class_id));
create policy assignment_read on public.assignments for select to authenticated using(public.trace_class_access(class_id));
create policy assignment_create on public.assignments for insert to authenticated with check(public.trace_class_owner(class_id));
create policy assignment_update on public.assignments for update to authenticated using(public.trace_class_owner(class_id)) with check(public.trace_class_owner(class_id));
create policy submission_read on public.submissions for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.assignments a where a.id=assignment_id and public.trace_class_owner(a.class_id)));
create policy submission_create on public.submissions for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.assignments a where a.id=assignment_id and a.problem_id=submissions.problem_id and public.trace_class_access(a.class_id)));
create policy submission_update on public.submissions for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.assignments a where a.id=assignment_id and a.problem_id=submissions.problem_id and public.trace_class_access(a.class_id)));
grant select,insert,update on public.notebooks,public.classes,public.assignments,public.submissions to authenticated;
grant select on public.class_members to authenticated;
commit;
