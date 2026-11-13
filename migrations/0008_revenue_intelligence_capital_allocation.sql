alter table acquisition_spend_entries
  add column if not exists service_interest varchar(180);

create index if not exists acquisition_spend_channel_service_time_idx
  on acquisition_spend_entries (channel, service_interest, occurred_at);

create table if not exists recurring_revenue_agreements (
  id varchar primary key default gen_random_uuid(),
  lead_id varchar not null references leads(id) on delete cascade,
  service_interest varchar(180) not null,
  currency varchar(3) not null,
  monthly_recurring_revenue numeric(14,2) not null,
  started_at timestamp not null,
  ended_at timestamp,
  status varchar(24) not null default 'active',
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint recurring_revenue_agreements_mrr_positive check (monthly_recurring_revenue > 0),
  constraint recurring_revenue_agreements_status_valid check (status in ('active', 'ended', 'cancelled')),
  constraint recurring_revenue_agreements_end_valid check (ended_at is null or ended_at >= started_at)
);

create index if not exists recurring_revenue_agreements_lead_idx
  on recurring_revenue_agreements (lead_id, started_at);

create index if not exists recurring_revenue_agreements_active_service_idx
  on recurring_revenue_agreements (voided_at, status, service_interest, currency, started_at);

create table if not exists revenue_events (
  id varchar primary key default gen_random_uuid(),
  lead_id varchar not null references leads(id) on delete cascade,
  service_interest varchar(180) not null,
  revenue_kind varchar(24) not null,
  currency varchar(3) not null,
  amount numeric(14,2) not null,
  occurred_at timestamp not null,
  period_start timestamp,
  period_end timestamp,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint revenue_events_amount_positive check (amount > 0),
  constraint revenue_events_kind_valid check (revenue_kind in ('one_time', 'recurring')),
  constraint revenue_events_period_valid check (
    (period_start is null and period_end is null)
    or (period_start is not null and period_end is not null and period_end >= period_start)
  )
);

create index if not exists revenue_events_lead_time_idx
  on revenue_events (lead_id, occurred_at);

create index if not exists revenue_events_service_time_idx
  on revenue_events (service_interest, currency, occurred_at);

create index if not exists revenue_events_active_time_idx
  on revenue_events (voided_at, occurred_at);

create table if not exists direct_cost_entries (
  id varchar primary key default gen_random_uuid(),
  lead_id varchar not null references leads(id) on delete cascade,
  service_interest varchar(180) not null,
  category varchar(48) not null,
  cost_scope varchar(24) not null,
  currency varchar(3) not null,
  amount numeric(14,2) not null,
  occurred_at timestamp not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint direct_cost_entries_amount_nonnegative check (amount >= 0),
  constraint direct_cost_entries_category_valid check (
    category in ('delivery_labour', 'infrastructure', 'subcontractor', 'transaction', 'support', 'other')
  ),
  constraint direct_cost_entries_scope_valid check (cost_scope in ('one_time', 'recurring'))
);

create index if not exists direct_cost_entries_lead_time_idx
  on direct_cost_entries (lead_id, occurred_at);

create index if not exists direct_cost_entries_service_time_idx
  on direct_cost_entries (service_interest, currency, occurred_at);

create index if not exists direct_cost_entries_active_time_idx
  on direct_cost_entries (voided_at, occurred_at);

create table if not exists cost_evidence_attestations (
  id varchar primary key default gen_random_uuid(),
  lead_id varchar not null references leads(id) on delete cascade,
  service_interest varchar(180) not null,
  currency varchar(3) not null,
  through_at timestamp not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now()
);

create index if not exists cost_evidence_attestations_lead_currency_idx
  on cost_evidence_attestations (lead_id, currency, through_at);

create index if not exists cost_evidence_attestations_active_idx
  on cost_evidence_attestations (voided_at, through_at);

insert into permissions (key, description) values
  ('revenue.economics.manage', 'Create, close, and void revenue-economics evidence records')
on conflict (key) do update set description = excluded.description;

insert into role_permissions (role_id, permission_id)
select roles.id, permissions.id
from roles cross join permissions
where roles.key in ('super_administrator', 'administrator', 'business_development_manager')
  and permissions.key = 'revenue.economics.manage'
on conflict do nothing;
