-- 1. Products Table
drop table if exists products cascade;
create table products (
  id text primary key,
  name text not null,
  created_at timestamp with time zone default now()
);

-- 2. Invoices Table
drop table if exists invoices cascade;
create table invoices (
  id text primary key,
  date timestamp with time zone not null,
  category text not null,
  buyer text not null,
  items jsonb not null,
  grand_total numeric not null,
  image_url text,
  created_at timestamp with time zone default now(),
  notes text
);

-- 3. Payments Table
drop table if exists payments cascade;
create table payments (
  id text primary key,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  total_amount numeric not null,
  transactions jsonb not null default '[]'::jsonb,
  report_snapshot text,
  created_at timestamp with time zone default now()
);

-- Fix RLS
alter table products disable row level security;
alter table invoices disable row level security;
alter table payments disable row level security;
