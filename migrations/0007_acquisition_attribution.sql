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
