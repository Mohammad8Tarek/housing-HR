-- ==============================================================================
-- SUNRISE HRMS & PAYROLL: SST LEGACY FULL PARITY EXPANSION MIGRATION
-- Migration: 20261020_sst_legacy_parity_expansion.sql
-- Invariant: Zero Data Loss, Strict Idempotency
-- ==============================================================================

-- 1. Staff Bus Travel Manifests (رحلات أتوبيس العاملين إلى ومن القاهرة)
CREATE TABLE IF NOT EXISTS staff_bus_manifests (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    trip_code VARCHAR(50) NOT NULL,
    trip_direction VARCHAR(30) NOT NULL DEFAULT 'to_cairo', -- 'to_cairo', 'from_cairo', 'alexandria', 'other'
    travel_date DATE NOT NULL,
    departure_time VARCHAR(20) DEFAULT '06:00',
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(50),
    total_seats INTEGER DEFAULT 50,
    status VARCHAR(30) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bus_manifests_prop_date ON staff_bus_manifests(property_id, travel_date);
CREATE INDEX IF NOT EXISTS idx_bus_manifests_direction ON staff_bus_manifests(trip_direction);

-- 2. Staff Bus Manifest Passengers (ركاب الأتوبيس وتوزيع المقاعد)
CREATE TABLE IF NOT EXISTS staff_bus_passengers (
    id SERIAL PRIMARY KEY,
    manifest_id INTEGER NOT NULL REFERENCES staff_bus_manifests(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    passenger_type VARCHAR(30) NOT NULL DEFAULT 'employee', -- 'employee', 'escort', 'guest'
    passenger_name VARCHAR(150) NOT NULL,
    job_title VARCHAR(100),
    seat_number INTEGER NOT NULL,
    travel_date DATE NOT NULL,
    return_date DATE,
    birth_date DATE,
    birth_place VARCHAR(100),
    national_id VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_manifest_seat UNIQUE (manifest_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_bus_passengers_manifest ON staff_bus_passengers(manifest_id);
CREATE INDEX IF NOT EXISTS idx_bus_passengers_employee ON staff_bus_passengers(employee_id);

-- 3. Required Return Notification on Leaves (إشعار عودة من إجازة)
ALTER TABLE leave_applications ADD COLUMN IF NOT EXISTS return_notification_required BOOLEAN DEFAULT false;
ALTER TABLE leave_applications ADD COLUMN IF NOT EXISTS return_notified_at TIMESTAMPTZ;
ALTER TABLE leave_applications ADD COLUMN IF NOT EXISTS return_notified_by VARCHAR(100);

-- 4. Yearly Vacations Balance Rollover Postings (ترحيل أرصدة الإجازات السنوي بأوعيتها الأربعة)
CREATE TABLE IF NOT EXISTS leave_rollover_postings (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    annual_carried NUMERIC(5, 1) DEFAULT 0.0,
    dayoff_carried NUMERIC(5, 1) DEFAULT 0.0,
    holiday_carried NUMERIC(5, 1) DEFAULT 0.0,
    fourth_carried NUMERIC(5, 1) DEFAULT 0.0,
    max_posting_cap NUMERIC(5, 1) DEFAULT 30.0,
    posted_by VARCHAR(100),
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_leave_rollover_year_emp UNIQUE (property_id, employee_id, year)
);

CREATE INDEX IF NOT EXISTS idx_leave_rollover_prop_year ON leave_rollover_postings(property_id, year);

-- 5. Monthly Variable Transactions (الحركات الشهرية المتغيرة ومراكز التكلفة البديلة)
CREATE TABLE IF NOT EXISTS monthly_transactions (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES salary_components(id) ON DELETE RESTRICT,
    band_code VARCHAR(30) NOT NULL,
    calculate_by VARCHAR(30) NOT NULL DEFAULT 'amount', -- 'amount', 'days', 'hours', 'percentage'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    calc_number INTEGER NOT NULL DEFAULT 1, -- 1=Normal staff, 2=Casuals, 3=Adjustments
    payment_method VARCHAR(30) NOT NULL DEFAULT 'bank', -- 'bank', 'cash', 'cheque'
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    comment TEXT,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'processed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_trans_period ON monthly_transactions(property_id, period_year, period_month, calc_number);
CREATE INDEX IF NOT EXISTS idx_monthly_trans_emp ON monthly_transactions(employee_id);

-- 6. Service Charge Extensions (عمولة الـ 12% خدمة ورصيد الشهر السابق المنقول)
ALTER TABLE service_charge_pools ADD COLUMN IF NOT EXISTS previous_month_credit NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE service_charge_pools ADD COLUMN IF NOT EXISTS extra_percent NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE service_charge_pools ADD COLUMN IF NOT EXISTS non_guest_total NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE service_charge_pools ADD COLUMN IF NOT EXISTS guest_total NUMERIC(14, 2) DEFAULT 0.00;

-- 7. Payroll Periods Transaction Pre-Lock (إقفال الحركات التمهيدية قبل الاحتساب)
ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS transactions_closed_at TIMESTAMPTZ;
ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS transactions_closed_by VARCHAR(100);
ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS is_transaction_closed BOOLEAN DEFAULT false;
