-- =====================================================================
-- SUNRISE PAYROLL & ATTENDANCE SYSTEM
-- Master Schema Migration: Enterprise Expansion & Dedicated Authentication
-- Database: sunrise_payroll_attendance
-- =====================================================================

-- 1. Dedicated System Users & Role-Based Authentication
CREATE TABLE IF NOT EXISTS hr_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(50) NOT NULL DEFAULT 'officer', -- super_admin, payroll_manager, payroll_specialist, attendance_supervisor, timekeeper, financial_controller
    system_access VARCHAR(30) NOT NULL DEFAULT 'both', -- 'payroll', 'attendance', 'both'
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL, -- NULL means all properties
    permissions JSONB DEFAULT '{"payroll": {"view": true, "create": true, "edit": true, "approve": false}, "attendance": {"view": true, "create": true, "edit": true, "approve": false}}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default initial accounts (Password is 'SunriseHR@2026' hashed with standard bcrypt or pgcrypto)
INSERT INTO hr_users (username, password_hash, full_name, role, system_access, permissions)
VALUES 
    (
        'hr_super_admin',
        crypt('SunriseHR@2026', gen_salt('bf', 10)),
        'Sunrise Enterprise HR Director',
        'super_admin',
        'both',
        '{"payroll": {"view": true, "create": true, "edit": true, "delete": true, "approve": true, "wps_export": true}, "attendance": {"view": true, "create": true, "edit": true, "delete": true, "approve": true, "sync_payroll": true}}'::jsonb
    ),
    (
        'payroll_manager',
        crypt('SunrisePay@2026', gen_salt('bf', 10)),
        'Director of Compensation & Payroll',
        'payroll_manager',
        'payroll',
        '{"payroll": {"view": true, "create": true, "edit": true, "delete": false, "approve": true, "wps_export": true}, "attendance": {"view": true, "create": false, "edit": false, "delete": false, "approve": false, "sync_payroll": false}}'::jsonb
    ),
    (
        'attendance_officer',
        crypt('SunriseAtt@2026', gen_salt('bf', 10)),
        'Head of Timekeeping & Biometrics',
        'attendance_supervisor',
        'attendance',
        '{"payroll": {"view": false, "create": false, "edit": false, "delete": false, "approve": false, "wps_export": false}, "attendance": {"view": true, "create": true, "edit": true, "delete": false, "approve": true, "sync_payroll": true}}'::jsonb
    )
ON CONFLICT (username) DO NOTHING;

-- 2. Service Charge & Tronc (الخدمة الفندقية 12%)
CREATE TABLE IF NOT EXISTS service_charge_pools (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    payroll_period_id INTEGER NOT NULL REFERENCES payroll_periods(id) ON DELETE RESTRICT,
    total_service_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    hotel_share_percent NUMERIC(5, 2) DEFAULT 15.00, -- e.g. 15% breakdown/operating
    staff_distributable_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_points NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    point_value NUMERIC(10, 4) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'draft', -- draft, calculated, approved, disbursed
    approved_by VARCHAR(150),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_charge_items (
    id SERIAL PRIMARY KEY,
    pool_id INTEGER NOT NULL REFERENCES service_charge_pools(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    designation_points NUMERIC(6, 2) NOT NULL DEFAULT 1.00,
    worked_days_ratio NUMERIC(5, 4) NOT NULL DEFAULT 1.0000, -- based on attendance (e.g. 26/30)
    final_points NUMERIC(8, 4) NOT NULL DEFAULT 1.0000,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Banking WPS Integration Configurations (ملفات البنوك الرسمية)
CREATE TABLE IF NOT EXISTS bank_wps_configs (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL, -- NBE (الأهلي), Banque Misr (مصر), CIB, QNB, Meeza
    company_bank_code VARCHAR(50),
    company_account_number VARCHAR(50) NOT NULL,
    company_iban VARCHAR(50),
    file_format VARCHAR(20) DEFAULT 'EXCEL_XLSX', -- EXCEL_XLSX, CSV_PIPE, TXT_FIXED
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed standard Egyptian Hotel Bank Configurations
INSERT INTO bank_wps_configs (property_id, bank_name, company_bank_code, company_account_number, file_format)
SELECT id, 'National Bank of Egypt (NBE)', 'SUN-NBE-01', '1000987654321', 'EXCEL_XLSX'
FROM properties WHERE code = 'MERAKI_SHARM'
ON CONFLICT DO NOTHING;

INSERT INTO bank_wps_configs (property_id, bank_name, company_bank_code, company_account_number, file_format)
SELECT id, 'Banque Misr (BMi)', 'SUN-BMI-01', '2400123456789', 'CSV_PIPE'
FROM properties WHERE code = 'MERAKI_SHARM'
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS bank_wps_batches (
    id SERIAL PRIMARY KEY,
    payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    bank_config_id INTEGER NOT NULL REFERENCES bank_wps_configs(id) ON DELETE RESTRICT,
    batch_reference VARCHAR(100) NOT NULL,
    total_employees INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'generated', -- generated, uploaded_to_bank, confirmed, rejected
    file_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Loan Installments Schedule (جدول أقساط وسداد السلف)
CREATE TABLE IF NOT EXISTS loan_installments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans_and_advances(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payroll_period_id INTEGER REFERENCES payroll_periods(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Hotel Rest-Day Credits (بدلات الراحة الفندقية)
CREATE TABLE IF NOT EXISTS rest_day_credits (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    earned_date DATE NOT NULL,
    reason VARCHAR(200) NOT NULL, -- e.g. "Worked on Official Eid Holiday", "Rest day worked during occupancy surge"
    credit_days NUMERIC(4, 1) DEFAULT 1.0,
    status VARCHAR(30) DEFAULT 'available', -- available, scheduled, taken, expired, paid_in_payroll
    taken_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Biometric Device Command & Fleet Telemetry Logs
CREATE TABLE IF NOT EXISTS device_sync_logs (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES biometric_devices(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- test_ping, pull_punches, sync_users, restart
    status VARCHAR(30) NOT NULL, -- success, failed, in_progress
    records_count INTEGER DEFAULT 0,
    latency_ms INTEGER,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Monthly Attendance Close & Evaluation for Payroll Sync
CREATE TABLE IF NOT EXISTS attendance_monthly_summaries (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    payroll_period_id INTEGER NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    calendar_days INTEGER NOT NULL DEFAULT 30,
    worked_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    rest_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    paid_leave_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    unpaid_leave_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    absent_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    late_minutes INTEGER NOT NULL DEFAULT 0,
    late_deduction_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    overtime_normal_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    overtime_night_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    overtime_holiday_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    net_payable_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    status VARCHAR(30) DEFAULT 'draft', -- draft, reviewed, approved, transferred_to_payroll
    synced_to_payroll_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_period_summary UNIQUE (employee_id, payroll_period_id)
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_hr_users_username ON hr_users(username);
CREATE INDEX IF NOT EXISTS idx_hr_users_system_access ON hr_users(system_access);
CREATE INDEX IF NOT EXISTS idx_service_charge_period ON service_charge_pools(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_bank_wps_runs ON bank_wps_batches(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_loan_installments_due ON loan_installments(due_date, is_paid);
CREATE INDEX IF NOT EXISTS idx_rest_day_credits_emp ON rest_day_credits(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_att_summary_period ON attendance_monthly_summaries(payroll_period_id, property_id);
