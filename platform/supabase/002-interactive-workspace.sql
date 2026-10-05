-- Apply after schema.sql. This migration adds features without resetting user data.
begin;
alter table public.classes add column if not exists archived boolean not null default false;
create table public.app_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.app_admins enable row level security;
create policy admin_self on public.app_admins for select to authenticated using(user_id=auth.uid());
revoke all on public.app_admins from anon,authenticated;
grant select on public.app_admins to authenticated;
create function public.trace_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.app_admins where user_id=auth.uid());
$$;
revoke all on function public.trace_is_admin() from public;
grant execute on function public.trace_is_admin() to authenticated;
create table public.quality_checks (
 key text primary key check(length(key)<200),problem_id text not null check(length(problem_id)<100),language text not null check(language in ('python','cpp','java','javascript')),
 kind text not null check(kind in ('execution','animation','alignment','explanation','mobile')),status text not null check(status in ('pending','passed','failed','blocked')),
 source text not null check(source in ('manual','reference-suite')),note text not null default '' check(length(note)<=1000),checked_at timestamptz,
 evidence jsonb not null default '{}' check(octet_length(evidence::text)<2000)
);
alter table public.quality_checks enable row level security;
create policy owner_quality on public.quality_checks for all to authenticated using(public.trace_is_admin()) with check(public.trace_is_admin());
create table public.site_run_events (
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 problem_id text not null check(length(problem_id)<100),language text not null check(language in ('python','cpp','java','javascript')),
 status text not null check(status in ('completed','error','cancelled')),duration_ms integer not null check(duration_ms between 0 and 3600000),created_at timestamptz not null default now()
);
alter table public.site_run_events enable row level security;
create policy event_submit on public.site_run_events for insert to authenticated with check(user_id=auth.uid());
create policy event_owner on public.site_run_events for select to authenticated using(public.trace_is_admin());
create index on public.site_run_events(created_at desc);
create table public.lesson_content (
 problem_id text primary key check(length(problem_id)<100),title text not null check(length(title) between 1 and 120),explanation text not null check(length(explanation) between 1 and 8000),
 updated_at timestamptz not null default now()
);
create table public.lesson_revisions (
 id uuid primary key default gen_random_uuid(),problem_id text not null,title text not null,explanation text not null,
 author_id uuid references auth.users(id) on delete set null,updated_at timestamptz not null default now()
);
alter table public.lesson_content enable row level security;
alter table public.lesson_revisions enable row level security;
create policy published_read on public.lesson_content for select to anon,authenticated using(true);
create policy published_create on public.lesson_content for insert to authenticated with check(public.trace_is_admin());
create policy published_update on public.lesson_content for update to authenticated using(public.trace_is_admin()) with check(public.trace_is_admin());
create policy revisions_owner on public.lesson_revisions for select to authenticated using(public.trace_is_admin());
create function public.trace_record_lesson_revision() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if not public.trace_is_admin() then raise exception 'Owner access required'; end if;
 insert into public.lesson_revisions(problem_id,title,explanation,author_id) values(new.problem_id,new.title,new.explanation,auth.uid());
 return new;
 end;
$$;
create function public.trace_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end; $$;
create trigger notebook_updated before update on public.notebooks for each row execute function public.trace_updated_at();
create trigger lesson_updated before update on public.lesson_content for each row execute function public.trace_updated_at();
create trigger lesson_revision after insert or update on public.lesson_content for each row execute function public.trace_record_lesson_revision();
create index on public.lesson_revisions(problem_id,updated_at desc);
create table public.courses (
 id uuid primary key default gen_random_uuid(),teacher_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 120),description text not null default '' check(length(description)<=2000),created_at timestamptz not null default now()
);
create table public.course_lessons (
 id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses(id) on delete cascade,
 position integer not null check(position between 0 and 999),problem_id text not null check(length(problem_id)<100),title text not null check(length(title) between 1 and 120),
 instructions text not null default '' check(length(instructions)<=3000),language text not null check(language in ('python','cpp','java','javascript')),
 input jsonb not null check(jsonb_typeof(input)='object' and octet_length(input::text)<24000),unique(course_id,position) deferrable initially immediate
);
alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
create policy course_owner on public.courses for all to authenticated using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());
create policy course_lesson_owner on public.course_lessons for all to authenticated using(exists(select 1 from public.courses c where c.id=course_id and c.teacher_id=auth.uid())) with check(exists(select 1 from public.courses c where c.id=course_id and c.teacher_id=auth.uid()));
create function public.trace_reorder_course(cid uuid,ids uuid[]) returns void language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null or not exists(select 1 from public.courses where id=cid and teacher_id=auth.uid()) then raise exception 'Course owner access required'; end if;
 perform 1 from public.course_lessons where course_id=cid for update;
 if cardinality(ids)<>(select count(*) from public.course_lessons where course_id=cid) or cardinality(ids)<>(select count(distinct value) from unnest(ids) value) or exists(select 1 from unnest(ids) value where not exists(select 1 from public.course_lessons where id=value and course_id=cid)) then raise exception 'Course changed. Refresh before reordering'; end if;
 set constraints public.course_lessons_course_id_position_key deferred;
 update public.course_lessons l set position=u.position-1 from unnest(ids) with ordinality as u(id,position) where l.id=u.id and l.course_id=cid;
 end;
$$;
revoke all on function public.trace_reorder_course(uuid,uuid[]) from public;
grant execute on function public.trace_reorder_course(uuid,uuid[]) to authenticated;
alter table public.assignments add column course_order integer check(course_order between 0 and 999);
alter table public.assignments add column source_lesson_id uuid references public.course_lessons(id) on delete set null;
create unique index on public.assignments(class_id,source_lesson_id) where source_lesson_id is not null;
create table public.submission_feedback (
 submission_id uuid primary key references public.submissions(id) on delete cascade,
 teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 note text not null check(length(note) between 1 and 4000),status text not null check(status in ('reviewed','revise','understood')),updated_at timestamptz not null default now()
);
alter table public.submission_feedback enable row level security;
create policy feedback_read on public.submission_feedback for select to authenticated using(exists(select 1 from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=submission_id and (s.user_id=auth.uid() or public.trace_class_owner(a.class_id))));
create policy feedback_create on public.submission_feedback for insert to authenticated with check(teacher_id=auth.uid() and exists(select 1 from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=submission_id and public.trace_class_owner(a.class_id)));
create policy feedback_update on public.submission_feedback for update to authenticated using(exists(select 1 from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=submission_id and public.trace_class_owner(a.class_id))) with check(teacher_id=auth.uid() and exists(select 1 from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=submission_id and public.trace_class_owner(a.class_id)));
create trigger feedback_updated before update on public.submission_feedback for each row execute function public.trace_updated_at();
create policy member_remove on public.class_members for delete to authenticated using(public.trace_class_owner(class_id) or user_id=auth.uid());
create or replace function public.join_trace_class(code text) returns uuid language plpgsql security definer set search_path='' as $$
 declare cid uuid;
 begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select id into cid from public.classes where invite_code=code and not archived;
 if cid is null then raise exception 'Invite code not found or class archived'; end if;
 insert into public.class_members(class_id,user_id) values(cid,auth.uid()) on conflict do nothing;
 return cid;
 end;
$$;
create table public.live_sessions (
 id uuid primary key default gen_random_uuid(),host_id uuid not null references auth.users(id) on delete cascade,
 class_id uuid references public.classes(id) on delete set null,title text not null check(length(title) between 1 and 120),
 join_code text not null unique default replace(gen_random_uuid()::text,'-',''),run_id uuid,
 step integer not null default 0 check(step between 0 and 1200),playing boolean not null default false,speed numeric not null default 1 check(speed in (0.5,1,2,4)),
 ended boolean not null default false,reveal_result boolean not null default false,updated_at timestamptz not null default now(),created_at timestamptz not null default now()
);
create table public.live_members (
 session_id uuid not null references public.live_sessions(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 100),joined_at timestamptz not null default now(),primary key(session_id,user_id)
);
create table public.live_runs (
 id uuid primary key default gen_random_uuid(),session_id uuid not null references public.live_sessions(id) on delete cascade,
 problem_id text not null check(length(problem_id)<100),language text not null check(language in ('python','cpp','java','javascript')),
 code text not null check(length(code)<=60000),input jsonb not null check(jsonb_typeof(input)='object' and octet_length(input::text)<24000),
 run jsonb not null check(jsonb_typeof(run)='object' and jsonb_typeof(run->'frames')='array' and jsonb_array_length(run->'frames') between 1 and 1200 and octet_length(run::text)<3000000),created_at timestamptz not null default now()
);
alter table public.live_sessions add foreign key(run_id) references public.live_runs(id) on delete set null;
create table public.live_polls (
 id uuid primary key default gen_random_uuid(),session_id uuid not null references public.live_sessions(id) on delete cascade,
 question text not null check(length(question) between 1 and 400),options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 5 and octet_length(options::text)<1000),
 active boolean not null default true,created_at timestamptz not null default now()
);
create table public.live_answers (
 poll_id uuid not null references public.live_polls(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 choice integer not null check(choice between 0 and 4),updated_at timestamptz not null default now(),primary key(poll_id,user_id)
);
create function public.trace_live_host(sid uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.live_sessions where id=sid and host_id=auth.uid()); $$;
create function public.trace_live_access(sid uuid) returns boolean language sql stable security definer set search_path='' as $$ select public.trace_live_host(sid) or (auth.uid() is not null and exists(select 1 from public.live_members m join public.live_sessions s on s.id=m.session_id where m.session_id=sid and m.user_id=auth.uid() and (s.class_id is null or public.trace_class_access(s.class_id)))); $$;
create function public.join_trace_live(code text,display_name text) returns uuid language plpgsql security definer set search_path='' as $$
 declare session public.live_sessions;
 begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if length(trim(display_name)) not between 1 and 100 then raise exception 'Enter your name'; end if;
 select * into session from public.live_sessions where join_code=code and not ended;
 if session.id is null then raise exception 'Session not found or ended'; end if;
 if session.class_id is not null and not public.trace_class_access(session.class_id) then raise exception 'Join the assigned class first'; end if;
 insert into public.live_members(session_id,user_id,display_name) values(session.id,auth.uid(),trim(display_name)) on conflict(session_id,user_id) do update set display_name=excluded.display_name;
 return session.id;
 end;
$$;
revoke all on function public.trace_live_host(uuid),public.trace_live_access(uuid),public.join_trace_live(text,text) from public;
grant execute on function public.trace_live_host(uuid),public.trace_live_access(uuid),public.join_trace_live(text,text) to authenticated;
alter table public.live_sessions enable row level security;
alter table public.live_members enable row level security;
alter table public.live_runs enable row level security;
alter table public.live_polls enable row level security;
alter table public.live_answers enable row level security;
create policy live_read on public.live_sessions for select to authenticated using(host_id=auth.uid() or public.trace_live_access(id));
create policy live_create on public.live_sessions for insert to authenticated with check(host_id=auth.uid() and (class_id is null or public.trace_class_owner(class_id)));
create policy live_update on public.live_sessions for update to authenticated using(host_id=auth.uid()) with check(host_id=auth.uid() and (class_id is null or public.trace_class_owner(class_id)) and (run_id is null or exists(select 1 from public.live_runs r where r.id=run_id and r.session_id=live_sessions.id)));
create policy live_member_read on public.live_members for select to authenticated using(user_id=auth.uid() or public.trace_live_host(session_id));
create policy live_run_read on public.live_runs for select to authenticated using(public.trace_live_access(session_id));
create policy live_run_create on public.live_runs for insert to authenticated with check(public.trace_live_host(session_id));
create policy live_poll_read on public.live_polls for select to authenticated using(public.trace_live_access(session_id));
create policy live_poll_create on public.live_polls for insert to authenticated with check(public.trace_live_host(session_id));
create policy live_poll_update on public.live_polls for update to authenticated using(public.trace_live_host(session_id)) with check(public.trace_live_host(session_id));
create policy live_answer_read on public.live_answers for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.live_polls p where p.id=poll_id and public.trace_live_host(p.session_id)));
create policy live_answer_create on public.live_answers for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.live_polls p where p.id=poll_id and p.active and exists(select 1 from public.live_sessions s where s.id=p.session_id and not s.ended) and choice<jsonb_array_length(p.options) and public.trace_live_access(p.session_id)));
create policy live_answer_update on public.live_answers for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.live_polls p where p.id=poll_id and p.active and exists(select 1 from public.live_sessions s where s.id=p.session_id and not s.ended) and choice<jsonb_array_length(p.options) and public.trace_live_access(p.session_id)));
create trigger live_updated before update on public.live_sessions for each row execute function public.trace_updated_at();
create trigger answer_updated before update on public.live_answers for each row execute function public.trace_updated_at();
create index on public.live_sessions(host_id,created_at desc);
create index on public.live_members(user_id);
create index on public.live_runs(session_id);
create index on public.live_polls(session_id,created_at desc);
revoke all on public.quality_checks,public.site_run_events,public.lesson_content,public.lesson_revisions,public.courses,public.course_lessons,public.submission_feedback,public.live_sessions,public.live_members,public.live_runs,public.live_polls,public.live_answers from anon,authenticated;
grant select,insert,update on public.quality_checks,public.courses,public.course_lessons,public.submission_feedback,public.live_sessions,public.live_polls,public.live_answers to authenticated;
grant insert,select on public.site_run_events,public.live_runs to authenticated;
grant select on public.live_members,public.lesson_revisions to authenticated;
grant select on public.lesson_content to anon,authenticated;
grant insert,update on public.lesson_content to authenticated;
grant delete on public.class_members to authenticated;
do $$ declare tbl text; begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
 foreach tbl in array array['live_sessions','live_polls','live_answers','live_members'] loop
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=tbl) then execute format('alter publication supabase_realtime add table public.%I',tbl);end if;
 end loop;
 end if;
end; $$;
commit;
-- After signing in, register your own account as owner through the SQL editor:
-- insert into public.app_admins(user_id) select id from auth.users where email='YOUR_EMAIL' on conflict do nothing;
