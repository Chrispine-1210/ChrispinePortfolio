create table if not exists lead_attribution_touches (
  id varchar primary key default gen_random_uuid(),
  lead_id varchar not null references leads(id) on delete cascade,
  touch_type varchar(16) not null,
  channel varchar(48) not null,
  source varchar(160) not null,
  medium varchar(120),
  campaign varchar(180),
  term varchar(240),
  content varchar(240),
  referrer text,
  landing_page text not null,
  captured_at timestamp not null,
  created_at timestamp not null default now(),
  constraint lead_attribution_touches_touch_type_valid
    check (touch_type in ('first', 'last'))
);

create unique index if not exists lead_attribution_touches_lead_touch_idx
  on lead_attribution_touches (lead_id, touch_type);

create index if not exists lead_attribution_touches_channel_time_idx
  on lead_attribution_touches (channel, captured_at);

create index if not exists lead_attribution_touches_source_time_idx
  on lead_attribution_touches (source, captured_at);

create index if not exists lead_attribution_touches_campaign_time_idx
  on lead_attribution_touches (campaign, captured_at);


create table if not exists acquisition_spend_entries (
  id varchar primary key default gen_random_uuid(),
  channel varchar(48) not null,
  source varchar(160) not null,
  campaign varchar(180),
  currency varchar(3) not null,
  amount numeric(14,2) not null,
  occurred_at timestamp not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint acquisition_spend_amount_positive check (amount > 0)
);

create index if not exists acquisition_spend_channel_time_idx
  on acquisition_spend_entries (channel, occurred_at);

create index if not exists acquisition_spend_source_time_idx
  on acquisition_spend_entries (source, occurred_at);

create index if not exists acquisition_spend_campaign_time_idx
  on acquisition_spend_entries (campaign, occurred_at);

create index if not exists acquisition_spend_active_time_idx
  on acquisition_spend_entries (voided_at, occurred_at);

insert into permissions (key, description) values
  ('acquisition.spend.manage', 'Create and void acquisition marketing spend records')
on conflict (key) do update set description = excluded.description;

insert into role_permissions (role_id, permission_id)
select roles.id, permissions.id
from roles cross join permissions
where roles.key in ('super_administrator', 'administrator', 'business_development_manager')
  and permissions.key = 'acquisition.spend.manage'
on conflict do nothing;
