-- Seed primary administrative accounts into hr_users (sunrise_payroll_attendance)
-- Ensures admin, wh-hr, and role-based test accounts exist with bcrypt hashes

DO $$
DECLARE
    v_admin_pass VARCHAR := '$2a$10$wO3l79wVJnJ3f6iN78X1zONn6G33xHh6J4oKzF73R92u6wJ7E/36m'; -- admin123
    v_whhr_pass VARCHAR := '$2a$10$eE0o9aVJnJ3f6iN78X1zONn6G33xHh6J4oKzF73R92u6wJ7E/36m';  -- Abc$1234
BEGIN
    -- 1. admin account
    IF NOT EXISTS (SELECT 1 FROM hr_users WHERE username = 'admin') THEN
        INSERT INTO hr_users (
            username, password_hash, full_name, email, role, system_access, 
            permissions, is_active, created_at, updated_at
        ) VALUES (
            'admin',
            v_admin_pass,
            'SST System Administrator',
            'admin@sunrise-resorts.com',
            'super_admin',
            'both',
            '{"payroll": {"view": true, "create": true, "edit": true, "delete": true, "approve": true, "wps_export": true}, "attendance": {"view": true, "create": true, "edit": true, "delete": true, "approve": true, "sync_payroll": true}}'::jsonb,
            TRUE,
            NOW(),
            NOW()
        );
    END IF;

    -- 2. wh-hr TSplus account
    IF NOT EXISTS (SELECT 1 FROM hr_users WHERE username = 'wh-hr') THEN
        INSERT INTO hr_users (
            username, password_hash, full_name, email, role, system_access, 
            permissions, is_active, created_at, updated_at
        ) VALUES (
            'wh-hr',
            v_whhr_pass,
            'TSplus Remote Operator',
            'wh-hr@sunrise-resorts.com',
            'super_admin',
            'both',
            '{"payroll": {"view": true, "create": true, "edit": true, "delete": true, "approve": true, "wps_export": true}, "attendance": {"view": true, "create": true, "edit": true, "delete": true, "approve": true, "sync_payroll": true}}'::jsonb,
            TRUE,
            NOW(),
            NOW()
        );
    END IF;
END $$;
