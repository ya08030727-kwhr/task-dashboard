-- タスクテーブル
create table if not exists tasks (
  id bigint primary key,
  text text not null,
  done boolean default false,
  tag text not null default 'hoiku',
  due_date text,
  channel text,
  message_ts text,
  created_at timestamptz default now()
);

-- プロジェクトテーブル
create table if not exists projects (
  id bigint primary key,
  name text not null,
  progress int default 0,
  color text not null
);

-- ふりかえりテーブル（1行固定）
create table if not exists reflection (
  id int primary key default 1,
  good text default '',
  bad text default '',
  updated_at timestamptz default now()
);
insert into reflection (id) values (1) on conflict do nothing;

-- 明日のタスクテーブル
create table if not exists tomorrow_tasks (
  id serial primary key,
  text text not null,
  position int default 0
);

-- リアルタイム有効化
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table reflection;
alter publication supabase_realtime add table tomorrow_tasks;
