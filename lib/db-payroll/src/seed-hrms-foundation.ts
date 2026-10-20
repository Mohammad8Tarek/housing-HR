import { payrollPool } from "./index.js";

async function seedFoundationData() {
  console.log("🌱 Seeding HRMS Foundation Master Data into sunrise_payroll_attendance...");
  const client = await payrollPool.connect();

  try {
    await client.query("BEGIN;");

    // 1. Legal Entity
    const legalRes = await client.query(`
      INSERT INTO legal_entities (name_en, name_ar, commercial_registration_no, tax_card_no, social_insurance_office, social_insurance_no, registered_address)
      VALUES 
        ('SUNRISE Resorts & Cruises SAE', 'شركة صن رايز لإدارة المنتجعات والفنادق العائمة ش.م.م', 'EG-CR-892110', 'TR-992-104-5', 'South Sinai Insurance Office', 'INS-772910', 'KM 12 Peace Road, Sharm El Sheikh, South Sinai, Egypt')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `);
    
    // Get legal entity id
    const leRow = await client.query("SELECT id FROM legal_entities LIMIT 1;");
    const legalEntityId = leRow.rows[0]?.id;

    // Get properties
    const propRows = await client.query("SELECT id, code FROM properties;");
    for (const prop of propRows.rows) {
      // 2. Cost Centers per property
      await client.query(`
        INSERT INTO cost_centers (property_id, legal_entity_id, code, name_en, name_ar, division)
        VALUES 
          ($1, $2, 'CC-ROOMS-' || $3, 'Rooms Division', 'قطاع الغرف والإشراف الداخلي', 'Rooms'),
          ($1, $2, 'CC-FB-SRV-' || $3, 'F&B Service', 'الأغذية والمشروبات - الخدمة', 'F&B'),
          ($1, $2, 'CC-FB-PRD-' || $3, 'F&B Production (Kitchen)', 'الأغذية والمشروبات - المطبخ', 'F&B'),
          ($1, $2, 'CC-ENG-' || $3, 'Engineering & POM', 'الهندسة والصيانة', 'POM'),
          ($1, $2, 'CC-AG-' || $3, 'Admin & General (Finance/HR)', 'الإدارة العامة والموارد البشرية والمالية', 'A&G'),
          ($1, $2, 'CC-SALES-' || $3, 'Sales & Marketing', 'المبيعات والتسويق', 'Sales'),
          ($1, $2, 'CC-REC-' || $3, 'Spa & Recreation', 'النادي الصحي والترفيه', 'Rooms')
        ON CONFLICT DO NOTHING;
      `, [prop.id, legalEntityId, prop.code]);
    }

    // 3. Hospitality Job Grades
    await client.query(`
      INSERT INTO job_grades (code, name_en, name_ar, level_order, min_salary, max_salary, service_charge_points, housing_eligibility)
      VALUES 
        ('BAND-1', 'Executive Committee (ExCom / GM)', 'اللجنة التنفيذية والمدير العام', 1, 35000.00, 120000.00, 3.00, 'single'),
        ('BAND-2', 'Department Head (HOD)', 'مدير إدارة وقطاع', 2, 20000.00, 45000.00, 2.00, 'single'),
        ('BAND-3', 'Assistant Head / Supervisor', 'مساعد مدير ومشرف وردية', 3, 10000.00, 22000.00, 1.50, 'shared'),
        ('BAND-4', 'Senior Line Staff', 'موظف أول وفني متخصص', 4, 7000.00, 12000.00, 1.00, 'shared'),
        ('BAND-5', 'Associate / Line Staff', 'موظف خدمات ومعاون', 5, 6000.00, 8500.00, 1.00, 'shared')
      ON CONFLICT (code) DO NOTHING;
    `);

    // 4. Egyptian National & Religious Holidays 2026
    await client.query(`
      INSERT INTO holiday_calendars (name_en, name_ar, holiday_date, duration_days, is_religious, overtime_multiplier, applicable_year)
      VALUES 
        ('Coptic Christmas Day', 'عيد الميلاد المجيد', '2026-01-07', 1, true, 2.00, 2026),
        ('25th January Revolution & Police Day', 'ثورة 25 يناير وعيد الشرطة', '2026-01-25', 1, false, 2.00, 2026),
        ('Eid Al-Fitr (Day 1)', 'عيد الفطر المبارك - اليوم الأول', '2026-03-20', 1, true, 2.00, 2026),
        ('Eid Al-Fitr (Day 2)', 'عيد الفطر المبارك - اليوم الثاني', '2026-03-21', 1, true, 2.00, 2026),
        ('Eid Al-Fitr (Day 3)', 'عيد الفطر المبارك - اليوم الثالث', '2026-03-22', 1, true, 2.00, 2026),
        ('Sinai Liberation Day', 'عيد تحرير سيناء', '2026-04-25', 1, false, 2.00, 2026),
        ('Labor Day', 'عيد العمال', '2026-05-01', 1, false, 2.00, 2026),
        ('Sham El-Nessim', 'عيد شم النسيم', '2026-04-13', 1, false, 2.00, 2026),
        ('Arafat Day', 'وقفة عرفات', '2026-05-26', 1, true, 2.00, 2026),
        ('Eid Al-Adha (Day 1)', 'عيد الأضحى المبارك - اليوم الأول', '2026-05-27', 1, true, 2.00, 2026),
        ('Eid Al-Adha (Day 2)', 'عيد الأضحى المبارك - اليوم الثاني', '2026-05-28', 1, true, 2.00, 2026),
        ('30th June Revolution Day', 'ذكرى ثورة 30 يونيو', '2026-06-30', 1, false, 2.00, 2026),
        ('Islamic New Year (1448 AH)', 'رأس السنة الهجرية', '2026-06-16', 1, true, 2.00, 2026),
        ('23rd July Revolution Day', 'عيد ثورة 23 يوليو', '2026-07-23', 1, false, 2.00, 2026),
        ('Prophet Muhammad Birthday (Mawlid)', 'المولد النبوي الشريف', '2026-08-25', 1, true, 2.00, 2026),
        ('Armed Forces Day (6th October)', 'عيد القوات المسلحة - 6 أكتوبر', '2026-10-06', 1, false, 2.00, 2026)
      ON CONFLICT DO NOTHING;
    `);

    // 5. Training Courses
    await client.query(`
      INSERT INTO training_courses (course_code, name_en, name_ar, category, duration_hours, is_mandatory, validity_months)
      VALUES 
        ('HACCP-101', 'HACCP & Food Safety Level 2', 'سلامة الغذاء ونظام الهاسب المستوى الثاني', 'HACCP', 8, true, 12),
        ('FIRE-SAFE', 'Fire Fighting, Prevention & Emergency Evacuation', 'مكافحة الحرائق والإخلاء في الطوارئ', 'FireSafety', 6, true, 12),
        ('SUN-HOSP', 'SUNRISE Guest Experience & Passion for Service', 'معايير صن رايز للضيافة وخدمة النزلاء الاستثنائية', 'Hospitality', 12, true, 24),
        ('LEAD-HOTEL', 'Hospitality Supervisory Leadership & Team Coaching', 'القيادة الفندقية الإشرافية وتدريب فرق العمل', 'Leadership', 16, false, null)
      ON CONFLICT (course_code) DO NOTHING;
    `);

    // 6. Document Categories
    await client.query(`
      INSERT INTO document_categories (name_en, name_ar, retention_years, is_confidential)
      VALUES 
        ('Identification Documents (National ID / Passport)', 'وثائق الهوية (بطاقة الرقم القومي / جواز السفر)', 10, true),
        ('Hiring File Requirements (Form 1, Military, Criminal)', 'مسوغات التعيين (استمارة 1، الجيش، الفيش الجنائي)', 15, true),
        ('Academic & Professional Certificates', 'الشهادات والمؤهلات الأكاديمية والمهنية', 10, false),
        ('Medical Fitness & Health Certificates (Food Handlers)', 'اللياقة الطبية والشهادات الصحية لمتداولي الأغذية', 5, false),
        ('Contracts & Formal Addenda', 'عقود العمل والملاحق الرسمية', 15, true),
        ('Disciplinary & Clearance Records', 'الجزاءات وإخلاء الطرف وسجلات نهاية الخدمة', 10, true)
      ON CONFLICT DO NOTHING;
    `);

    // 7. Standard Hospitality Chart of Accounts (USALI Standard)
    for (const prop of propRows.rows) {
      await client.query(`
        INSERT INTO gl_accounts (property_id, account_number, account_name_en, account_name_ar, account_type, sub_ledger_code, is_active)
        VALUES 
          ($1, '51010', 'Salaries & Basic Wages', 'مصروف المرتبات والأجور الأساسية', 'expense', 'PAY-BASE', true),
          ($1, '51020', 'Overtime Pay', 'مصروف ساعات العمل الإضافية', 'expense', 'PAY-OT', true),
          ($1, '51030', 'Hotel Service Charge Pool Distribution', 'مصروف توزيع حصة مقابل الخدمة 12%', 'expense', 'PAY-SVC', true),
          ($1, '51040', 'Social Insurance Employer Contribution', 'حصة صاحب العمل في التأمينات الاجتماعية', 'expense', 'PAY-GOSI-ER', true),
          ($1, '51050', 'Employee Housing & Living Allowance', 'بدل سكن وإعاشة الموظفين', 'expense', 'PAY-HOUSE', true),
          ($1, '51060', 'Employee Meal & Uniform Allowance', 'بدلات وجبات وزي عمل', 'expense', 'PAY-MEAL', true),
          ($1, '21010', 'Accrued Payroll & Net Salaries Payable', 'أمانات ورواتب مستحقة الصرف', 'liability', 'PAY-NET-PAYABLE', true),
          ($1, '21020', 'Social Insurance Authority Payable (GOSI)', 'مصلحة التأمينات الاجتماعية الدائنة', 'liability', 'PAY-GOSI-DUE', true),
          ($1, '21030', 'Income Tax & Salary Tax Authority', 'مصلحة الضرائب - كسب العمل', 'liability', 'PAY-TAX-DUE', true),
          ($1, '21040', 'Service Charge Clearing Account', 'حساب تسوية مقابل الخدمة 12%', 'clearing', 'PAY-SVC-CLR', true),
          ($1, '11010', 'Bank Payroll Clearing Account (WPS)', 'حساب بنك الرواتب والتحويلات WPS', 'clearing', 'PAY-BANK-CLR', true)
        ON CONFLICT DO NOTHING;
      `, [prop.id]);
    }

    await client.query("COMMIT;");
    console.log("✅ HRMS Foundation Master Data seeded successfully!");

    const leCount = await client.query("SELECT COUNT(*) FROM legal_entities;");
    const ccCount = await client.query("SELECT COUNT(*) FROM cost_centers;");
    const jgCount = await client.query("SELECT COUNT(*) FROM job_grades;");
    const holCount = await client.query("SELECT COUNT(*) FROM holiday_calendars;");
    const tcCount = await client.query("SELECT COUNT(*) FROM training_courses;");
    const dcCount = await client.query("SELECT COUNT(*) FROM document_categories;");
    const glCount = await client.query("SELECT COUNT(*) FROM gl_accounts;");

    console.log(`📈 Summary:`);
    console.log(`   - Legal Entities: ${leCount.rows[0].count}`);
    console.log(`   - Cost Centers: ${ccCount.rows[0].count}`);
    console.log(`   - Job Grades: ${jgCount.rows[0].count}`);
    console.log(`   - 2026 Holidays: ${holCount.rows[0].count}`);
    console.log(`   - Training Courses: ${tcCount.rows[0].count}`);
    console.log(`   - Document Categories: ${dcCount.rows[0].count}`);
    console.log(`   - GL Accounts: ${glCount.rows[0].count}`);

  } catch (err: any) {
    await client.query("ROLLBACK;");
    console.error("❌ Seeding failed:", err.message);
    throw err;
  } finally {
    client.release();
    await payrollPool.end();
  }
}

seedFoundationData().catch((e) => {
  console.error("Fatal error during seeding:", e);
  process.exit(1);
});
