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
  notes: text("notes"),
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

