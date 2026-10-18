-- ============================================================================
-- SUNRISE HRMS ENTERPRISE EXPANSION MIGRATION
-- Database: sunrise_payroll_attendance
-- Idempotent schema additions for all 36 HRMS enterprise modules
-- Zero data loss guaranteed: Only IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- ============================================================================

-- 1. Organization & Master Data
CREATE TABLE IF NOT EXISTS legal_entities (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(250) NOT NULL,
    name_ar VARCHAR(250) NOT NULL,
    commercial_registration_no VARCHAR(100),
    tax_card_no VARCHAR(100),
    social_insurance_office VARCHAR(150),
    social_insurance_no VARCHAR(100),
    registered_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cost_centers (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    legal_entity_id INTEGER REFERENCES legal_entities(id) ON DELETE SET NULL,
    parent_id INTEGER,
    code VARCHAR(50) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    division VARCHAR(50) NOT NULL DEFAULT 'Rooms',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    name_en VARCHAR(150) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_grades (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(150) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    level_order INTEGER NOT NULL DEFAULT 1,
    min_salary NUMERIC(12, 2) DEFAULT 0.00,
    max_salary NUMERIC(12, 2) DEFAULT 0.00,
    service_charge_points NUMERIC(6, 2) DEFAULT 1.00,
    housing_eligibility VARCHAR(50) DEFAULT 'shared',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holiday_calendars (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    holiday_date DATE NOT NULL,
    duration_days INTEGER DEFAULT 1,
    is_religious BOOLEAN DEFAULT FALSE,
    overtime_multiplier NUMERIC(4, 2) DEFAULT 2.00,
    applicable_year INTEGER NOT NULL DEFAULT 2026,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_workflows (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_workflow_steps (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_role VARCHAR(50) NOT NULL,
    approver_user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    is_final_step BOOLEAN DEFAULT FALSE,
    timeout_hours INTEGER DEFAULT 48,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expand employees with HR hierarchy & metadata
ALTER TABLE employees ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_grade_id INTEGER REFERENCES job_grades(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS direct_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(150);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS probation_end_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_location VARCHAR(150);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS military_status VARCHAR(50);

-- 2. Talent Acquisition & Recruitment Pipeline (ATS)
CREATE TABLE IF NOT EXISTS manpower_requisitions (
    id SERIAL PRIMARY KEY,
    requisition_number VARCHAR(50) NOT NULL UNIQUE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    designation_id INTEGER NOT NULL REFERENCES designations(id) ON DELETE RESTRICT,
    required_count INTEGER NOT NULL DEFAULT 1,
    reason_for_request VARCHAR(50) NOT NULL DEFAULT 'replacement',
    budget_status VARCHAR(50) DEFAULT 'budgeted',
    expected_joining_date DATE,
    requested_by_user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    gm_approval_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_vacancies (
    id SERIAL PRIMARY KEY,
    requisition_id INTEGER REFERENCES manpower_requisitions(id) ON DELETE SET NULL,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    title_en VARCHAR(200) NOT NULL,
    title_ar VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    experience_years_min INTEGER DEFAULT 1,
    posted_date DATE NOT NULL,
    closing_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    vacancy_id INTEGER REFERENCES job_vacancies(id) ON DELETE SET NULL,
    full_name VARCHAR(250) NOT NULL,
    full_name_ar VARCHAR(250),
    email VARCHAR(150) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    national_id VARCHAR(30),
    date_of_birth DATE,
    gender VARCHAR(10),
    resume_url TEXT,
    current_position VARCHAR(150),
    expected_salary NUMERIC(12, 2),
    stage VARCHAR(50) NOT NULL DEFAULT 'applied',
    rating INTEGER DEFAULT 0,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_interviews (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    interview_round INTEGER NOT NULL DEFAULT 1,
    interviewer_user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    location_or_link VARCHAR(250),
    technical_score INTEGER DEFAULT 0,
    english_score INTEGER DEFAULT 0,
    appearance_attitude_score INTEGER DEFAULT 0,
    feedback_notes TEXT,
    recommendation VARCHAR(30) DEFAULT 'undecided',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_offers (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    designation_id INTEGER NOT NULL REFERENCES designations(id) ON DELETE RESTRICT,
    basic_salary NUMERIC(12, 2) NOT NULL,
    living_allowance NUMERIC(12, 2) DEFAULT 0.00,
    housing_provided BOOLEAN DEFAULT TRUE,
    transportation_provided BOOLEAN DEFAULT TRUE,
    service_charge_eligible BOOLEAN DEFAULT TRUE,
    offer_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    expected_joining_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    approved_by_user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE SET NULL,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    task_category VARCHAR(50) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    title_ar VARCHAR(200) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    completed_by_user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Core HR Expansions
CREATE TABLE IF NOT EXISTS employee_documents (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    issued_date DATE,
    expiry_date DATE,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by_user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_qualifications (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    education_level VARCHAR(100) NOT NULL,
    institution_name VARCHAR(250) NOT NULL,
    major_or_field VARCHAR(200),
    graduation_year INTEGER,
    grade_or_gpa VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_dependents (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    national_id VARCHAR(30),
    date_of_birth DATE,
    gender VARCHAR(10),
    has_medical_coverage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_history (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    previous_property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    new_property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    previous_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    new_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    previous_designation_id INTEGER REFERENCES designations(id) ON DELETE SET NULL,
    new_designation_id INTEGER REFERENCES designations(id) ON DELETE SET NULL,
    previous_salary NUMERIC(12, 2),
    new_salary NUMERIC(12, 2),
    reason TEXT,
    approved_by_user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_clearances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    resignation_date DATE,
    last_working_day DATE NOT NULL,
    exit_reason VARCHAR(100) NOT NULL,
    is_housing_cleared BOOLEAN DEFAULT FALSE,
    housing_cleared_at TIMESTAMPTZ,
    is_uniform_returned BOOLEAN DEFAULT FALSE,
    is_it_assets_returned BOOLEAN DEFAULT FALSE,
    is_loan_settled BOOLEAN DEFAULT FALSE,
    severance_gratuity_amount NUMERIC(12, 2) DEFAULT 0.00,
    unused_leave_days_encashment NUMERIC(6, 2) DEFAULT 0.00,
    total_final_settlement NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Performance Appraisal & Training (L&D)
CREATE TABLE IF NOT EXISTS appraisal_cycles (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name_en VARCHAR(150) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    applicable_year INTEGER NOT NULL DEFAULT 2026,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appraisal_templates (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(150) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    target_grade_id INTEGER REFERENCES job_grades(id) ON DELETE SET NULL,
    sections_config JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_appraisals (
    id SERIAL PRIMARY KEY,
    cycle_id INTEGER NOT NULL REFERENCES appraisal_cycles(id) ON DELETE RESTRICT,
    template_id INTEGER NOT NULL REFERENCES appraisal_templates(id) ON DELETE RESTRICT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    manager_user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    self_score NUMERIC(5, 2),
    manager_score NUMERIC(5, 2),
    final_score NUMERIC(5, 2),
    performance_band VARCHAR(50),
    strengths TEXT,
    development_needs TEXT,
    recommended_increment_percent NUMERIC(4, 2),
    status VARCHAR(30) NOT NULL DEFAULT 'pending_self',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Hospitality',
    duration_hours INTEGER NOT NULL DEFAULT 4,
    is_mandatory BOOLEAN DEFAULT FALSE,
    validity_months INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_sessions (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE RESTRICT,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    trainer_name VARCHAR(150) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location_venue VARCHAR(200),
    max_capacity INTEGER DEFAULT 25,
    status VARCHAR(30) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_enrollments (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_status VARCHAR(30) DEFAULT 'enrolled',
    pre_test_score INTEGER,
    post_test_score INTEGER,
    certificate_url TEXT,
    certificate_expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix session_id reference in case table was created with camelCase or snake_case
-- 5. General Ledger & Budget Integration (USALI Standard)
CREATE TABLE IF NOT EXISTS payroll_budgets (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    fiscal_year INTEGER NOT NULL DEFAULT 2026,
    fiscal_month INTEGER NOT NULL,
    approved_headcount INTEGER NOT NULL,
    allocated_budget NUMERIC(14, 2) NOT NULL,
    actual_spent NUMERIC(14, 2) DEFAULT 0.00,
    variance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gl_accounts (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    account_name_en VARCHAR(200) NOT NULL,
    account_name_ar VARCHAR(200) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    sub_ledger_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gl_journal_entries (
    id SERIAL PRIMARY KEY,
    payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    voucher_number VARCHAR(100) NOT NULL UNIQUE,
    voucher_date DATE NOT NULL,
    period_label VARCHAR(50) NOT NULL,
    total_debit NUMERIC(14, 2) NOT NULL,
    total_credit NUMERIC(14, 2) NOT NULL,
    is_balanced BOOLEAN NOT NULL DEFAULT TRUE,
    is_exported_to_erp BOOLEAN DEFAULT FALSE,
    exported_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gl_journal_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER NOT NULL REFERENCES gl_journal_entries(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES gl_accounts(id) ON DELETE RESTRICT,
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    description VARCHAR(250) NOT NULL,
    debit_amount NUMERIC(14, 2) DEFAULT 0.00,
    credit_amount NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Employee Services, Occupational Health & Transport
CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    diagnosis TEXT NOT NULL,
    prescription TEXT,
    rest_days_granted INTEGER DEFAULT 0,
    is_work_injury BOOLEAN DEFAULT FALSE,
    doctor_name VARCHAR(150) NOT NULL,
    food_handler_cert_expiry DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_transport_routes (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    route_name_en VARCHAR(150) NOT NULL,
    route_name_ar VARCHAR(150) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(50),
    seating_capacity INTEGER DEFAULT 30,
    departure_time VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_transport_assignments (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES staff_transport_routes(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pickup_point VARCHAR(150) NOT NULL,
    monthly_deduction NUMERIC(8, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foreign_employee_docs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    passport_number VARCHAR(100) NOT NULL,
    passport_expiry_date DATE NOT NULL,
    work_permit_number VARCHAR(100),
    work_permit_expiry_date DATE,
    residency_visa_expiry_date DATE,
    security_clearance_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Document Archives, Audit Logs & Notifications
CREATE TABLE IF NOT EXISTS document_categories (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(150) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    retention_years INTEGER DEFAULT 5,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_storage_records (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES document_categories(id) ON DELETE RESTRICT,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    title VARCHAR(250) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    expiry_date DATE,
    uploaded_by_user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hrms_audit_logs (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES hr_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    ip_address VARCHAR(50),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_notifications (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    target_user_id INTEGER NOT NULL REFERENCES hr_users(id) ON DELETE CASCADE,
    title_en VARCHAR(200) NOT NULL,
    title_ar VARCHAR(200) NOT NULL,
    message_en TEXT NOT NULL,
    message_ar TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info',
    link_url VARCHAR(250),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Useful performance indexes
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(stage);
CREATE INDEX IF NOT EXISTS idx_candidates_vacancy ON candidates(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_employee_docs_emp ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_emp ON employee_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_cycle ON employee_appraisals(cycle_id);
CREATE INDEX IF NOT EXISTS idx_training_enroll_session ON training_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_gl_entries_period ON gl_journal_entries(period_label);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON hrms_audit_logs(action, created_at);
