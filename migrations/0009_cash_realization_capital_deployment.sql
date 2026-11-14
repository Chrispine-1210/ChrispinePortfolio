create table if not exists commercial_invoices (
  id varchar primary key default gen_random_uuid(),
  lead_id varchar not null references leads(id) on delete cascade,
  revenue_event_id varchar references revenue_events(id) on delete set null,
  service_interest varchar(180) not null,
  invoice_number varchar(120) not null unique,
  currency varchar(3) not null,
  amount numeric(14,2) not null,
  issued_at timestamp not null,
  due_at timestamp not null,
  status varchar(24) not null default 'issued',
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint commercial_invoices_amount_positive check (amount > 0),
  constraint commercial_invoices_due_valid check (due_at >= issued_at),
  constraint commercial_invoices_status_valid check (status in ('issued','partially_paid','paid','void'))
);

create index if not exists commercial_invoices_lead_time_idx
  on commercial_invoices (lead_id, issued_at);

create index if not exists commercial_invoices_due_status_idx
  on commercial_invoices (voided_at, status, due_at);

create table if not exists cash_collections (
  id varchar primary key default gen_random_uuid(),
  invoice_id varchar not null references commercial_invoices(id) on delete cascade,
  amount numeric(14,2) not null,
  received_at timestamp not null,
  payment_method varchar(32) not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint cash_collections_amount_positive check (amount > 0),
  constraint cash_collections_method_valid check (
    payment_method in ('bank_transfer','mobile_money','cash','card','cheque','other')
  )
);

create index if not exists cash_collections_invoice_time_idx
  on cash_collections (invoice_id, received_at);

create index if not exists cash_collections_active_time_idx
  on cash_collections (voided_at, received_at);

create table if not exists recurring_revenue_movements (
  id varchar primary key default gen_random_uuid(),
  agreement_id varchar not null references recurring_revenue_agreements(id) on delete cascade,
  lead_id varchar not null references leads(id) on delete cascade,
  service_interest varchar(180) not null,
  currency varchar(3) not null,
  movement_type varchar(24) not null,
  mrr_delta numeric(14,2) not null,
  effective_at timestamp not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint recurring_revenue_movements_type_valid check (
    movement_type in ('expansion','contraction','churn','reactivation')
  ),
  constraint recurring_revenue_movements_delta_nonzero check (mrr_delta <> 0),
  constraint recurring_revenue_movements_direction_valid check (
    (movement_type in ('expansion','reactivation') and mrr_delta > 0)
    or (movement_type in ('contraction','churn') and mrr_delta < 0)
  )
);

create index if not exists recurring_revenue_movements_agreement_time_idx
  on recurring_revenue_movements (agreement_id, effective_at);

create index if not exists recurring_revenue_movements_service_time_idx
  on recurring_revenue_movements (service_interest, currency, effective_at);

create index if not exists recurring_revenue_movements_active_time_idx
  on recurring_revenue_movements (voided_at, effective_at);

create table if not exists delivery_capacity_records (
  id varchar primary key default gen_random_uuid(),
  service_interest varchar(180) not null,
  capacity_scope varchar(180) not null,
  period_start timestamp not null,
  period_end timestamp not null,
  available_hours numeric(10,2) not null,
  delivery_hours numeric(10,2) not null,
  billable_hours numeric(10,2) not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint delivery_capacity_period_valid check (period_end >= period_start),
  constraint delivery_capacity_available_nonnegative check (available_hours >= 0),
  constraint delivery_capacity_delivery_nonnegative check (delivery_hours >= 0),
  constraint delivery_capacity_billable_nonnegative check (billable_hours >= 0),
  constraint delivery_capacity_billable_not_over_delivery check (billable_hours <= delivery_hours)
);

create index if not exists delivery_capacity_service_period_idx
  on delivery_capacity_records (service_interest, capacity_scope, period_start, period_end);

create index if not exists delivery_capacity_active_period_idx
  on delivery_capacity_records (voided_at, period_start, period_end);

create table if not exists capital_budget_cycles (
  id varchar primary key default gen_random_uuid(),
  period_start timestamp not null,
  period_end timestamp not null,
  currency varchar(3) not null,
  envelope_amount numeric(14,2) not null,
  status varchar(24) not null default 'draft',
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  approved_by varchar references users(id) on delete set null,
  approved_at timestamp,
  closed_at timestamp,
  created_at timestamp not null default now(),
  constraint capital_budget_period_valid check (period_end >= period_start),
  constraint capital_budget_envelope_positive check (envelope_amount > 0),
  constraint capital_budget_status_valid check (status in ('draft','approved','closed'))
);

create unique index if not exists capital_budget_period_currency_idx
  on capital_budget_cycles (period_start, period_end, currency);

create index if not exists capital_budget_status_period_idx
  on capital_budget_cycles (status, period_start, period_end);

create table if not exists capital_budget_allocations (
  id varchar primary key default gen_random_uuid(),
  budget_id varchar not null references capital_budget_cycles(id) on delete cascade,
  channel varchar(48) not null,
  service_interest varchar(180) not null,
  recommendation_decision varchar(24) not null,
  recommendation_confidence varchar(16) not null,
  recommended_amount numeric(14,2) not null,
  approved_amount numeric(14,2) not null,
  source_window varchar(16) not null,
  recommendation_snapshot jsonb not null default '{}'::jsonb,
  rationale text not null,
  created_by varchar references users(id) on delete set null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  constraint capital_budget_allocation_decision_valid check (
    recommendation_decision in ('scale','maintain','cut','insufficient_data')
  ),
  constraint capital_budget_allocation_confidence_valid check (
    recommendation_confidence in ('low','medium','high')
  ),
  constraint capital_budget_allocation_recommended_nonnegative check (recommended_amount >= 0),
  constraint capital_budget_allocation_approved_nonnegative check (approved_amount >= 0)
);

create unique index if not exists capital_budget_allocation_segment_idx
  on capital_budget_allocations (budget_id, channel, service_interest);

insert into roles (key, name, description, is_system) values
  ('finance_manager', 'Finance Manager', 'Records cash realization, revenue evidence, retention movements and capital budget proposals without final budget approval authority.', true)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  is_system = true;

insert into permissions (key, description) values
  ('cash.realization.manage', 'Create and void invoice and cash collection evidence'),
  ('retention.evidence.manage', 'Create and void recurring revenue movement evidence'),
  ('delivery.capacity.manage', 'Create and void delivery capacity evidence'),
  ('capital.budget.manage', 'Create and edit draft capital budgets and allocations'),
  ('capital.budget.approve', 'Approve and close capital budget cycles')
on conflict (key) do update set description = excluded.description;

insert into role_permissions (role_id, permission_id)
select roles.id, permissions.id
from roles cross join permissions
where roles.key in ('super_administrator', 'administrator')
  and permissions.key in (
    'cash.realization.manage',
    'retention.evidence.manage',
    'delivery.capacity.manage',
    'capital.budget.manage',
    'capital.budget.approve'
  )
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select roles.id, permissions.id
from roles cross join permissions
where roles.key = 'finance_manager'
  and permissions.key in (
    'pipeline.financial.read',
    'revenue.economics.manage',
    'acquisition.spend.manage',
    'cash.realization.manage',
    'retention.evidence.manage',
    'delivery.capacity.manage',
    'capital.budget.manage'
  )
on conflict do nothing;
