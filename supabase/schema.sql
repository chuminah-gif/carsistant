-- 카시스턴트 Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 스크립트 전체를 한 번 실행하세요.
-- (publishable/anon 키는 DDL 권한이 없으므로 이 작업은 반드시 대시보드에서 직접 실행해야 합니다.)
-- 연금랩과는 별도의 Supabase 프로젝트를 사용하는 것을 권장합니다.

-- 1) 차량 정보 테이블 (회원 본인 소유 차량만 조회/수정/삭제 가능)
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  nickname text,
  model_name text not null,
  model_year int,
  current_mileage int,
  plate_number text
);

alter table public.vehicles enable row level security;

drop policy if exists "users manage own vehicles" on public.vehicles;
create policy "users manage own vehicles"
  on public.vehicles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) 정비 기록 테이블 (차량과 마찬가지로 본인 소유 기록만 접근 가능)
create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  item_type text not null,
  service_date date not null,
  cost integer,
  mileage_at_service integer,
  next_due_date date,
  next_due_mileage integer,
  memo text
);

alter table public.maintenance_records enable row level security;

drop policy if exists "users manage own records" on public.maintenance_records;
create policy "users manage own records"
  on public.maintenance_records
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_maintenance_records_vehicle_id on public.maintenance_records(vehicle_id);

-- 3) 문의하기 폼 저장 테이블
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  email text not null,
  message text not null
);

alter table public.inquiries enable row level security;

-- 누구나(익명 방문자) 문의를 "등록"할 수는 있지만, 등록된 문의를 조회/수정/삭제할 수는 없도록 제한합니다.
-- (운영자는 Supabase 대시보드에서 service_role 권한으로 열람합니다.)
drop policy if exists "public can insert inquiries" on public.inquiries;
create policy "public can insert inquiries"
  on public.inquiries
  for insert
  to anon
  with check (true);

-- 4) 계산기 사용 통계 테이블 (개인 식별 정보 없이, 어떤 계산기가 쓰였는지만 기록)
create table if not exists public.calc_usage (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  calc_type text not null check (
    calc_type in ('car_tax', 'acquisition_tax', 'insurance_estimate', 'fuel_cost', 'maintenance_estimate')
  )
);

alter table public.calc_usage enable row level security;

drop policy if exists "public can insert usage" on public.calc_usage;
create policy "public can insert usage"
  on public.calc_usage
  for insert
  to anon
  with check (true);

-- 참고:
-- vehicles/maintenance_records는 authenticated 사용자 본인 행에 한해 전체 CRUD(select/insert/update/delete)가 가능합니다.
-- inquiries/calc_usage는 익명 사용자도 등록(INSERT)만 가능하고 조회는 불가능합니다.
-- 운영자 본인이 문의 내역이나 통계를 조회하려면 Supabase 대시보드의 Table Editor를 이용하세요.
