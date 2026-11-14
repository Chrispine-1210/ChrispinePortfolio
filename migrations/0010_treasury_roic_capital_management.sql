create table if not exists treasury_accounts (
  id varchar primary key default gen_random_uuid(),
  name varchar(180) not null,
  institution varchar(180),
  account_type varchar(32) not null,
  currency varchar(3) not null,
  status varchar(24) not null default 'active',
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  created_at timestamp not null default now(),
  archived_at timestamp,
  constraint treasury_accounts_type_valid check (
    account_type in ('bank','mobile_money','cash','money_market','other')
  ),
  constraint treasury_accounts_status_valid check (
    status in ('active','restricted','closed')
  )
);

create unique index if not exists treasury_accounts_name_currency_idx
  on treasury_accounts (name, currency) where archived_at is null;

create table if not exists treasury_balance_snapshots (
  id varchar primary key default gen_random_uuid(),
  account_id varchar not null references treasury_accounts(id) on delete cascade,
  currency varchar(3) not null,
  ledger_balance numeric(14,2) not null,
  available_balance numeric(14,2) not null,
  restricted_balance numeric(14,2) not null default 0,
  captured_at timestamp not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint treasury_balance_ledger_nonnegative check (ledger_balance >= 0),
  constraint treasury_balance_available_nonnegative check (available_balance >= 0),
  constraint treasury_balance_restricted_nonnegative check (restricted_balance >= 0),
  constraint treasury_balance_restricted_available check (restricted_balance <= available_balance)
);

create index if not exists treasury_balance_account_time_idx
  on treasury_balance_snapshots (account_id, captured_at);
create index if not exists treasury_balance_active_time_idx
  on treasury_balance_snapshots (voided_at, captured_at);
create unique index if not exists treasury_balance_account_snapshot_idx
  on treasury_balance_snapshots (account_id, captured_at) where voided_at is null;

create table if not exists treasury_cash_disbursements (
  id varchar primary key default gen_random_uuid(),
  account_id varchar references treasury_accounts(id) on delete set null,
  currency varchar(3) not null,
  amount numeric(14,2) not null,
  cash_use_type varchar(24) not null,
  category varchar(48) not null,
  service_interest varchar(180),
  occurred_at timestamp not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint treasury_cash_disbursement_amount_positive check (amount > 0),
  constraint treasury_cash_use_type_valid check (
    cash_use_type in ('operating','capital','financing')
  ),
  constraint treasury_cash_category_valid check (
    category in (
      'direct_delivery','payroll','marketing','software_infrastructure',
      'rent_utilities','professional_fees','tax','other_operating',
      'growth_capex','maintenance_capex','working_capital','product_development',
      'debt_service','owner_distribution','other_financing'
    )
  ),
  constraint treasury_cash_type_category_consistent check (
    (cash_use_type = 'operating' and category in (
      'direct_delivery','payroll','marketing','software_infrastructure',
      'rent_utilities','professional_fees','tax','other_operating'
    ))
    or (cash_use_type = 'capital' and category in (
      'growth_capex','maintenance_capex','working_capital','product_development'
    ))
    or (cash_use_type = 'financing' and category in (
      'debt_service','owner_distribution','other_financing'
    ))
  )
);

create index if not exists treasury_cash_disbursement_time_idx
  on treasury_cash_disbursements (currency, occurred_at);
create index if not exists treasury_cash_disbursement_type_time_idx
  on treasury_cash_disbursements (cash_use_type, currency, occurred_at);
create index if not exists treasury_cash_disbursement_active_time_idx
  on treasury_cash_disbursements (voided_at, occurred_at);

create table if not exists operating_expense_entries (
  id varchar primary key default gen_random_uuid(),
  currency varchar(3) not null,
  amount numeric(14,2) not null,
  category varchar(48) not null,
  service_interest varchar(180),
  occurred_at timestamp not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint operating_expense_amount_positive check (amount > 0),
  constraint operating_expense_category_valid check (
    category in (
      'payroll_overhead','rent_utilities','software_tools','professional_fees',
      'insurance','travel_admin','governance','depreciation_amortization','other'
    )
  )
);

create index if not exists operating_expense_currency_time_idx
  on operating_expense_entries (currency, occurred_at);
create index if not exists operating_expense_active_time_idx
  on operating_expense_entries (voided_at, occurred_at);

create table if not exists operating_tax_provisions (
  id varchar primary key default gen_random_uuid(),
  currency varchar(3) not null,
  amount numeric(14,2) not null,
  period_start timestamp not null,
  period_end timestamp not null,
  recognized_at timestamp not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint operating_tax_amount_nonnegative check (amount >= 0),
  constraint operating_tax_period_valid check (period_end >= period_start)
);

create index if not exists operating_tax_currency_period_idx
  on operating_tax_provisions (currency, period_start, period_end);
create index if not exists operating_tax_active_idx
  on operating_tax_provisions (voided_at, recognized_at);

create table if not exists invested_capital_snapshots (
  id varchar primary key default gen_random_uuid(),
  currency varchar(3) not null,
  operating_assets numeric(14,2) not null,
  operating_liabilities numeric(14,2) not null,
  captured_at timestamp not null,
  components jsonb not null default '{}'::jsonb,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint invested_capital_assets_nonnegative check (operating_assets >= 0),
  constraint invested_capital_liabilities_nonnegative check (operating_liabilities >= 0)
);

create index if not exists invested_capital_currency_time_idx
  on invested_capital_snapshots (currency, captured_at);
create index if not exists invested_capital_active_time_idx
  on invested_capital_snapshots (voided_at, captured_at);
create unique index if not exists invested_capital_currency_snapshot_idx
  on invested_capital_snapshots (currency, captured_at) where voided_at is null;

create table if not exists capital_deployment_entries (
  id varchar primary key default gen_random_uuid(),
  budget_allocation_id varchar references capital_budget_allocations(id) on delete set null,
  currency varchar(3) not null,
  amount numeric(14,2) not null,
  category varchar(48) not null,
  service_interest varchar(180),
  occurred_at timestamp not null,
  source_reference text not null,
  approval_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint capital_deployment_amount_positive check (amount > 0),
  constraint capital_deployment_category_valid check (
    category in (
      'growth_capex','maintenance_capex','working_capital','product_development',
      'strategic_investment','debt_repayment','owner_distribution'
    )
  )
);

create index if not exists capital_deployment_currency_time_idx
  on capital_deployment_entries (currency, occurred_at);
create index if not exists capital_deployment_category_time_idx
  on capital_deployment_entries (category, currency, occurred_at);
create index if not exists capital_deployment_active_time_idx
  on capital_deployment_entries (voided_at, occurred_at);

create table if not exists financial_evidence_attestations (
  id varchar primary key default gen_random_uuid(),
  currency varchar(3) not null,
  evidence_type varchar(40) not null,
  through_at timestamp not null,
  source_reference text not null,
  notes text,
  created_by varchar references users(id) on delete set null,
  voided_at timestamp,
  voided_by varchar references users(id) on delete set null,
  void_reason text,
  created_at timestamp not null default now(),
  constraint financial_evidence_attestation_type_valid check (
    evidence_type in ('operating_expenses_complete','cash_disbursements_complete')
  )
);

create index if not exists financial_evidence_attestation_type_time_idx
  on financial_evidence_attestations (evidence_type, currency, through_at);
create index if not exists financial_evidence_attestation_active_idx
  on financial_evidence_attestations (voided_at, through_at);

create table if not exists capital_hurdle_policies (
  id varchar primary key default gen_random_uuid(),
  currency varchar(3) not null,
  annual_hurdle_rate_pct numeric(7,3) not null,
  effective_from timestamp not null,
  effective_to timestamp,
  rationale text not null,
  approved_by varchar not null references users(id) on delete restrict,
  approved_at timestamp not null,
  created_at timestamp not null default now(),
  constraint capital_hurdle_rate_nonnegative check (annual_hurdle_rate_pct >= 0),
  constraint capital_hurdle_period_valid check (effective_to is null or effective_to >= effective_from)
);

create index if not exists capital_hurdle_currency_period_idx
  on capital_hurdle_policies (currency, effective_from, effective_to);

insert into permissions (key, description) values
  ('treasury.evidence.manage', 'Record and correct treasury accounts, balances and cash disbursement evidence'),
  ('roic.evidence.manage', 'Record and correct operating expense, tax and invested-capital evidence'),
  ('capital.deployment.manage', 'Record and correct approved capital deployment evidence'),
  ('capital.hurdle.approve', 'Approve explicit company capital hurdle rates used for ROIC spread decisions')
on conflict (key) do update set description = excluded.description;

insert into role_permissions (role_id, permission_id)
select roles.id, permissions.id
from roles cross join permissions
where roles.key in ('super_administrator','administrator')
  and permissions.key in (
    'treasury.evidence.manage',
    'roic.evidence.manage',
    'capital.deployment.manage',
    'capital.hurdle.approve'
  )
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select roles.id, permissions.id
from roles cross join permissions
where roles.key = 'finance_manager'
  and permissions.key in (
    'treasury.evidence.manage',
    'roic.evidence.manage',
    'capital.deployment.manage'
  )
on conflict do nothing;
