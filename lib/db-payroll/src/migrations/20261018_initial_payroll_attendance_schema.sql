-- =====================================================================
-- SUNRISE PAYROLL & ATTENDANCE SYSTEM
-- Master Schema Migration: Initial Enterprise Setup
-- Database: sunrise_payroll_attendance
-- =====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Organizations & Hotel Properties
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed standard Sunrise properties matching SST legacy system
INSERT INTO properties (name_en, name_ar, code) VALUES
    ('SunRise Head Office', 'المكتب الرئيسي - صن رايز', 'HO'),
    ('SunRise Meraki Sharm', 'صن رايز ميراكي شرم الشيخ', 'MERAKI_SHARM'),
    ('SunRise Diamond', 'صن رايز دايموند بيتش', 'DIAMOND'),
    ('SunRise Crystal Bay Hurghada', 'صن رايز كريستال باي الغردقة', 'CRYSTAL_BAY'),
    ('SunRise Garden Beach Resort', 'صن رايز جاردن بيتش', 'GARDEN_BEACH'),
    ('SunRise Mamlouk Palace', 'صن رايز مملوك بالاس', 'MAMLOUK'),
    ('Aqua Joy By SUNRISE', 'أكوا جوي باي صن رايز', 'AQUA_JOY'),
    ('SunRise Alex Avenue Hotel', 'صن رايز أليكس أفينيو الإسكندرية', 'ALEX_AVENUE'),
    ('SunRise Alma Bay', 'صن رايز ألما باي', 'ALMA_BAY'),
    ('SunRise Montemare Resort', 'صن رايز مونتيماري ريزورت', 'MONTEMARE'),
    ('SunRise Remal Beach Resort', 'صن رايز رمال بيتش', 'REMAL_BEACH')
ON CONFLICT (code) DO NOTHING;

-- 3. Departments & Designations
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    name_en VARCHAR(150) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS designations (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    title_en VARCHAR(150) NOT NULL,
    title_ar VARCHAR(150) NOT NULL,
    grade VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Employees Master Table (supporting Regular and Casual)
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    second_name VARCHAR(100),
    third_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(300) NOT NULL,
    full_name_ar VARCHAR(300),
    national_id VARCHAR(20),
    passport_number VARCHAR(50),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    date_of_birth DATE,
    marital_status VARCHAR(20),
    
    -- Crucial Hotel Distinction: Regular vs Casual
    employment_type VARCHAR(20) NOT NULL DEFAULT 'regular' CHECK (employment_type IN ('regular', 'casual', 'seasonal')),
    
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    designation_id INTEGER REFERENCES designations(id) ON DELETE SET NULL,
    joining_date DATE NOT NULL,
    contract_type VARCHAR(50) DEFAULT 'permanent',
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated', 'resigned')),
    
    -- Biometrics integration link
    biometric_id VARCHAR(50),
    
    -- Bank & Payroll details
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(100),
    iban VARCHAR(50),
    insurance_number VARCHAR(50),
    insurance_salary NUMERIC(12, 2) DEFAULT 0.00,
    is_insured BOOLEAN DEFAULT TRUE,
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_employee_code_property UNIQUE (property_id, employee_code)
);

CREATE INDEX IF NOT EXISTS idx_employees_property_emp_type ON employees(property_id, employment_type);
CREATE INDEX IF NOT EXISTS idx_employees_biometric_id ON employees(biometric_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- 5. Biometric Devices Management
CREATE TABLE IF NOT EXISTS biometric_devices (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    device_name VARCHAR(150) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'zkteco' CHECK (device_type IN ('zkteco', 'hikvision', 'face_id', 'rfid_card', 'other')),
    ip_address VARCHAR(50) NOT NULL,
    port INTEGER DEFAULT 4370,
    device_id VARCHAR(50),
    location VARCHAR(150),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Shifts & Roster Scheduling
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_entry_mins INTEGER DEFAULT 15,
    grace_period_exit_mins INTEGER DEFAULT 15,
    break_duration_mins INTEGER DEFAULT 60,
    working_hours NUMERIC(4, 2) DEFAULT 8.00,
    is_night_shift BOOLEAN DEFAULT FALSE,
    color VARCHAR(20) DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shift_assignments (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shift_assign_emp_dates ON shift_assignments(employee_id, start_date, end_date);

-- 7. Raw Biometric Punch Logs (Frappe HR EmployeeCheckin equivalent)
CREATE TABLE IF NOT EXISTS employee_checkins (
    id BIGSERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    biometric_id VARCHAR(50) NOT NULL,
    punch_time TIMESTAMP WITH TIME ZONE NOT NULL,
    log_type VARCHAR(10) DEFAULT 'AUTO' CHECK (log_type IN ('IN', 'OUT', 'AUTO')),
    device_id INTEGER REFERENCES biometric_devices(id) ON DELETE SET NULL,
    sync_source VARCHAR(30) DEFAULT 'biometric_server' CHECK (sync_source IN ('biometric_server', 'device_push', 'manual', 'usb_import', 'mobile_app')),
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checkins_emp_time ON employee_checkins(employee_id, punch_time);
CREATE INDEX IF NOT EXISTS idx_checkins_unprocessed ON employee_checkins(is_processed) WHERE is_processed = FALSE;

-- 8. Daily Evaluated Attendance
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
    in_time TIMESTAMP WITH TIME ZONE,
    out_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'on_leave', 'rest_day', 'holiday')),
    late_minutes INTEGER DEFAULT 0,
    early_exit_minutes INTEGER DEFAULT 0,
    actual_working_hours NUMERIC(5, 2) DEFAULT 0.00,
    overtime_hours NUMERIC(5, 2) DEFAULT 0.00,
    is_locked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_attendance_emp_date UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date_prop ON attendance_records(property_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- 9. Leaves Management
CREATE TABLE IF NOT EXISTS leave_types (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    is_paid BOOLEAN DEFAULT TRUE,
    max_days_per_year NUMERIC(4, 1) DEFAULT 21.0,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO leave_types (name_en, name_ar, is_paid, max_days_per_year) VALUES
    ('Annual Leave', 'إجازة سنوية اعتيادية', TRUE, 21.0),
    ('Casual Leave', 'إجازة عارضة', TRUE, 6.0),
    ('Sick Leave', 'إجازة مرضية', TRUE, 30.0),
    ('Official Mission', 'مأمورية رسمية', TRUE, 90.0),
    ('Unpaid Leave', 'إجازة بدون مرتب', FALSE, 0.0)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS leave_applications (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4, 1) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Penalties & Disciplinary Actions (SST Legal & Penalties)
CREATE TABLE IF NOT EXISTS penalties (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    incident_date DATE NOT NULL,
    penalty_type VARCHAR(50) NOT NULL CHECK (penalty_type IN ('written_warning', 'salary_deduction_days', 'suspension', 'termination')),
    deduction_days NUMERIC(4, 1) DEFAULT 0.0,
    deduction_amount NUMERIC(10, 2) DEFAULT 0.00,
    reason TEXT NOT NULL,
    investigation_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'appealed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Loans & Advances (SST Loans / Cash Advances)
CREATE TABLE IF NOT EXISTS loans_and_advances (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('loan', 'monthly_advance')),
    total_amount NUMERIC(12, 2) NOT NULL,
    monthly_installment NUMERIC(12, 2) NOT NULL,
    remaining_amount NUMERIC(12, 2) NOT NULL,
    disbursed_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Payroll Engine (SST End Period / Monthly Payroll)
CREATE TABLE IF NOT EXISTS salary_components (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earning', 'deduction')),
    category VARCHAR(50) DEFAULT 'allowance',
    is_taxable BOOLEAN DEFAULT TRUE,
    is_insurance_applicable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO salary_components (name_en, name_ar, code, type, category, is_taxable, is_insurance_applicable) VALUES
    ('Basic Salary', 'الراتب الأساسي', 'BASIC', 'earning', 'basic', TRUE, TRUE),
    ('Housing Allowance', 'بدل سكن نقدي', 'HOUSING_ALLOWANCE', 'earning', 'allowance', TRUE, FALSE),
    ('Transportation Allowance', 'بدل انتقال', 'TRANS_ALLOWANCE', 'earning', 'allowance', TRUE, FALSE),
    ('Food Allowance', 'بدل وجبة / إعاشة', 'FOOD_ALLOWANCE', 'earning', 'allowance', FALSE, FALSE),
    ('Overtime Pay', 'أجر إضافي', 'OVERTIME', 'earning', 'overtime', TRUE, FALSE),
    ('Social Insurance Employee', 'تأمينات اجتماعية (حصة الموظف 11%)', 'INS_EMP', 'deduction', 'insurance', FALSE, FALSE),
    ('Income Tax', 'ضريبة كسب العمل', 'TAX', 'deduction', 'tax', FALSE, FALSE),
    ('Loan Installment', 'قسط سلفة / قرض', 'LOAN_INSTALLMENT', 'deduction', 'loan', FALSE, FALSE),
    ('Disciplinary Deduction', 'خصم جزاءات وتحقيقات', 'PENALTY_DEDUCTION', 'deduction', 'penalty', FALSE, FALSE),
    ('Absence Deduction', 'خصم غياب وتأخير', 'ABSENCE_DEDUCTION', 'deduction', 'attendance', FALSE, FALSE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS payroll_periods (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    period_name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_working_days INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'processing', 'closed', 'locked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_property_payroll_period UNIQUE (property_id, year, month)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id SERIAL PRIMARY KEY,
    payroll_period_id INTEGER NOT NULL REFERENCES payroll_periods(id) ON DELETE RESTRICT,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    employment_type VARCHAR(20) NOT NULL DEFAULT 'regular' CHECK (employment_type IN ('regular', 'casual', 'all')),
    total_employees INTEGER DEFAULT 0,
    total_gross NUMERIC(14, 2) DEFAULT 0.00,
    total_deductions NUMERIC(14, 2) DEFAULT 0.00,
    total_net NUMERIC(14, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_slips (
    id SERIAL PRIMARY KEY,
    payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    payroll_period_id INTEGER NOT NULL REFERENCES payroll_periods(id) ON DELETE RESTRICT,
    
    -- Attendance Days calculation
    total_working_days NUMERIC(4, 1) DEFAULT 30.0,
    present_days NUMERIC(4, 1) DEFAULT 0.0,
    absent_days NUMERIC(4, 1) DEFAULT 0.0,
    leave_days NUMERIC(4, 1) DEFAULT 0.0,
    late_deduction_days NUMERIC(4, 1) DEFAULT 0.0,
    overtime_hours NUMERIC(5, 2) DEFAULT 0.00,
    
    -- Financial breakdown
    basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Egyptian statutory compliance
    social_insurance_employee NUMERIC(10, 2) DEFAULT 0.00,
    social_insurance_company NUMERIC(10, 2) DEFAULT 0.00,
    income_tax NUMERIC(10, 2) DEFAULT 0.00,
    loan_deduction NUMERIC(10, 2) DEFAULT 0.00,
    penalty_deduction NUMERIC(10, 2) DEFAULT 0.00,
    absence_deduction NUMERIC(10, 2) DEFAULT 0.00,
    
    payment_method VARCHAR(20) DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'cheque')),
    bank_account_number VARCHAR(100),
    iban VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_slip_employee_period UNIQUE (employee_id, payroll_period_id)
);

CREATE INDEX IF NOT EXISTS idx_slips_run ON salary_slips(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_slips_emp_period ON salary_slips(employee_id, payroll_period_id);

CREATE TABLE IF NOT EXISTS salary_slip_items (
    id SERIAL PRIMARY KEY,
    salary_slip_id INTEGER NOT NULL REFERENCES salary_slips(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES salary_components(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earning', 'deduction')),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description VARCHAR(200)
);

CREATE INDEX IF NOT EXISTS idx_slip_items_slip ON salary_slip_items(salary_slip_id);
