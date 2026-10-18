import { 
  payrollDb, 
  properties, 
  departments, 
  designations, 
  employees, 
  payrollPeriods, 
  biometricDevices, 
  shifts, 
  shiftAssignments, 
  employeeCheckins, 
  attendanceRecords, 
  leaveTypes,
  serviceChargePools,
  serviceChargeItems,
} from "./index.js";
import { eq } from "drizzle-orm";

export async function seedHotelPayrollData() {
  console.log("🌱 Starting enterprise seed for Sunrise Payroll & Attendance...");

  // Property ID 2 is MERAKI_SHARM, 1 is Head Office
  const propertyId = 2;

  // Cleanup prior seeds for clean idempotent run
  await payrollDb.delete(attendanceRecords).where(eq(attendanceRecords.propertyId, propertyId));
  await payrollDb.delete(employeeCheckins).where(eq(employeeCheckins.propertyId, propertyId));
  await payrollDb.delete(serviceChargeItems);
  await payrollDb.delete(serviceChargePools).where(eq(serviceChargePools.propertyId, propertyId));
  await payrollDb.delete(employees).where(eq(employees.propertyId, propertyId));
  await payrollDb.delete(designations).where(eq(designations.propertyId, propertyId));
  await payrollDb.delete(departments).where(eq(departments.propertyId, propertyId));
  await payrollDb.delete(shifts).where(eq(shifts.propertyId, propertyId));
  await payrollDb.delete(biometricDevices).where(eq(biometricDevices.propertyId, propertyId));
  await payrollDb.delete(payrollPeriods).where(eq(payrollPeriods.propertyId, propertyId));

  // 1. Departments
  const deptList = [
    { nameEn: "Front Office", nameAr: "المكاتب الأمامية والاستقبال", code: "FO" },
    { nameEn: "Housekeeping", nameAr: "الإشراف الداخلي والنظافة", code: "HK" },
    { nameEn: "Food & Beverage", nameAr: "الأغذية والمشروبات", code: "FB" },
    { nameEn: "Kitchen & Culinary", nameAr: "المطابخ والإنتاج الغذائي", code: "KIT" },
    { nameEn: "Engineering & Maintenance", nameAr: "الإدارة الهندسية والصيانة", code: "ENG" },
    { nameEn: "Security & Safety", nameAr: "الأمن والحراسة والسلامة والصحة المهنية", code: "SEC" },
    { nameEn: "Human Resources", nameAr: "الموارد البشرية وشؤون العاملين", code: "HR" },
    { nameEn: "Finance & Accounts", nameAr: "المالية والحسابات العامة", code: "FIN" },
  ];

  const insertedDepts: Record<string, number> = {};
  for (const d of deptList) {
    const [row] = await payrollDb
      .insert(departments)
      .values({ propertyId, nameEn: d.nameEn, nameAr: d.nameAr, code: d.code, isActive: true })
      .returning();
    insertedDepts[d.code] = row.id;
  }
  console.log(`✅ Seeded ${deptList.length} departments.`);

  // 2. Designations
  const desigList = [
    { code: "FO", titleEn: "Front Desk Supervisor", titleAr: "مشرف استقبال", grade: "G6" },
    { code: "FO", titleEn: "Guest Service Agent", titleAr: "موظف استقبال وتسكين", grade: "G4" },
    { code: "HK", titleEn: "Housekeeping Supervisor", titleAr: "مشرف غرف وأدوار", grade: "G5" },
    { code: "HK", titleEn: "Room Attendant", titleAr: "مضيف غرف وعامل نظافة", grade: "G3" },
    { code: "FB", titleEn: "Restaurant Captain", titleAr: "كابتن مطعم فندقي", grade: "G5" },
    { code: "FB", titleEn: "Food Server / Waiter", titleAr: "مقدم أطعمة ومشروبات", grade: "G3" },
    { code: "KIT", titleEn: "Chef de Partie", titleAr: "شيف قسم ساخن", grade: "G6" },
    { code: "KIT", titleEn: "Commis Chef", titleAr: "مساعد شيف ومجهز أطعمة", grade: "G3" },
    { code: "ENG", titleEn: "Maintenance Engineer", titleAr: "مهندس صيانة فندقية", grade: "G7" },
    { code: "ENG", titleEn: "HVAC Technician", titleAr: "فني تبريد وتكييف مركزي", grade: "G4" },
    { code: "SEC", titleEn: "Security Supervisor", titleAr: "مشرف أمن وحراسة", grade: "G5" },
    { code: "SEC", titleEn: "Security Guard", titleAr: "فرد أمن وحراسة بوابات", grade: "G3" },
  ];

  const insertedDesigs: any[] = [];
  for (const des of desigList) {
    const deptId = insertedDepts[des.code];
    const [row] = await payrollDb
      .insert(designations)
      .values({
        propertyId,
        departmentId: deptId,
        titleEn: des.titleEn,
        titleAr: des.titleAr,
        grade: des.grade,
        isActive: true,
      })
      .returning();
    insertedDesigs.push(row);
  }
  console.log(`✅ Seeded ${insertedDesigs.length} job titles.`);

  // 3. Employees (20 Realistic Hotel Employees)
  const staffList = [
    {
      code: "EMP-1001",
      first: "Mahmoud", last: "Abdelaziz", ar: "محمود عبدالعزيز الديب",
      natId: "28805121402319", dob: "1988-05-12",
      sal: "14500.00", insSal: "9500.00",
      bank: "CIB", acc: "100048291048", iban: "EG3800100048291048000000000",
      bio: "1001", dept: "FO", phone: "01098234121", email: "mahmoud.abdelaziz@sunrise-resorts.com"
    },
    {
      code: "EMP-1002",
      first: "Tarek", last: "Ibrahim", ar: "طارق إبراهيم خليل",
      natId: "29208151201948", dob: "1992-08-15",
      sal: "9800.00", insSal: "7200.00",
      bank: "NBE", acc: "192837461928", iban: "EG120003019283746192800000",
      bio: "1002", dept: "FO", phone: "01123847291", email: "tarek.ibrahim@sunrise-resorts.com"
    },
    {
      code: "EMP-1003",
      first: "Sayed", last: "Mostafa", ar: "سيد مصطفى النجار",
      natId: "28511202103847", dob: "1985-11-20",
      sal: "11200.00", insSal: "8000.00",
      bank: "Banque Misr", acc: "384729104829", iban: "EG84000203847291048290000",
      bio: "1003", dept: "HK", phone: "01283746281", email: "sayed.mostafa@sunrise-resorts.com"
    },
    {
      code: "EMP-1004",
      first: "Ahmed", last: "Hassan", ar: "أحمد حسن البنا",
      natId: "29503141602938", dob: "1995-03-14",
      sal: "7800.00", insSal: "6000.00",
      bank: "NBE", acc: "472819384729", iban: "EG120003047281938472900000",
      bio: "1004", dept: "HK", phone: "01038472918", email: "ahmed.hassan@sunrise-resorts.com"
    },
    {
      code: "EMP-1005",
      first: "Karim", last: "Mansour", ar: "كريم منصور غانم",
      natId: "29007221402837", dob: "1990-07-22",
      sal: "12500.00", insSal: "8800.00",
      bank: "CIB", acc: "293847192837", iban: "EG380010029384719283700000",
      bio: "1005", dept: "FB", phone: "01148293748", email: "karim.mansour@sunrise-resorts.com"
    },
    {
      code: "EMP-1006",
      first: "Youssef", last: "El-Sayed", ar: "يوسف السيد الشاذلي",
      natId: "29709181203849", dob: "1997-09-18",
      sal: "8200.00", insSal: "6200.00",
      bank: "NBE", acc: "928374619283", iban: "EG120003092837461928300000",
      bio: "1006", dept: "FB", phone: "01237461928", email: "youssef.elsayed@sunrise-resorts.com"
    },
    {
      code: "EMP-1007",
      first: "Ashraf", last: "Gaber", ar: "أشرف جابر متولي",
      natId: "28304192102837", dob: "1983-04-19",
      sal: "18500.00", insSal: "11500.00",
      bank: "CIB", acc: "938472918273", iban: "EG380010093847291827300000",
      bio: "1007", dept: "KIT", phone: "01048291038", email: "ashraf.gaber@sunrise-resorts.com"
    },
    {
      code: "EMP-1008",
      first: "Mina", last: "Bishoy", ar: "مينا بيشوي صليب",
      natId: "29406121403928", dob: "1994-06-12",
      sal: "8900.00", insSal: "6500.00",
      bank: "Banque Misr", acc: "837461928374", iban: "EG84000208374619283740000",
      bio: "1008", dept: "KIT", phone: "01183746281", email: "mina.bishoy@sunrise-resorts.com"
    },
    {
      code: "EMP-1009",
      first: "Hany", last: "Kamal", ar: "هاني كمال عبدالحميد",
      natId: "28612111503928", dob: "1986-12-11",
      sal: "16800.00", insSal: "11000.00",
      bank: "CIB", acc: "384729182736", iban: "EG380010038472918273600000",
      bio: "1009", dept: "ENG", phone: "01293847281", email: "hany.kamal@sunrise-resorts.com"
    },
    {
      code: "EMP-1010",
      first: "Wael", last: "Samir", ar: "وائل سمير سليمان",
      natId: "29102141802938", dob: "1991-02-14",
      sal: "9500.00", insSal: "7000.00",
      bank: "NBE", acc: "192837465019", iban: "EG120003019283746501900000",
      bio: "1010", dept: "ENG", phone: "01029384719", email: "wael.samir@sunrise-resorts.com"
    },
    {
      code: "EMP-1011",
      first: "Ramy", last: "Fathy", ar: "رامي فتحي رضوان",
      natId: "28909151203948", dob: "1989-09-15",
      sal: "10500.00", insSal: "7500.00",
      bank: "Banque Misr", acc: "472819384019", iban: "EG84000204728193840190000",
      bio: "1011", dept: "SEC", phone: "01138472918", email: "ramy.fathy@sunrise-resorts.com"
    },
    {
      code: "EMP-1012",
      first: "Khaled", last: "Mahmoud", ar: "خالد محمود الشريف",
      natId: "29608101402938", dob: "1996-08-10",
      sal: "7500.00", insSal: "5800.00",
      bank: "NBE", acc: "938472019283", iban: "EG120003093847201928300000",
      bio: "1012", dept: "SEC", phone: "01284729183", email: "khaled.mahmoud@sunrise-resorts.com"
    },
    // Casual Staff
    {
      code: "CAS-2001",
      first: "Mostafa", last: "Nabil", ar: "مصطفى نبيل سالم",
      natId: "29805141203948", dob: "1998-05-14",
      sal: "6000.00", insSal: "0.00",
      bank: "NBE", acc: "839201928374", iban: "EG120003083920192837400000",
      bio: "2001", dept: "FB", phone: "01038471928", email: "mostafa.casual@sunrise-resorts.com",
      employmentType: "casual",
    },
    {
      code: "CAS-2002",
      first: "Ibrahim", last: "Attia", ar: "إبراهيم عطية بركات",
      natId: "29911201402938", dob: "1999-11-20",
      sal: "6000.00", insSal: "0.00",
      bank: "CIB", acc: "192837461029", iban: "EG380010019283746102900000",
      bio: "2002", dept: "KIT", phone: "01193847281", email: "ibrahim.casual@sunrise-resorts.com",
      employmentType: "casual",
    },
  ];

  const createdEmployees: any[] = [];
  for (const s of staffList) {
    const deptId = insertedDepts[s.dept];
    const desig = insertedDesigs.find(d => d.departmentId === deptId);

    const [emp] = await payrollDb
      .insert(employees)
      .values({
        propertyId,
        employeeCode: s.code,
        firstName: s.first,
        lastName: s.last,
        fullName: `${s.first} ${s.last}`,
        fullNameAr: s.ar,
        nationalId: s.natId,
        gender: "male",
        dateOfBirth: s.dob,
        maritalStatus: "married",
        employmentType: s.employmentType || "regular",
        departmentId: deptId,
        designationId: desig?.id || null,
        joiningDate: "2024-01-01",
        contractType: "permanent",
        status: "active",
        biometricId: s.bio,
        bankName: s.bank,
        bankAccountNumber: s.acc,
        iban: s.iban,
        insuranceNumber: `INS-${s.bio}92`,
        insuranceSalary: s.insSal,
        isInsured: s.employmentType !== "casual",
        baseSalary: s.sal,
        phone: s.phone,
        email: s.email,
        isActive: true,
      })
      .returning();
    createdEmployees.push(emp);
  }
  console.log(`✅ Seeded ${createdEmployees.length} employees with Egyptian banking and statutory IDs.`);

  // 4. Payroll Periods (Current & Prior Months)
  const [periodOct] = await payrollDb
    .insert(payrollPeriods)
    .values({
      propertyId,
      periodName: "أكتوبر 2026 - مسير الرواتب والأجور",
      year: 2026,
      month: 10,
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      totalWorkingDays: 30,
      status: "open",
    })
    .returning();
  console.log(`✅ Seeded active payroll period #${periodOct.id}.`);

  // 5. Biometric Devices (TCP/IP Connected Readers)
  const deviceConfigs = [
    { name: "Main Staff Security Gate Reader", ip: "192.168.1.201", port: 4370, model: "ZKTeco uFace 800 (Face & RFID)", loc: "Gate 1 Main Entry" },
    { name: "Staff Restaurant & Canteen Reader", ip: "192.168.1.202", port: 4370, model: "ZKTeco SilkBio-101TC", loc: "Staff Cafeteria" },
    { name: "Housekeeping & Laundry Terminal", ip: "192.168.1.203", port: 4370, model: "Suprema BioEntry W2", loc: "HK Laundry Depot" },
    { name: "Kitchen & F&B Operations Gate", ip: "192.168.1.204", port: 4370, model: "Hikvision DS-K1T671MF", loc: "Main Kitchen Service Corridor" },
  ];

  const createdDevices: any[] = [];
  for (const d of deviceConfigs) {
    const [dev] = await payrollDb
      .insert(biometricDevices)
      .values({
        propertyId,
        deviceName: d.name,
        deviceType: "zkteco",
        ipAddress: d.ip,
        port: d.port,
        deviceId: `DEV-${d.ip.split('.').pop()}`,
        location: d.loc,
        lastSyncAt: new Date(),
        isActive: true,
      })
      .returning();
    createdDevices.push(dev);
  }
  console.log(`✅ Seeded ${createdDevices.length} biometric devices.`);

  // 6. Work Shifts
  const shiftList = [
    { nameEn: "Morning Shift (وردية صباحية)", nameAr: "وردية صباحية", start: "08:00", end: "16:00", color: "#3b82f6" },
    { nameEn: "Evening Shift (وردية مسائية)", nameAr: "وردية مسائية", start: "16:00", end: "00:00", color: "#f59e0b" },
    { nameEn: "Night Shift (وردية ليلية)", nameAr: "وردية ليلية", start: "00:00", end: "08:00", isNight: true, color: "#8b5cf6" },
    { nameEn: "Split Shift (وردية منقسمة مطاعم)", nameAr: "وردية مجزأة للأغذية والمشروبات", start: "11:00", end: "23:00", color: "#10b981" },
  ];

  const createdShifts: any[] = [];
  for (const s of shiftList) {
    const [sh] = await payrollDb
      .insert(shifts)
      .values({
        propertyId,
        nameEn: s.nameEn,
        nameAr: s.nameAr,
        startTime: s.start,
        endTime: s.end,
        gracePeriodEntryMins: 15,
        gracePeriodExitMins: 15,
        breakDurationMins: 60,
        workingHours: "8.00",
        isNightShift: Boolean(s.isNight),
        color: s.color,
        isActive: true,
      })
      .returning();
    createdShifts.push(sh);
  }
  console.log(`✅ Seeded ${createdShifts.length} work shifts.`);

  // 7. Seed Live Raw Punches for Today
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < createdEmployees.length; i++) {
    const emp = createdEmployees[i];
    const dev = createdDevices[i % createdDevices.length];
    
    // In punch: 07:50 - 08:10
    const inHour = 7 + Math.floor(Math.random() * 2);
    const inMin = Math.floor(Math.random() * 59);
    const inTime = new Date(`${today}T0${inHour}:${inMin < 10 ? '0' + inMin : inMin}:00.000Z`);

    await payrollDb.insert(employeeCheckins).values({
      propertyId,
      employeeId: emp.id,
      biometricId: emp.biometricId || String(1000 + i),
      punchTime: inTime,
      logType: "IN",
      deviceId: dev.id,
      syncSource: "biometric_server",
      isProcessed: true,
    });

    // Daily attendance record
    const isLate = inHour >= 8 && inMin > 15;
    await payrollDb.insert(attendanceRecords).values({
      propertyId,
      employeeId: emp.id,
      attendanceDate: today,
      shiftId: createdShifts[0].id,
      inTime,
      outTime: null,
      status: "present",
      lateMinutes: isLate ? inMin - 15 : 0,
      actualWorkingHours: "8.00",
      overtimeHours: "0.00",
    });
  }
  console.log(`✅ Seeded live punches and evaluated attendance for ${createdEmployees.length} staff.`);

  // 8. Seed Service Charge Pool (450,000 EGP)
  const [scPool] = await payrollDb
    .insert(serviceChargePools)
    .values({
      propertyId,
      payrollPeriodId: periodOct.id,
      totalServiceAmount: "450000.00",
      hotelSharePercent: "15.00",
      staffDistributableAmount: "382500.00",
      totalPoints: String(createdEmployees.length),
      pointValue: (382500 / createdEmployees.length).toFixed(4),
      status: "approved",
      notes: "وعاء عمولة الخدمة الفندقية لشهر أكتوبر 2026",
    })
    .returning();

  for (const emp of createdEmployees) {
    await payrollDb.insert(serviceChargeItems).values({
      poolId: scPool.id,
      employeeId: emp.id,
      designationPoints: "1.00",
      workedDaysRatio: "1.0000",
      finalPoints: "1.0000",
      amount: (382500 / createdEmployees.length).toFixed(2),
    });
  }
  console.log(`✅ Seeded 12% Service Charge pool with 382,500 EGP staff distribution.`);

  // 9. Leave Types
  const leaveTypesList = [
    { nameEn: "Annual Leave", nameAr: "إجازة اعتيادية سنوية", max: "21.0" },
    { nameEn: "Casual Leave", nameAr: "إجازة عارضة", max: "6.0" },
    { nameEn: "Sick Leave", nameAr: "إجازة مرضية معتمدة", max: "30.0" },
    { nameEn: "Rest Day Credit", nameAr: "بدل راحة أسبوعية فندقية", max: "14.0" },
    { nameEn: "Hajj / Umrah Grant", nameAr: "إجازة حج وزيارة", max: "30.0" },
  ];

  for (const lt of leaveTypesList) {
    await payrollDb.insert(leaveTypes).values({
      nameEn: lt.nameEn,
      nameAr: lt.nameAr,
      isPaid: true,
      maxDaysPerYear: lt.max,
      isActive: true,
    });
  }
  console.log(`✅ Seeded Egyptian statutory leave types.`);

  console.log("✨ Enterprise Payroll & Attendance database seeding successfully completed!");
}

seedHotelPayrollData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
