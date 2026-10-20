import { pgTable, serial, varchar, text, boolean, timestamp, date, time, integer, numeric, jsonb } from "drizzle-orm/pg-core";

// 1. Properties
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 2. Departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  nameEn: varchar("name_en", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }).notNull(),
  code: varchar("code", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 3. Designations
export const designations = pgTable("designations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  titleEn: varchar("title_en", { length: 150 }).notNull(),
  titleAr: varchar("title_ar", { length: 150 }).notNull(),
  grade: varchar("grade", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 4. Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  employeeCode: varchar("employee_code", { length: 50 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  secondName: varchar("second_name", { length: 100 }),
  thirdName: varchar("third_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  fullName: varchar("full_name", { length: 300 }).notNull(),
  fullNameAr: varchar("full_name_ar", { length: 300 }),
  nationalId: varchar("national_id", { length: 20 }),
  passportNumber: varchar("passport_number", { length: 50 }),
  gender: varchar("gender", { length: 10 }),
  dateOfBirth: date("date_of_birth"),
  maritalStatus: varchar("marital_status", { length: 20 }),
  employmentType: varchar("employment_type", { length: 20 }).notNull().default("regular"),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  designationId: integer("designation_id").references(() => designations.id, { onDelete: "set null" }),
  joiningDate: date("joining_date").notNull(),
  contractType: varchar("contract_type", { length: 50 }).default("permanent"),
  status: varchar("status", { length: 30 }).notNull().default("active"),
  biometricId: varchar("biometric_id", { length: 50 }),
  bankName: varchar("bank_name", { length: 100 }),
  bankAccountNumber: varchar("bank_account_number", { length: 100 }),
  iban: varchar("iban", { length: 50 }),
  insuranceNumber: varchar("insurance_number", { length: 50 }),
  insuranceSalary: numeric("insurance_salary", { precision: 12, scale: 2 }).default("0.00"),
  isInsured: boolean("is_insured").default(true),
  baseSalary: numeric("base_salary", { precision: 12, scale: 2 }).notNull().default("0.00"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 150 }),
  address: text("address"),
  sectionId: integer("section_id"),
  jobGradeId: integer("job_grade_id"),
  costCenterId: integer("cost_center_id"),
  directManagerId: integer("direct_manager_id"),
  profilePhotoUrl: text("profile_photo_url"),
  emergencyContactName: varchar("emergency_contact_name", { length: 150 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  emergencyContactRelation: varchar("emergency_contact_relation", { length: 50 }),
  probationEndDate: date("probation_end_date"),
  contractEndDate: date("contract_end_date"),
  workLocation: varchar("work_location", { length: 150 }),
  militaryStatus: varchar("military_status", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 5. Biometric Devices
export const biometricDevices = pgTable("biometric_devices", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  deviceName: varchar("device_name", { length: 150 }).notNull(),
  deviceType: varchar("device_type", { length: 50 }).default("zkteco"),
  ipAddress: varchar("ip_address", { length: 50 }).notNull(),
  port: integer("port").default(4370),
  deviceId: varchar("device_id", { length: 50 }),
  location: varchar("location", { length: 150 }),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 6. Shifts
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  gracePeriodEntryMins: integer("grace_period_entry_mins").default(15),
  gracePeriodExitMins: integer("grace_period_exit_mins").default(15),
  breakDurationMins: integer("break_duration_mins").default(60),
  workingHours: numeric("working_hours", { precision: 4, scale: 2 }).default("8.00"),
  isNightShift: boolean("is_night_shift").default(false),
  color: varchar("color", { length: 20 }).default("#3b82f6"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 7. Shift Assignments
export const shiftAssignments = pgTable("shift_assignments", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  shiftId: integer("shift_id").notNull().references(() => shifts.id, { onDelete: "restrict" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 8. Raw Employee Checkins (Biometric Punches)
export const employeeCheckins = pgTable("employee_checkins", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }),
  biometricId: varchar("biometric_id", { length: 50 }).notNull(),
  punchTime: timestamp("punch_time", { withTimezone: true }).notNull(),
  logType: varchar("log_type", { length: 10 }).default("AUTO"),
  deviceId: integer("device_id").references(() => biometricDevices.id, { onDelete: "set null" }),
  syncSource: varchar("sync_source", { length: 30 }).default("biometric_server"),
  isProcessed: boolean("is_processed").default(false),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 9. Daily Attendance Records
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  attendanceDate: date("attendance_date").notNull(),
  shiftId: integer("shift_id").references(() => shifts.id, { onDelete: "set null" }),
  inTime: timestamp("in_time", { withTimezone: true }),
  outTime: timestamp("out_time", { withTimezone: true }),
  status: varchar("status", { length: 20 }).notNull().default("present"),
  lateMinutes: integer("late_minutes").default(0),
  earlyExitMinutes: integer("early_exit_minutes").default(0),
  actualWorkingHours: numeric("actual_working_hours", { precision: 5, scale: 2 }).default("0.00"),
  overtimeHours: numeric("overtime_hours", { precision: 5, scale: 2 }).default("0.00"),
  isLocked: boolean("is_locked").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 10. Leave Types & Applications
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  isPaid: boolean("is_paid").default(true),
  maxDaysPerYear: numeric("max_days_per_year", { precision: 4, scale: 1 }).default("21.0"),
  isActive: boolean("is_active").default(true),
});

export const leaveApplications = pgTable("leave_applications", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leaveTypeId: integer("leave_type_id").notNull().references(() => leaveTypes.id, { onDelete: "restrict" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: numeric("total_days", { precision: 4, scale: 1 }).notNull(),
  reason: text("reason"),
  replacementEmployeeId: integer("replacement_employee_id"),
  deptApprovalStatus: varchar("dept_approval_status", { length: 20 }).default("pending"),
  deptApprovedBy: varchar("dept_approved_by", { length: 100 }),
  deptApprovedAt: timestamp("dept_approved_at", { withTimezone: true }),
  deptComment: text("dept_comment"),
  hrApprovalStatus: varchar("hr_approval_status", { length: 20 }).default("pending"),
  hrApprovedBy: varchar("hr_approved_by", { length: 100 }),
  hrApprovedAt: timestamp("hr_approved_at", { withTimezone: true }),
  hrComment: text("hr_comment"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  approvedBy: varchar("approved_by", { length: 100 }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  returnNotificationRequired: boolean("return_notification_required").default(false),
  returnNotifiedAt: timestamp("return_notified_at", { withTimezone: true }),
  returnNotifiedBy: varchar("return_notified_by", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 11. Penalties
export const penalties = pgTable("penalties", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  incidentDate: date("incident_date").notNull(),
  penaltyType: varchar("penalty_type", { length: 50 }).notNull(),
  deductionDays: numeric("deduction_days", { precision: 4, scale: 1 }).default("0.0"),
  deductionAmount: numeric("deduction_amount", { precision: 10, scale: 2 }).default("0.00"),
  reason: text("reason").notNull(),
  investigationNumber: varchar("investigation_number", { length: 100 }),
  status: varchar("status", { length: 20 }).default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 12. Loans & Advances
export const loansAndAdvances = pgTable("loans_and_advances", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  requestType: varchar("request_type", { length: 20 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  monthlyInstallment: numeric("monthly_installment", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull(),
  disbursedDate: date("disbursed_date").notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 13. Salary Components
export const salaryComponents = pgTable("salary_components", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }).default("allowance"),
  isTaxable: boolean("is_taxable").default(true),
  isInsuranceApplicable: boolean("is_insurance_applicable").default(true),
  isActive: boolean("is_active").default(true),
});

// 14. Payroll Periods & Runs
export const payrollPeriods = pgTable("payroll_periods", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  periodName: varchar("period_name", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalWorkingDays: integer("total_working_days").default(30),
  status: varchar("status", { length: 20 }).default("open"),
  transactionsClosedAt: timestamp("transactions_closed_at", { withTimezone: true }),
  transactionsClosedBy: varchar("transactions_closed_by", { length: 100 }),
  isTransactionClosed: boolean("is_transaction_closed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const payrollRuns = pgTable("payroll_runs", {
  id: serial("id").primaryKey(),
  payrollPeriodId: integer("payroll_period_id").notNull().references(() => payrollPeriods.id, { onDelete: "restrict" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  employmentType: varchar("employment_type", { length: 20 }).notNull().default("regular"),
  totalEmployees: integer("total_employees").default(0),
  totalGross: numeric("total_gross", { precision: 14, scale: 2 }).default("0.00"),
  totalDeductions: numeric("total_deductions", { precision: 14, scale: 2 }).default("0.00"),
  totalNet: numeric("total_net", { precision: 14, scale: 2 }).default("0.00"),
  status: varchar("status", { length: 20 }).default("draft"),
  approvedBy: varchar("approved_by", { length: 100 }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 15. Salary Slips
export const salarySlips = pgTable("salary_slips", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  payrollPeriodId: integer("payroll_period_id").notNull().references(() => payrollPeriods.id, { onDelete: "restrict" }),
  totalWorkingDays: numeric("total_working_days", { precision: 4, scale: 1 }).default("30.0"),
  presentDays: numeric("present_days", { precision: 4, scale: 1 }).default("0.0"),
  absentDays: numeric("absent_days", { precision: 4, scale: 1 }).default("0.0"),
  leaveDays: numeric("leave_days", { precision: 4, scale: 1 }).default("0.0"),
  lateDeductionDays: numeric("late_deduction_days", { precision: 4, scale: 1 }).default("0.0"),
  overtimeHours: numeric("overtime_hours", { precision: 5, scale: 2 }).default("0.00"),
  basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalEarnings: numeric("total_earnings", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalDeductions: numeric("total_deductions", { precision: 12, scale: 2 }).notNull().default("0.00"),
  netSalary: numeric("net_salary", { precision: 12, scale: 2 }).notNull().default("0.00"),
  socialInsuranceEmployee: numeric("social_insurance_employee", { precision: 10, scale: 2 }).default("0.00"),
  socialInsuranceCompany: numeric("social_insurance_company", { precision: 10, scale: 2 }).default("0.00"),
  incomeTax: numeric("income_tax", { precision: 10, scale: 2 }).default("0.00"),
  loanDeduction: numeric("loan_deduction", { precision: 10, scale: 2 }).default("0.00"),
  penaltyDeduction: numeric("penalty_deduction", { precision: 10, scale: 2 }).default("0.00"),
  absenceDeduction: numeric("absence_deduction", { precision: 10, scale: 2 }).default("0.00"),
  paymentMethod: varchar("payment_method", { length: 20 }).default("bank_transfer"),
  bankAccountNumber: varchar("bank_account_number", { length: 100 }),
  iban: varchar("iban", { length: 50 }),
  status: varchar("status", { length: 20 }).default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const salarySlipItems = pgTable("salary_slip_items", {
  id: serial("id").primaryKey(),
  salarySlipId: integer("salary_slip_id").notNull().references(() => salarySlips.id, { onDelete: "cascade" }),
  componentId: integer("component_id").notNull().references(() => salaryComponents.id, { onDelete: "restrict" }),
  type: varchar("type", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  description: varchar("description", { length: 200 }),
});

// 16. Dedicated HR / System Users
export const hrUsers = pgTable("hr_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 150 }),
  role: varchar("role", { length: 50 }).notNull().default("officer"),
  systemAccess: varchar("system_access", { length: 30 }).notNull().default("both"),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  permissions: jsonb("permissions"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 17. Service Charge & Tronc (12% فندقية)
export const serviceChargePools = pgTable("service_charge_pools", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  payrollPeriodId: integer("payroll_period_id").notNull().references(() => payrollPeriods.id, { onDelete: "restrict" }),
  totalServiceAmount: numeric("total_service_amount", { precision: 14, scale: 2 }).notNull().default("0.00"),
  hotelSharePercent: numeric("hotel_share_percent", { precision: 5, scale: 2 }).default("15.00"),
  staffDistributableAmount: numeric("staff_distributable_amount", { precision: 14, scale: 2 }).notNull().default("0.00"),
  previousMonthCredit: numeric("previous_month_credit", { precision: 14, scale: 2 }).default("0.00"),
  extraPercent: numeric("extra_percent", { precision: 5, scale: 2 }).default("0.00"),
  nonGuestTotal: numeric("non_guest_total", { precision: 14, scale: 2 }).default("0.00"),
  guestTotal: numeric("guest_total", { precision: 14, scale: 2 }).default("0.00"),
  totalPoints: numeric("total_points", { precision: 10, scale: 2 }).notNull().default("0.00"),
  pointValue: numeric("point_value", { precision: 10, scale: 4 }).notNull().default("0.00"),
  status: varchar("status", { length: 30 }).default("draft"),
  approvedBy: varchar("approved_by", { length: 150 }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const serviceChargeItems = pgTable("service_charge_items", {
  id: serial("id").primaryKey(),
  poolId: integer("pool_id").notNull().references(() => serviceChargePools.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  designationPoints: numeric("designation_points", { precision: 6, scale: 2 }).notNull().default("1.00"),
  workedDaysRatio: numeric("worked_days_ratio", { precision: 5, scale: 4 }).notNull().default("1.0000"),
  finalPoints: numeric("final_points", { precision: 8, scale: 4 }).notNull().default("1.0000"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 18. Banking WPS Configs & Batches
export const bankWpsConfigs = pgTable("bank_wps_configs", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  companyBankCode: varchar("company_bank_code", { length: 50 }),
  companyAccountNumber: varchar("company_account_number", { length: 50 }).notNull(),
  companyIban: varchar("company_iban", { length: 50 }),
  fileFormat: varchar("file_format", { length: 20 }).default("EXCEL_XLSX"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const bankWpsBatches = pgTable("bank_wps_batches", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  bankConfigId: integer("bank_config_id").notNull().references(() => bankWpsConfigs.id, { onDelete: "restrict" }),
  batchReference: varchar("batch_reference", { length: 100 }).notNull(),
  totalEmployees: integer("total_employees").notNull().default(0),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0.00"),
  status: varchar("status", { length: 30 }).default("generated"),
  fileName: varchar("file_name", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 19. Loan Installments
export const loanInstallments = pgTable("loan_installments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loansAndAdvances.id, { onDelete: "cascade" }),
  installmentNumber: integer("installment_number").notNull(),
  dueDate: date("due_date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  payrollPeriodId: integer("payroll_period_id").references(() => payrollPeriods.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 20. Rest Day Credits (بدلات الراحة)
export const restDayCredits = pgTable("rest_day_credits", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  earnedDate: date("earned_date").notNull(),
  reason: varchar("reason", { length: 200 }).notNull(),
  creditDays: numeric("credit_days", { precision: 4, scale: 1 }).default("1.0"),
  status: varchar("status", { length: 30 }).default("available"),
  takenDate: date("taken_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 21. Device Sync Logs
export const deviceSyncLogs = pgTable("device_sync_logs", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().references(() => biometricDevices.id, { onDelete: "cascade" }),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  recordsCount: integer("records_count").default(0),
  latencyMs: integer("latency_ms"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 22. Attendance Monthly Summaries
export const attendanceMonthlySummaries = pgTable("attendance_monthly_summaries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  payrollPeriodId: integer("payroll_period_id").notNull().references(() => payrollPeriods.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  calendarDays: integer("calendar_days").notNull().default(30),
  workedDays: numeric("worked_days", { precision: 4, scale: 1 }).notNull().default("0.0"),
  restDays: numeric("rest_days", { precision: 4, scale: 1 }).notNull().default("0.0"),
  paidLeaveDays: numeric("paid_leave_days", { precision: 4, scale: 1 }).notNull().default("0.0"),
  unpaidLeaveDays: numeric("unpaid_leave_days", { precision: 4, scale: 1 }).notNull().default("0.0"),
  absentDays: numeric("absent_days", { precision: 4, scale: 1 }).notNull().default("0.0"),
  lateMinutes: integer("late_minutes").notNull().default(0),
  lateDeductionDays: numeric("late_deduction_days", { precision: 4, scale: 1 }).notNull().default("0.0"),
  overtimeNormalHours: numeric("overtime_normal_hours", { precision: 6, scale: 2 }).notNull().default("0.00"),
  overtimeNightHours: numeric("overtime_night_hours", { precision: 6, scale: 2 }).notNull().default("0.00"),
  overtimeHolidayHours: numeric("overtime_holiday_hours", { precision: 6, scale: 2 }).notNull().default("0.00"),
  netPayableDays: numeric("net_payable_days", { precision: 4, scale: 1 }).notNull().default("0.0"),
  status: varchar("status", { length: 30 }).default("draft"),
  syncedToPayrollAt: timestamp("synced_to_payroll_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════
// 23. ORGANIZATION & MASTER DATA
// ═══════════════════════════════════════════════════════════════════════

// 23.1 Legal Entities (Corporate holding and operating companies)
export const legalEntities = pgTable("legal_entities", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 250 }).notNull(),
  nameAr: varchar("name_ar", { length: 250 }).notNull(),
  commercialRegistrationNo: varchar("commercial_registration_no", { length: 100 }),
  taxCardNo: varchar("tax_card_no", { length: 100 }),
  socialInsuranceOffice: varchar("social_insurance_office", { length: 150 }),
  socialInsuranceNo: varchar("social_insurance_no", { length: 100 }),
  registeredAddress: text("registered_address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 23.2 Cost Centers (USALI Standard for Hotel Group)
export const costCenters = pgTable("cost_centers", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  legalEntityId: integer("legal_entity_id").references(() => legalEntities.id, { onDelete: "set null" }),
  parentId: integer("parent_id"),
  code: varchar("code", { length: 50 }).notNull(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  division: varchar("division", { length: 50 }).notNull().default("Rooms"), // Rooms, F&B, A&G, POM, Sales
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 23.3 Department Sections
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  costCenterId: integer("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  nameEn: varchar("name_en", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }).notNull(),
  code: varchar("code", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 23.4 Hospitality Job Grades & Bands
export const jobGrades = pgTable("job_grades", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }).notNull(),
  levelOrder: integer("level_order").notNull().default(1),
  minSalary: numeric("min_salary", { precision: 12, scale: 2 }).default("0.00"),
  maxSalary: numeric("max_salary", { precision: 12, scale: 2 }).default("0.00"),
  serviceChargePoints: numeric("service_charge_points", { precision: 6, scale: 2 }).default("1.00"),
  housingEligibility: varchar("housing_eligibility", { length: 50 }).default("shared"), // single, shared, family, allowance
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 23.5 Holiday Calendars (Egyptian National & Religious Holidays)
export const holidayCalendars = pgTable("holiday_calendars", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  holidayDate: date("holiday_date").notNull(),
  durationDays: integer("duration_days").default(1),
  isReligious: boolean("is_religious").default(false),
  overtimeMultiplier: numeric("overtime_multiplier", { precision: 4, scale: 2 }).default("2.00"),
  applicableYear: integer("applicable_year").notNull().default(2026),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 23.6 Approval Workflows
export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  workflowType: varchar("workflow_type", { length: 50 }).notNull(), // leave, loan, resignation, promotion, requisition
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 23.7 Approval Workflow Steps
export const approvalWorkflowSteps = pgTable("approval_workflow_steps", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => approvalWorkflows.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  approverRole: varchar("approver_role", { length: 50 }).notNull(), // dept_head, hr_officer, hr_manager, financial_controller, gm
  approverUserId: integer("approver_user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  isFinalStep: boolean("is_final_step").default(false),
  timeoutHours: integer("timeout_hours").default(48),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════
// 24. TALENT ACQUISITION & RECRUITMENT PIPELINE
// ═══════════════════════════════════════════════════════════════════════

// 24.1 Manpower Requisitions
export const manpowerRequisitions = pgTable("manpower_requisitions", {
  id: serial("id").primaryKey(),
  requisitionNumber: varchar("requisition_number", { length: 50 }).notNull().unique(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  departmentId: integer("department_id").notNull().references(() => departments.id, { onDelete: "restrict" }),
  designationId: integer("designation_id").notNull().references(() => designations.id, { onDelete: "restrict" }),
  requiredCount: integer("required_count").notNull().default(1),
  reasonForRequest: varchar("reason_for_request", { length: 50 }).notNull().default("replacement"), // replacement, expansion, seasonal
  budgetStatus: varchar("budget_status", { length: 50 }).default("budgeted"),
  expectedJoiningDate: date("expected_joining_date"),
  requestedByUserId: integer("requested_by_user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  status: varchar("status", { length: 30 }).notNull().default("draft"), // draft, pending_gm, approved, rejected, fulfilled
  gmApprovalDate: timestamp("gm_approval_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 24.2 Job Vacancies
export const jobVacancies = pgTable("job_vacancies", {
  id: serial("id").primaryKey(),
  requisitionId: integer("requisition_id").references(() => manpowerRequisitions.id, { onDelete: "set null" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  titleEn: varchar("title_en", { length: 200 }).notNull(),
  titleAr: varchar("title_ar", { length: 200 }).notNull(),
  description: text("description"),
  requirements: text("requirements"),
  experienceYearsMin: integer("experience_years_min").default(1),
  postedDate: date("posted_date").notNull(),
  closingDate: date("closing_date"),
  status: varchar("status", { length: 30 }).notNull().default("open"), // open, closed, on_hold
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 24.3 Candidates (ATS)
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  vacancyId: integer("vacancy_id").references(() => jobVacancies.id, { onDelete: "set null" }),
  fullName: varchar("full_name", { length: 250 }).notNull(),
  fullNameAr: varchar("full_name_ar", { length: 250 }),
  email: varchar("email", { length: 150 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
  nationalId: varchar("national_id", { length: 30 }),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 10 }),
  resumeUrl: text("resume_url"),
  currentPosition: varchar("current_position", { length: 150 }),
  expectedSalary: numeric("expected_salary", { precision: 12, scale: 2 }),
  stage: varchar("stage", { length: 50 }).notNull().default("applied"), // applied, screened, interviewed, offer_made, hired, rejected
  rating: integer("rating").default(0), // 1-5 stars
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 24.4 Candidate Interviews
export const candidateInterviews = pgTable("candidate_interviews", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  interviewRound: integer("interview_round").notNull().default(1),
  interviewerUserId: integer("interviewer_user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  locationOrLink: varchar("location_or_link", { length: 250 }),
  technicalScore: integer("technical_score").default(0), // 0-100
  englishScore: integer("english_score").default(0),
  appearanceAttitudeScore: integer("appearance_attitude_score").default(0),
  feedbackNotes: text("feedback_notes"),
  recommendation: varchar("recommendation", { length: 30 }).default("undecided"), // hire, second_interview, reject
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 24.5 Job Offers
export const jobOffers = pgTable("job_offers", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id, { onDelete: "restrict" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  designationId: integer("designation_id").notNull().references(() => designations.id, { onDelete: "restrict" }),
  basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }).notNull(),
  livingAllowance: numeric("living_allowance", { precision: 12, scale: 2 }).default("0.00"),
  housingProvided: boolean("housing_provided").default(true),
  transportationProvided: boolean("transportation_provided").default(true),
  serviceChargeEligible: boolean("service_charge_eligible").default(true),
  offerDate: date("offer_date").notNull(),
  validUntil: date("valid_until").notNull(),
  expectedJoiningDate: date("expected_joining_date"),
  status: varchar("status", { length: 30 }).notNull().default("draft"), // draft, sent, accepted, declined
  approvedByUserId: integer("approved_by_user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 24.6 Onboarding Checklists
export const onboardingTasks = pgTable("onboarding_tasks", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "set null" }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  taskCategory: varchar("task_category", { length: 50 }).notNull(), // medical_fit, housing, uniform, it_creds, contract_sign
  titleEn: varchar("title_en", { length: 200 }).notNull(),
  titleAr: varchar("title_ar", { length: 200 }).notNull(),
  isMandatory: boolean("is_mandatory").default(true),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending, in_progress, completed, waived
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedByUserId: integer("completed_by_user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════
// 25. CORE HR EXPANSION TABLES
// ═══════════════════════════════════════════════════════════════════════

// 25.1 Employee Documents (مسوغات التعيين)
export const employeeDocuments = pgTable("employee_documents", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  documentType: varchar("document_type", { length: 50 }).notNull(), // national_id, birth_cert, military_cert, criminal_record, health_cert, graduation_cert, passport
  documentNumber: varchar("document_number", { length: 100 }),
  issuedDate: date("issued_date"),
  expiryDate: date("expiry_date"),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  isVerified: boolean("is_verified").default(false),
  verifiedByUserId: integer("verified_by_user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 25.2 Employee Qualifications
export const employeeQualifications = pgTable("employee_qualifications", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  educationLevel: varchar("education_level", { length: 100 }).notNull(), // high_school, diploma, bachelor, master, phd
  institutionName: varchar("institution_name", { length: 250 }).notNull(),
  majorOrField: varchar("major_or_field", { length: 200 }),
  graduationYear: integer("graduation_year"),
  gradeOrGpa: varchar("grade_or_gpa", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 25.3 Employee Dependents
export const employeeDependents = pgTable("employee_dependents", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  relationship: varchar("relationship", { length: 50 }).notNull(), // spouse, child, parent
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  nationalId: varchar("national_id", { length: 30 }),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 10 }),
  hasMedicalCoverage: boolean("has_medical_coverage").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 25.4 Employee Career History (Promotions, Transfers, Salary Adjustments)
export const employeeHistory = pgTable("employee_history", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  actionType: varchar("action_type", { length: 50 }).notNull(), // promotion, transfer, salary_increment, status_change
  effectiveDate: date("effective_date").notNull(),
  previousPropertyId: integer("previous_property_id").references(() => properties.id, { onDelete: "set null" }),
  newPropertyId: integer("new_property_id").references(() => properties.id, { onDelete: "set null" }),
  previousDepartmentId: integer("previous_department_id").references(() => departments.id, { onDelete: "set null" }),
  newDepartmentId: integer("new_department_id").references(() => departments.id, { onDelete: "set null" }),
  previousDesignationId: integer("previous_designation_id").references(() => designations.id, { onDelete: "set null" }),
  newDesignationId: integer("new_designation_id").references(() => designations.id, { onDelete: "set null" }),
  previousSalary: numeric("previous_salary", { precision: 12, scale: 2 }),
  newSalary: numeric("new_salary", { precision: 12, scale: 2 }),
  reason: text("reason"),
  approvedByUserId: integer("approved_by_user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 25.5 Employee Clearances (End of Service & Exit Protocol)
export const employeeClearances = pgTable("employee_clearances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  resignationDate: date("resignation_date"),
  lastWorkingDay: date("last_working_day").notNull(),
  exitReason: varchar("exit_reason", { length: 100 }).notNull(), // resignation, termination, contract_end, retirement
  isHousingCleared: boolean("is_housing_cleared").default(false),
  housingClearedAt: timestamp("housing_cleared_at", { withTimezone: true }),
  isUniformReturned: boolean("is_uniform_returned").default(false),
  isItAssetsReturned: boolean("is_it_assets_returned").default(false),
  isLoanSettled: boolean("is_loan_settled").default(false),
  severanceGratuityAmount: numeric("severance_gratuity_amount", { precision: 12, scale: 2 }).default("0.00"),
  unusedLeaveDaysEncashment: numeric("unused_leave_days_encashment", { precision: 6, scale: 2 }).default("0.00"),
  totalFinalSettlement: numeric("total_final_settlement", { precision: 12, scale: 2 }).default("0.00"),
  status: varchar("status", { length: 30 }).default("in_progress"), // in_progress, approved, paid, closed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════
// 26. PERFORMANCE APPRAISAL & TRAINING (L&D)
// ═══════════════════════════════════════════════════════════════════════

// 26.1 Appraisal Cycles
export const appraisalCycles = pgTable("appraisal_cycles", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  nameEn: varchar("name_en", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  applicableYear: integer("applicable_year").notNull().default(2026),
  status: varchar("status", { length: 30 }).notNull().default("active"), // draft, active, closed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 26.2 Appraisal Templates
export const appraisalTemplates = pgTable("appraisal_templates", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }).notNull(),
  targetGradeId: integer("target_grade_id").references(() => jobGrades.id, { onDelete: "set null" }),
  sectionsConfig: jsonb("sections_config").notNull().default([]), // array of competencies, weights, questions
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 26.3 Employee Appraisals
export const employeeAppraisals = pgTable("employee_appraisals", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => appraisalCycles.id, { onDelete: "restrict" }),
  templateId: integer("template_id").notNull().references(() => appraisalTemplates.id, { onDelete: "restrict" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  managerUserId: integer("manager_user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  selfScore: numeric("self_score", { precision: 5, scale: 2 }),
  managerScore: numeric("manager_score", { precision: 5, scale: 2 }),
  finalScore: numeric("final_score", { precision: 5, scale: 2 }),
  performanceBand: varchar("performance_band", { length: 50 }), // outstanding, exceeds, meets, needs_improvement
  strengths: text("strengths"),
  developmentNeeds: text("development_needs"),
  recommendedIncrementPercent: numeric("recommended_increment_percent", { precision: 4, scale: 2 }),
  status: varchar("status", { length: 30 }).notNull().default("pending_self"), // pending_self, pending_manager, pending_hr, completed
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 26.4 Training Courses
export const trainingCourses = pgTable("training_courses", {
  id: serial("id").primaryKey(),
  courseCode: varchar("course_code", { length: 50 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull().default("Hospitality"), // HACCP, FireSafety, GuestService, Leadership
  durationHours: integer("duration_hours").notNull().default(4),
  isMandatory: boolean("is_mandatory").default(false),
  validityMonths: integer("validity_months"), // e.g. 12 months for Food Handler
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 26.5 Training Sessions
export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => trainingCourses.id, { onDelete: "restrict" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  trainerName: varchar("trainer_name", { length: 150 }).notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  locationVenue: varchar("location_venue", { length: 200 }),
  maxCapacity: integer("max_capacity").default(25),
  status: varchar("status", { length: 30 }).default("scheduled"), // scheduled, completed, cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 26.6 Training Enrollments
export const trainingEnrollments = pgTable("training_enrollments", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => trainingSessions.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  attendanceStatus: varchar("attendance_status", { length: 30 }).default("enrolled"), // enrolled, attended, absent, excused
  preTestScore: integer("pre_test_score"),
  postTestScore: integer("post_test_score"),
  certificateUrl: text("certificate_url"),
  certificateExpiryDate: date("certificate_expiry_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════
// 27. GENERAL LEDGER & BUDGET INTEGRATION (USALI Standard)
// ═══════════════════════════════════════════════════════════════════════

// 27.1 Payroll Budgets
export const payrollBudgets = pgTable("payroll_budgets", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  departmentId: integer("department_id").notNull().references(() => departments.id, { onDelete: "restrict" }),
  fiscalYear: integer("fiscal_year").notNull().default(2026),
  fiscalMonth: integer("fiscal_month").notNull(), // 1-12
  approvedHeadcount: integer("approved_headcount").notNull(),
  allocatedBudget: numeric("allocated_budget", { precision: 14, scale: 2 }).notNull(),
  actualSpent: numeric("actual_spent", { precision: 14, scale: 2 }).default("0.00"),
  variance: numeric("variance", { precision: 14, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 27.2 GL Chart of Accounts
export const glAccounts = pgTable("gl_accounts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  accountNameEn: varchar("account_name_en", { length: 200 }).notNull(),
  accountNameAr: varchar("account_name_ar", { length: 200 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(), // expense, liability, clearing
  subLedgerCode: varchar("sub_ledger_code", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 27.3 GL Journal Entries (Vouchers)
export const glJournalEntries = pgTable("gl_journal_entries", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
  voucherNumber: varchar("voucher_number", { length: 100 }).notNull().unique(),
  voucherDate: date("voucher_date").notNull(),
  periodLabel: varchar("period_label", { length: 50 }).notNull(),
  totalDebit: numeric("total_debit", { precision: 14, scale: 2 }).notNull(),
  totalCredit: numeric("total_credit", { precision: 14, scale: 2 }).notNull(),
  isBalanced: boolean("is_balanced").notNull().default(true),
  isExportedToErp: boolean("is_exported_to_erp").default(false),
  exportedAt: timestamp("exported_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 27.4 GL Journal Lines
export const glJournalLines = pgTable("gl_journal_lines", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => glJournalEntries.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => glAccounts.id, { onDelete: "restrict" }),
  costCenterId: integer("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  description: varchar("description", { length: 250 }).notNull(),
  debitAmount: numeric("debit_amount", { precision: 14, scale: 2 }).default("0.00"),
  creditAmount: numeric("credit_amount", { precision: 14, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════
// 28. EMPLOYEE SERVICES, OCCUPATIONAL HEALTH & TRANSPORT
// ═══════════════════════════════════════════════════════════════════════

// 28.1 Occupational Health & Clinic Visits
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  visitDate: date("visit_date").notNull(),
  diagnosis: text("diagnosis").notNull(),
  prescription: text("prescription"),
  restDaysGranted: integer("rest_days_granted").default(0),
  isWorkInjury: boolean("is_work_injury").default(false),
  doctorName: varchar("doctor_name", { length: 150 }).notNull(),
  foodHandlerCertExpiry: date("food_handler_cert_expiry"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 28.2 Staff Transportation Routes
export const staffTransportRoutes = pgTable("staff_transport_routes", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  routeNameEn: varchar("route_name_en", { length: 150 }).notNull(),
  routeNameAr: varchar("route_name_ar", { length: 150 }).notNull(),
  vehicleNumber: varchar("vehicle_number", { length: 50 }).notNull(),
  driverName: varchar("driver_name", { length: 100 }),
  driverPhone: varchar("driver_phone", { length: 50 }),
  seatingCapacity: integer("seating_capacity").default(30),
  departureTime: varchar("departure_time", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 28.3 Staff Transportation Assignments
export const staffTransportAssignments = pgTable("staff_transport_assignments", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => staffTransportRoutes.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  pickupPoint: varchar("pickup_point", { length: 150 }).notNull(),
  monthlyDeduction: numeric("monthly_deduction", { precision: 8, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 28.4 Foreign Employee Residency & Work Permits
export const foreignEmployeeDocs = pgTable("foreign_employee_docs", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  passportNumber: varchar("passport_number", { length: 100 }).notNull(),
  passportExpiryDate: date("passport_expiry_date").notNull(),
  workPermitNumber: varchar("work_permit_number", { length: 100 }),
  workPermitExpiryDate: date("work_permit_expiry_date"),
  residencyVisaExpiryDate: date("residency_visa_expiry_date"),
  securityClearanceStatus: varchar("security_clearance_status", { length: 50 }).default("pending"), // pending, cleared, expired
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════
// 29. DOCUMENT ARCHIVES, AUDIT LOGS & NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════

// 29.1 Document Categories Taxonomy
export const documentCategories = pgTable("document_categories", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }).notNull(),
  retentionYears: integer("retention_years").default(5),
  isConfidential: boolean("is_confidential").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 29.2 Central Document Storage Records
export const documentStorageRecords = pgTable("document_storage_records", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => documentCategories.id, { onDelete: "restrict" }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
  title: varchar("title", { length: 250 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  expiryDate: date("expiry_date"),
  uploadedByUserId: integer("uploaded_by_user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 29.3 HRMS Security & Activity Audit Logs
export const hrmsAuditLogs = pgTable("hrms_audit_logs", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => hrUsers.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // LOGIN, SALARY_VIEW, PAYROLL_RUN, LEAVE_APPROVE, WPS_EXPORT
  entityType: varchar("entity_type", { length: 100 }).notNull(), // employee, payroll_run, leave, loan
  entityId: integer("entity_id"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 29.4 System In-App Notifications
export const systemNotifications = pgTable("system_notifications", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  targetUserId: integer("target_user_id").notNull().references(() => hrUsers.id, { onDelete: "cascade" }),
  titleEn: varchar("title_en", { length: 200 }).notNull(),
  titleAr: varchar("title_ar", { length: 200 }).notNull(),
  messageEn: text("message_en").notNull(),
  messageAr: text("message_ar").notNull(),
  notificationType: varchar("notification_type", { length: 50 }).default("info"), // info, warning, approval_pending, expiry
  linkUrl: varchar("link_url", { length: 250 }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 29.5 Supervisor Dual-Key Authorizations (Single-use, short-lived tokens)
export const supervisorAuthorizations = pgTable("supervisor_authorizations", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 120 }).notNull().unique(),
  userId: integer("user_id").notNull().references(() => hrUsers.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: integer("entity_id"),
  isConsumed: boolean("is_consumed").notNull().default(false),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 29.6 Persistent PIN Brute-force Attempt Tracking
export const hrPinAttempts = pgTable("hr_pin_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => hrUsers.id, { onDelete: "cascade" }).unique(),
  username: varchar("username", { length: 100 }).notNull(),
  ipAddress: varchar("ip_address", { length: 50 }).notNull(),
  attempts: integer("attempts").notNull().default(1),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }).defaultNow(),
});

// 30. SST Legacy Parity: Staff Bus Travel Manifests (رحلات أتوبيس العاملين)
export const staffBusManifests = pgTable("staff_bus_manifests", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  tripCode: varchar("trip_code", { length: 50 }).notNull(),
  tripDirection: varchar("trip_direction", { length: 30 }).notNull().default("to_cairo"), // to_cairo, from_cairo, alexandria, other
  travelDate: date("travel_date").notNull(),
  departureTime: varchar("departure_time", { length: 20 }).default("06:00"),
  vehicleNumber: varchar("vehicle_number", { length: 50 }).notNull(),
  driverName: varchar("driver_name", { length: 100 }),
  driverPhone: varchar("driver_phone", { length: 50 }),
  totalSeats: integer("total_seats").default(50),
  status: varchar("status", { length: 30 }).default("scheduled"), // scheduled, in_progress, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const staffBusPassengers = pgTable("staff_bus_passengers", {
  id: serial("id").primaryKey(),
  manifestId: integer("manifest_id").notNull().references(() => staffBusManifests.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
  passengerType: varchar("passenger_type", { length: 30 }).notNull().default("employee"), // employee, escort, guest
  passengerName: varchar("passenger_name", { length: 150 }).notNull(),
  jobTitle: varchar("job_title", { length: 100 }),
  seatNumber: integer("seat_number").notNull(),
  travelDate: date("travel_date").notNull(),
  returnDate: date("return_date"),
  birthDate: date("birth_date"),
  birthPlace: varchar("birth_place", { length: 100 }),
  nationalId: varchar("national_id", { length: 30 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 31. SST Legacy Parity: Yearly Vacations Balance Rollover (ترحيل أرصدة الإجازات السنوي بأوعيتها الـ 4)
export const leaveRolloverPostings = pgTable("leave_rollover_postings", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  annualCarried: numeric("annual_carried", { precision: 5, scale: 1 }).default("0.0"),
  dayoffCarried: numeric("dayoff_carried", { precision: 5, scale: 1 }).default("0.0"),
  holidayCarried: numeric("holiday_carried", { precision: 5, scale: 1 }).default("0.0"),
  fourthCarried: numeric("fourth_carried", { precision: 5, scale: 1 }).default("0.0"),
  maxPostingCap: numeric("max_posting_cap", { precision: 5, scale: 1 }).default("30.0"),
  postedBy: varchar("posted_by", { length: 100 }),
  postedAt: timestamp("posted_at", { withTimezone: true }).defaultNow(),
});

// 32. SST Legacy Parity: Monthly Variable Transactions (الحركات الشهرية المتغيرة ومراكز التكلفة)
export const monthlyTransactions = pgTable("monthly_transactions", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  componentId: integer("component_id").references(() => salaryComponents.id, { onDelete: "restrict" }),
  bandCode: varchar("band_code", { length: 30 }).notNull(),
  calculateBy: varchar("calculate_by", { length: 30 }).notNull().default("amount"), // amount, days, hours, percentage
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  periodMonth: integer("period_month").notNull(),
  periodYear: integer("period_year").notNull(),
  calcNumber: integer("calc_number").notNull().default(1), // 1=Normal, 2=Casuals, 3=Adjustments
  paymentMethod: varchar("payment_method", { length: 30 }).notNull().default("bank"), // bank, cash, cheque
  costCenterId: integer("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  comment: text("comment"),
  status: varchar("status", { length: 30 }).default("pending"), // pending, processed, cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

