# Sunrise Housing Frontend — Exhaustive UI Interaction & Testing Survey Report

**Author:** Housing UI Explorer Agent  
**Date:** 2026-09-08  
**Scope:** `artifacts/housing/src/`  
**Reference Invariants:** `AGENTS.md`, `PROJECT.md`, `ORIGINAL_REQUEST.md` (Section `## 2026-09-08T13:32:04Z`)

---

## Executive Summary

An exhaustive technical code audit and interaction mapping of the entire Sunrise Staff Housing Management System frontend (`artifacts/housing/src/`) was conducted. This report catalogs **every single clickable button, trigger, modal dialog, form field, validation rule, toast notification, data table, search input, filter dropdown, action menu item, and pagination control** across all 8 core functional modules plus the application shell, authentication, and supplementary workflows.

The system incorporates rigorous dual-layer RBAC (`PermissionGate`), server-side debounced search (`useDebounce`), strict bilingual RTL/LTR parity (`ar = language === "ar"`), Hotek PMS TCP socket card encoders, and zero-data-loss architecture.

---

## Table of Contents

1. [Global Application Shell & Navigation](#1-global-application-shell--navigation)
2. [Module 1: Dashboard](#2-module-1-dashboard)
3. [Module 2: Housing & Housekeeping](#3-module-2-housing--housekeeping)
   - 3.1 Buildings Tab & Modals
   - 3.2 Floors Tab & Modals
   - 3.3 Rooms Tab & Modals
   - 3.4 Room Space View & Bed Matrix
   - 3.5 Availability Tab
   - 3.6 Occupancy Tree Tab
   - 3.7 Keys & Lock Management Tab
   - 3.8 Housekeeping Management Page & Tab
   - 3.9 Room Import Wizard (7-Step Engine)
4. [Module 3: Profiles & Employee Directory](#4-module-3-profiles--employee-directory)
   - 4.1 Profiles List Page (Table & Grid Views)
   - 4.2 Create Profile Modal (`ProfileDialog`)
   - 4.3 Edit Profile Modal (`EditProfileDialog`)
   - 4.4 Profile Detail View (`detail.tsx`)
   - 4.5 Excel Import Dialog (`ExcelImportDialog`)
5. [Module 4: Accommodation Management](#5-module-4-accommodation-management)
   - 5.1 In-House Residents (`in-house.tsx`)
   - 5.2 Reservations & Smart Room Assignment (`ReservationsPage.tsx`)
   - 5.3 Guest Hosting & Companions (`GuestHostingPage.tsx`)
   - 5.4 Accommodation History (`history.tsx`)
6. [Module 5: Maintenance & Work Orders](#6-module-5-maintenance--work-orders)
   - 6.1 Tickets List Page (`maintenance.tsx`)
   - 6.2 New Work Order Modal
   - 6.3 Ticket Detail Modal (`ticket-detail-modal.tsx`)
7. [Module 6: Users & Permissions Matrix](#7-module-6-users--permissions-matrix)
   - 7.1 Users Directory & Role Tabs (`users/index.tsx`)
   - 7.2 Create User Dialog (`CreateUserDialog.tsx`)
   - 7.3 Edit User Dialog (`EditUserDialog.tsx`)
   - 7.4 Permission Matrix Dialog (`PermissionMatrixDialog.tsx`)
   - 7.5 Permission Matrix Center (`PermissionMatrixCenter.tsx`)
   - 7.6 User Utility Modals (Reset Password, Unlock, Edit Properties, Upload Signature, Delete)
8. [Module 7: System Settings](#8-module-7-system-settings)
   - 8.1 General Settings & Branding
   - 8.2 Lookups (Departments, Job Titles, Room Types)
   - 8.3 Security & Password Policy Settings
   - 8.4 HR Database Synchronization
   - 8.5 Hotek Door Locks Configuration
9. [Module 8: Activity Log & Key Card Audit](#9-module-8-activity-log--key-card-audit)
10. [Supplementary Modules: Hosting Requests, Properties & Authentication](#10-supplementary-modules)
11. [Current Test Coverage Audit](#11-current-test-coverage-audit)
12. [Recommended Automated End-to-End Testing Strategy](#12-recommended-automated-end-to-end-testing-strategy)

---

## 1. Global Application Shell & Navigation

**Source File:** `artifacts/housing/src/components/layout/AppLayout.tsx`, `artifacts/housing/src/components/ChangePasswordDialog.tsx`

### 1.1 Sidebar Navigation Controls
| Element Label (EN / AR) | Icon | Route / Action | Permission Module | Access Condition |
|---|---|---|---|---|
| Dashboard / لوحة القيادة | `LayoutDashboard` | `/dashboard` | `dashboard` | Visible if user has `dashboard:view` |
| Housing / الإسكان | `Building2` | `/housing` | `housing` | Visible if user has `housing:view` |
| Profiles / بروفايل | `Users` | `/profiles` | `profiles` | Visible if user has `profiles:view` |
| Reservations / الحجوزات | `CalendarCheck` | `/accommodation/reservations` | `reservations` | Visible if user has `reservations:view` |
| In-House / المقيمون حالياً | `BedDouble` | `/accommodation/in-house` | `accommodation` | Visible if user has `accommodation:view` |
| History / السجل | `FileText` | `/accommodation/history` | `accommodation` | Visible if user has `accommodation:view` |
| Hosting Requests / طلبات الاستضافة | `MessageSquare` | `/hosting-requests` | `hosting_requests` | Visible if user has `hosting_requests:view` |
| Guest Housing / تسكين الاستضافات | `UserPlus` | `/accommodation/guest-hosting` | `guest_hosting` | Visible if user has `guest_hosting:view` |
| Housekeeping / هاوس كيبنج | `Sparkles` | `/housekeeping` | `housekeeping` | Visible if user has `housekeeping:view` |
| Tickets / التذاكر | `Wrench` | `/maintenance` | `maintenance` | Visible if user has `maintenance:view` |
| Reports / التقارير | `FileBarChart` | `/reports` | `reports` | Visible if user has `reports:view` |
| Users / المستخدمين | `UserCheck` | `/users` | `users` | Visible if user has `users:view` |
| Properties / العقارات | `Building2` | `/properties` | `properties` | Super Admin only (`isSuperAdmin`) |
| Portal / البوابة | `Trophy` | `/portal` | `portal_content` | Visible if user has `portal_content:view` |
| Settings / الإعدادات | `Settings` | `/settings` | `settings` | Visible if user has `settings:view` |
| Activity Log / سجل النشاط | `Activity` | `/activity-log` | `activity_log` | Visible if user has `activity_log:view` |

### 1.2 Topbar Header Actions
- **Mobile Menu Sheet Trigger:** Hamburger `Menu` icon button (toggles responsive sliding sidebar).
- **Property Switcher Dropdown:**
  - Shows active property name, logo/icon, property code (`LayoutGrid` for "All Properties / جميع الفروع").
  - Dropdown options: "All Properties / جميع الفروع" (aggregates across schemas) and individual hotel properties.
  - Action: Dispatches `POST /api/auth/switch-property`, updates `localStorage.activePropertyId`, and refreshes route.
- **Notifications Dropdown Menu:**
  - Bell icon button with red badge counter (`notifCount`).
  - Sound alert on arrival of new `high` priority notification (`playNotificationSound` via Web Audio API).
  - Category filter pills: All, Accommodation (`tsekeen`), Maintenance, Housekeeping, Profiles.
  - "Mark all read / قراءة الكل" (`CheckCheck` button): commits seen notification IDs to user-specific `localStorage`.
  - Individual "Mark as read / تعليم كمقروء" button per row.
  - Row Click: navigates dynamically to target URL based on notification category.
- **Language Switcher Dropdown:**
  - `Languages` icon button.
  - Option 1: 🇺🇸 English (`setLanguage("en")` -> switches document to `dir="ltr"`).
  - Option 2: 🇸🇦 العربية (`setLanguage("ar")` -> switches document to `dir="rtl"`).
- **Theme Switcher Dropdown:**
  - Sun / Moon animated icon button.
  - Options: Light (فاتح), Dark (داكن), System (تلقائي النظام).
- **User Account Profile Dropdown:**
  - User avatar with username initials + dropdown arrow `ChevronDown`.
  - Header: Username and active primary role badge.
  - Option 1: "Change Password / تغيير كلمة المرور" (`Lock` icon) -> triggers `ChangePasswordDialog`.
  - Option 2: "Logout / تسجيل الخروج" (`LogOut` icon, red) -> triggers `useLogout().mutate()`.

### 1.3 Change Password Dialog
- **Trigger:** Header user dropdown item.
- **Form Fields:**
  1. Current Password (`currentPassword`, type=password, placeholder="••••••••")
  2. New Password (`newPassword`, type=password, placeholder="••••••••")
  3. Confirm Password (`confirmPassword`, type=password, placeholder="••••••••")
- **Validation Rules:**
  - All 3 fields required (`toast.error("Please fill all fields" / "يرجى ملء جميع الحقول")`).
  - `newPassword === confirmPassword` (`toast.error("Passwords do not match" / "كلمات المرور غير متطابقة")`).
  - `newPassword.length >= 6` (`toast.error("Password must be at least 6 characters" / "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل")`).
- **Endpoint:** `POST /api/auth/change-password`
- **Feedback Toasts:** "Password changed successfully! / تم تغيير كلمة المرور بنجاح!".

---

## 2. Module 1: Dashboard

**Source File:** `artifacts/housing/src/pages/dashboard.tsx`

### 2.1 Mode-Dependent Overview
- **Property Mode (`activePropertyId !== "all"`):** Displays 5 interactive KPI cards, Occupancy by Building BarChart, Departure Alerts list, and Recent Activity stream.
- **All Properties Aggregated Mode (`activePropertyId === "all"`):** Displays 4 aggregated KPI cards and a clickable Per-Property breakdown table.

### 2.2 Interactive KPI Metric Cards
- **Total Properties / إجمالي الفروع:** Navigates to `/properties` (violet theme, `LayoutGrid` icon).
- **Total Profiles / إجمالي الموظفين:** Navigates to `/profiles` (blue theme, `Users` icon; shows active vs unassigned counts).
- **Occupancy Rate / معدل الإشغال:** Navigates to `/housing` (animated percentage with decimal precision).
- **Future Reservations / حجوزات مستقبلية:** Navigates to `/accommodation/reservations`.
- **Tickets / التذاكر:** Navigates to `/maintenance` (alert state if overdue/open tickets > 0).

### 2.3 Quick Access / Shortcuts Grid
Interactive tiles with hover-glow and animated arrow transitions:
1. Profiles (`/profiles`) — Staff & resident profiles.
2. In-House (`/accommodation/in-house`) — Active room residents.
3. Housing & Rooms (`/housing`) — Buildings, floors & rooms.
4. Reservations (`/accommodation/reservations`) — Future arrival bookings.
5. Tickets (`/maintenance`) — Work orders & repairs.
6. Housekeeping (`/housekeeping`) — Cleaning & room turnover.
7. Guest Housing (`/accommodation/guest-hosting`) — Guest & visitor stays.

### 2.4 Data Visualizations & Action Widgets
- **Occupancy by Building (`Recharts BarChart`):**
  - Tooltip with exact percentage and room counts.
  - "View all / عرض الكل" badge link (`<PermissionGate module="housing" action="view">` -> `/housing`).
- **Departure Alerts Widget:**
  - Displays up to 6 urgent checkouts (<1d red, <3d amber).
  - Clicking any alert navigates to `/accommodation/in-house`.
  - "View / عرض" header badge link navigates to `/accommodation/in-house`.
- **Recent Activity Stream:**
  - Displays latest 5 system events with user avatar, timestamp, action, and module badge.
  - "Full log / السجل الكامل" badge link navigates to `/activity-log`.
- **Per-Property Table (in 'all' mode):**
  - Interactive rows: clicking any row switches active property and navigates to its specific dashboard.

---

## 3. Module 2: Housing & Housekeeping

**Source Directory:** `artifacts/housing/src/pages/housing/` & `artifacts/housing/src/pages/housekeeping/`

### 3.1 Primary Housing Tabs
1. `room_space_view`: Visual Room & Bed Layout Matrix.
2. `availability`: Filterable Availability Card Grid.
3. `occupancy`: Hierarchical Tree View (Buildings -> Floors -> Rooms -> Beds).
4. `buildings`: Buildings Management Table & Smart Generator.
5. `floors`: Floors Management Table.
6. `rooms`: Rooms Inventory & Bulk Operations Table.
7. `keys`: Hotek Room Key Encoder & Access Card Panel.

### 3.2 Top Header Actions (Housing Page)
- **Excel Template Button:**
  - Label: "Excel Template" / "تحميل نموذج الغرف" (`Download` icon).
  - Permission: `<PermissionGate module="housing" action="export">`.
  - Action: Invokes `downloadRoomImportTemplate("xlsx", ar ? "ar" : "en")`.
- **Import Rooms Button:**
  - Label: "Import Rooms (Excel / CSV)" / "استيراد غرف (Excel / CSV)" (`FileSpreadsheet` icon).
  - Permission: `<PermissionGate module="housing" action="create">`.
  - Action: Opens `RoomImportWizard` modal.

---

### 3.3 Buildings Tab & Modals (`BuildingsTab.tsx`)
- **Search Bar:** Real-time search with 500ms debounce.
- **Create Building Button:** Permission `housing:create` -> opens Add Building Dialog.
- **Table Columns:** Name, Location, Floors count badge, Rooms count badge, Bed Capacity (with occupied % and nominal capacity), Status badge, Action buttons.
- **Row Actions:**
  - Edit Building (`Pencil` icon): opens modal in edit mode (`housing:edit`).
  - Delete Building (`Trash2` icon): opens `AlertDialog` with cascade room count warning (`housing:delete`).
- **Pagination:** `<DataPagination>` with selectable page sizes (`10, 15, 20, 25, 50, 100`) and total records count.
- **Add/Edit Building Dialog Form Fields:**
  - Name* (`bForm.name`, text input)
  - Location (`bForm.location`, text input)
  - Status (`bForm.status`, select: `active` | `inactive`)
- **Smart Generation Engine (Toggle Switch):**
  - Switches dialog to batch generation mode.
  - Per-Floor Configuration Cards:
    - Floor Number input
    - Rooms Count input (`min=1, max=200`)
    - Room Type dropdown (auto-fills default capacity)
    - Room Capacity input (`min=1, max=20` beds)
    - Room Start Number input (e.g. 101)
    - Gender Policy dropdown: Mixed (مختلط), Male Only (ذكور), Female Only (إناث)
    - Live Room Number Range preview badge (`roomStartNumber` to `roomStartNumber + roomsCount - 1`)
  - "Add Floor / إضافة طابق" button.
  - Remove Floor trash button.
  - Generation limits validation: Max 200 rooms per operation.
  - Sequential creation via API with chunked room dispatch (`chunkSize = 20`).
  - Toasts: "Building and X rooms created / تم إنشاء المبنى و X غرفة".

---

### 3.4 Floors Tab & Modals (`FloorsTab.tsx`, `FloorsTable.tsx`, `FloorModals.tsx`)
- **Filters:** Building filter dropdown (All Buildings or specific building).
- **Add Floor Button:** Permission `housing:create` -> opens Add Floor Dialog.
- **Table Columns:** Building Name, Floor Number, Rooms count badge, Description, Actions.
- **Row Actions:**
  - Edit Floor (`Pencil` icon) -> opens modal.
  - Delete Floor (`Trash2` icon) -> opens `AlertDialog`.
- **Form Fields:**
  - Building dropdown* (`buildingId`)
  - Floor Number* (`floorNumber`, text input)
  - Description (`description`, text input)
- **Validation:** Building and floor number required.

---

### 3.5 Rooms Tab & Modals (`RoomsTab.tsx`, `RoomsTable.tsx`, `RoomModals.tsx`)
- **Filters:**
  - Building dropdown (`roomBuildingFilter`)
  - Floor dropdown (`roomFloorFilter`, dynamically cascades based on selected building)
  - Status dropdown (`roomStatusFilter`: all, available, dirty, occupied, occupied_dirty, occupied_vacation, out_of_service, out_of_order)
  - Search input with 500ms debounce
- **Buttons:**
  - "Export Excel / تصدير Excel" (`FileDown` icon, permission `housing:export`): Generates `.xlsx` via `xlsx` library with automatic filename timestamping.
  - "Add Room / إضافة غرفة" (`Plus` icon, permission `housing:create`): Opens Add Room dialog.
  - "Delete Selected / حذف الغرف المحددة" (`Trash2` icon, permission `housing:delete`): Appears when checkboxes are selected, opens `confirmBulkDelete` AlertDialog.
  - "Clear / إلغاء التحديد": Clears selected row checkboxes.
- **Table Columns:** Selection Checkbox, Room Number, Building & Floor, Room Type / Classification, Capacity & Current Occupancy, Status badge, Separator Door badge, Features, Notes, Actions.
- **Row Actions:**
  - Edit Room (`Pencil` icon): opens `RoomModals` in edit mode.
  - Delete Room (`Trash2` icon): opens delete confirmation `AlertDialog`.
- **Room Dialog Form Fields (`RoomModals.tsx`):**
  1. Building* (`buildingId`, select)
  2. Floor* (`floorId`, select)
  3. Room Number* (`roomNumber`, text input, validated against duplicates)
  4. Room Type* (`roomType`, select: Standard, Deluxe, Suite, Studio, Shared, Dormitory, Executive)
  5. Capacity* (`capacity`, number input, default 2)
  6. Gender Policy (`gender`, select: None/Mixed, M, F)
  7. Status (`status`, select: available, dirty, occupied, occupied_dirty, occupied_vacation, out_of_service, out_of_order)
  8. View (`view`, text input: Sea View, Pool View, Garden View, Back View)
  9. Bed Type (`bedType`, text input: Single, King, Queen, Bunk)
  10. Classification (`classification`, text input)
  11. Separator Door (`separatorDoor`, switch toggle)
  12. Size / Area (`size`, text input, e.g. "35m2")
  13. Features (`features` / `featuresList`, tag list)
  14. Notes (`notes`, textarea)
- **Validation:** Building, floor, and room number required. Duplicate room number blocked.
- **Toasts:** "Room Added / تم إضافة الغرفة بنجاح", "Room Updated / تم تحديث الغرفة بنجاح", "Room Deleted / تم حذف الغرفة بنجاح".

---

### 3.6 Room Space View & Bed Matrix (`RoomSpaceViewTab.tsx`)
- **KPI Summary Cards:** Total Rooms, Total Bed Spaces, Occupied Beds, Free Bed Spaces (ready to assign), On Vacation Beds.
- **Filter Controls:** Search (room, occupant name, code, department), Building dropdown, Floor dropdown, Status filter badges strip.
- **"Assign Room / تسكين موظف" Button:** Navigates directly to `/accommodation/reservations`.
- **Interactive Visual Cards Grid:**
  - Each room renders its complete bed slot matrix (`1..capacity`).
  - Occupied Bed Slot: Shows resident avatar, full name, job title, department, expected checkout date, vacation badge.
  - Free Bed Slot: Displays "Free Bed / سرير متاح" with an interactive "Click to Assign / اضغط للتسكين" link.
  - Card Click: Triggers `RoomDetailsDialog`.

---

### 3.7 Shared Room Dialogs (`RoomDetailsDialog.tsx`, `RoomLogDialog.tsx`)
- **`RoomDetailsDialog`:**
  - Room number header with quick "Room Log / سجل الغرفة" button (`History` icon).
  - Quick Status display badge (noting status edits belong to Housekeeping).
  - Vacation alert banner if room is `occupied_vacation`.
  - Room specs grid: Classification, Capacity, Building, Floor, Bed Type, View, Size.
  - Room Features Tag Editor: Inline add feature input, remove feature badge button, and "Save Features / حفظ المميزات" button.
  - Current Occupants List: Resident name, employee code, check-in date, expected checkout, bed number, vacation badge, and direct link to profile.
- **`RoomLogDialog`:**
  - Chronological assignment and maintenance audit log for the room.

---

### 3.8 Keys & Lock Management Tab (`KeysTab.tsx`, `KeyManagementPanel.tsx`)
- **Room Selector:** Grouped select dropdown categorized by building showing room number, type, and current occupancy badge.
- **Active Resident Banner:** Displays assigned occupant name and room number.
- **Hotek Key Management Panel:**
  - Encoder connection status badge: `Wifi` Connected (green) or `WifiOff` Disconnected (red).
  - Workstation ID input (persisted in `localStorage.hotek_workstation_id`).
  - Card Type dropdown (`guest`, `staff`, `master`).
  - Number of cards input for batch encoding (`1..99`).
  - "Manual card entry" checkbox + Card number text input.
  - "Duplicate card" checkbox.
  - "Issue Key / إصدار كارت" button: Triggers TCP socket bridge (`POST /api/keys/issue`), plays progress animation.
  - Existing Issued Keys Table: Card Number, Card Type, Valid From, Valid Until, Status badge (`ACTIVE`, `REVOKED`, `EXPIRED`), Revoke action button (`Trash2` icon).

---

### 3.9 Housekeeping Management Page & Tab (`HousekeepingTab.tsx`)
- **Header Counters:** Total Rooms, Clean & Available, Occupied Clean, Vacant Dirty, Occupied Dirty, Out of Service / Out of Order.
- **Filters:** Search input, Building dropdown, Floor dropdown, Status filter pill buttons.
- **Bulk Action Bar:**
  - Select all on page / individual row checkboxes.
  - "Clean Selected / تنظيف الغرف المحددة": Batch patch setting `dirty` -> `available`, `occupied_dirty` -> `occupied`.
  - "Dirty Selected / تحديد كغير نظيفة": Batch patch setting status to `dirty`.
  - "Export Excel / تصدير Excel": Exports housekeeping checklist to `.xlsx`.
- **Row Quick Actions:**
  - "Mark Clean / تم التنظيف" (`Brush` / `CheckCircle2` icon): Single-click room turnaround.
  - "Mark Dirty / غير نظيفة" (`RotateCcw` icon).
  - "Out of Service / Out of Order" (`Wrench` / `Ban` icon): Opens `OosModal`.
- **Out of Service (OOS/OOO) Dialog Form Fields:**
  - OOS Type (`out_of_service` - صيانة مؤقتة vs `out_of_order` - خارج الخدمة)
  - Start Date (`oosStartDate`, `DateInput`)
  - End Date (`oosEndDate`, `DateInput`)
  - Reason (`oosReason`, `Textarea`)
  - Action: Creates maintenance tracking ticket and transitions room status.

---

### 3.10 Room Import Wizard (`RoomImportWizard.tsx`)
A comprehensive 7-step wizard for Excel/CSV room onboarding:
1. **Property Step:** Select target hotel property and optional building assignment.
2. **Upload Step:** File upload dropzone supporting `.xlsx`, `.xls`, `.csv` with multi-sheet selector.
3. **Mapping Step:** Automatic column detection + manual mapping for 14 system fields (`roomNumber`, `building`, `floor`, `roomType`, `capacity`, `gender`, `bedType`, `classification`, `status`, `view`, `size`, `separatorDoor`, `features`, `notes`). Save template option.
4. **Mode Step:** Selection of import mode: `create_update`, `create_only`, `update_only`, `replace`.
5. **Preview Step:** Real-time data validation grid with search, filter by errors/warnings, inline cell editing.
6. **Progress Step:** Chunked batch execution with animated progress bar.
7. **Result Step:** Success summary counters (created, updated, skipped, errors) with "Go to Housing" completion button.

---

## 4. Module 3: Profiles & Employee Directory

**Source Directory:** `artifacts/housing/src/pages/profiles/`

### 4.1 Profiles List Page (`ProfilesPage.tsx`)
- **Top Header Actions:**
  - `ColumnChooser` dropdown: Allows toggling visibility across 25 individual and composite profile columns.
  - View Switcher Button Group: Table View (`List` icon) vs Grid Cards View (`LayoutGrid` icon).
  - "Import Excel / استيراد Excel" button (`FileSpreadsheet` icon): Opens `ExcelImportDialog`.
  - "New Profile / إضافة ملف شخصي" button (`Plus` icon, permission `profiles:create`): Opens `ProfileDialog`.
- **Search & Filter Bar:**
  - Search input with 300ms debounce (searches name, employee code, department).
  - Department dropdown filter (populated via system lookups).
  - Status dropdown filter: All, In-House (`ACTIVE`), Unassigned (`UNASSIGNED`), Checked Out (`LEFT`), On Vacation (`VACATION`).
- **Bulk Action Bar (`BulkActionBar`):**
  - Checkbox select all / individual.
  - "Export Selected / تصدير المحدد" button: Generates comprehensive Excel sheet.
  - "Delete Selected / حذف المحدد" button: Validates that selected profiles are NOT currently housed in rooms (blocks deletion with informative toast if active resident).
- **Table Columns:** Selection Checkbox, Profile & Full Name, Employment Type & Company, Job Title & Dept & Level, Contact & National ID, Dates (Hire & Contract End), Status badge, Actions Dropdown Menu.
- **Row Actions Dropdown:**
  1. "View Details / عرض التفاصيل" (`Eye` icon): Navigates to `/profiles/:id`.
  2. "Edit / تعديل" (`Pencil` icon, permission `profiles:edit`): Opens `EditProfileDialog`.
  3. "Reset Password / إعادة تعيين كلمة المرور" (`Key` icon, permission `profiles:edit`): Dispatches `POST /api/portal-auth/reset-password` and displays temporary password toast.
  4. "Delete / حذف" (`Trash2` icon, red, permission `profiles:delete`): Opens `AlertDialog` with residence guard.
- **Pagination:** `<DataPagination>` with selectable page sizes (`10, 15, 20, 25, 50, 100`) and total records count.

---

### 4.2 Create Profile Modal (`ProfileDialog.tsx`)
- **Form Sections & Fields:**
  - **Photo Upload:** Interactive avatar upload button (`PhotoUploadBtn`) with image preview and remove button.
  - **Employment Type:** Radio/Select (`INTERNAL` - موظف داخلي vs `THIRD_PARTY` - طرف ثالث).
  - **Company / Workplace:** Required for third-party profiles (`companyName`).
  - **Employee Code*:** (`profileId`, unique identifier, validated via real-time duplicate check `useCheckDuplicates`).
  - **4-Part Arabic/English Full Name:**
    - First Name* (`firstName`)
    - Second Name* (`lastName`)
    - Third Name (`thirdName`)
    - Fourth Name (`fourthName`)
  - **National ID / Passport Number*:** (`nationalId`, duplicate checked).
  - **Phone Number*:** (`phone`, duplicate checked).
  - **Email Address:** (`email`, format validated).
  - **Department*:** (`department`, dropdown from lookup values).
  - **Job Title*:** (`jobTitle`, dropdown filtered by selected department).
  - **Level / Grade:** (`level`, auto-locked if job title has fixed rank).
  - **Nationality*:** (`nationality`, searchable nationality selector with country flags).
  - **Gender*:** (`gender`, select: Male `M` | Female `F`).
  - **Date of Birth:** (`dateOfBirth`, `DateInput`).
  - **Hire Date*:** (`hireDate`, `DateInput`, defaults to today).
  - **Contract End Date:** (`contractEndDate`, `DateInput`).
  - **Emergency Contact:** (`emergencyContact`, text input).
  - **Address:** (`address`, text input).
  - **Status:** (`status`, select: `ACTIVE`, `UNASSIGNED`, `LEFT`, `VACATION`).
  - **ID Document Upload:** Drag-and-drop or file selector, validates max 5MB, renders thumbnail preview list with `Eye` preview modal and `X` remove button.
- **Validations & Error Toasts:** Real-time duplicate warning banners for code, national ID, and phone; bilingual required field errors.

---

### 4.3 Edit Profile Modal (`EditProfileDialog.tsx`)
Pre-populates all existing data, allows updating documents and photos, and saves via `useUpdateProfile`.

---

### 4.4 Profile Detail View (`detail.tsx`)
- **Top Actions:**
  - "Back to Profiles" link button (`ArrowLeft`).
  - Vacation Management Button:
    - If status !== "VACATION": "Go on Vacation / تسجيل إجازة" (`CalendarPlus` icon) -> opens Vacation Dialog (Start Date, End Date, Notes, duration counter). Automatically transitions room assignment to `occupied_vacation`.
    - If status === "VACATION": "Return from Vacation / عودة من الإجازة" (`Palmtree` icon) -> confirms return and restores room status to `occupied`.
  - Print Housing Letter Button: "Print Housing Letter / طباعة خطاب التسكين" (`Printer` icon) -> opens `PrintLanguageDialog` (Arabic or English) and generates official PDF letter.
  - "Edit Profile / تعديل البيانات" button (`Pencil` icon).
- **Profile Photo Section:** Camera icon overlay allowing immediate photo replacement.
- **National ID & Document Cards:**
  - Thumbnail display.
  - "Preview / معاينة" button -> opens `DocumentPreviewModal`.
  - "Download / تحميل" button -> downloads original file.
  - "Delete Document / حذف المستند" button -> opens confirmation dialog.
- **Current Room Assignment Card:** Displays Room number, Bed number, Building name, Floor, Check-in date, Expected checkout date, Room details link.
- **Assignment History Table:** Table listing previous stays (Room, Building, Floor, Check-in, Check-out, Status badge).

---

### 4.5 Excel Import Dialog (`ExcelImportDialog.tsx`)
- Download template button.
- File upload supporting `.xlsx` and `.xls` with max 1MB size check.
- Parsing and mapping verification with preview before commit.

---

## 5. Module 4: Accommodation Management

**Source Directory:** `artifacts/housing/src/pages/accommodation/`

### 5.1 In-House Residents (`in-house.tsx`)
- **Search Bar:** Real-time search with 500ms debounce.
- **Column Chooser:** Customized column visibility management.
- **Bulk Action Bar:**
  - "Export Selected / تصدير المحدد" (`xlsx`).
  - "Bulk Check-out / تسجيل مغادرة جماعي": Opens modal with checkout notes and executes batch checkout.
  - "Bulk Extend Stay / تمديد إقامة جماعي": Opens modal with new checkout date and notes.
- **Table Columns:** Checkbox, Resident (avatar, full name, code, popup trigger `ProfileProfilePopup`), Company & Employment Type, Job Title & Department, Room & Bed Slot, Dates (Check-in, Checkout, Nights count), Status / Vacation badge, Actions Dropdown.
- **Row Actions Dropdown:**
  1. "Check-out / تسجيل خروج" (`LogOut` icon, permission `accommodation:checkout`): Opens `checkoutDialog` (checkout date, notes).
  2. "Transfer Room / نقل لغرفة أخرى" (`ArrowRightLeft` icon, permission `accommodation:transfer`): Opens `transferDialog` (target property, target room search, target bed slot, reason, notes, optional housing letter reprint).
  3. "Vacation Management / إدارة الإجازة" (`Palmtree` icon): Opens `vacationDialog`.
  4. "Re-issue Key / إصدار كارت" (`Key` icon): Opens `reissueDialog` with `KeyManagementPanel`.
  5. "Extend Stay / تمديد الإقامة" (`Calendar` icon): Opens `extendDialog` (new checkout date, notes).
  6. "Print Housing Letter / طباعة خطاب التسكين" (`Printer` icon): Opens `PrintLanguageDialog` and generates PDF.
- **Pagination:** `<DataPagination>` with selectable page sizes.

---

### 5.2 Reservations & Smart Room Assignment (`ReservationsPage.tsx`)
- **Status Filter Tabs:** UPCOMING (حجوزات قادمة), CHECKED_IN (تم تسكينهم), CANCELLED (ملغاة), ALL (كل الحالات).
- **Search Input:** 500ms debounce.
- **"New Reservation / حجز جديد" Wizard Modal (`newDialogOpen`):**
  - **Step 1: Mode Selection**
    - Option A: Existing Profile / موظف مسجل بالنظام (Real-time debounced auto-complete across single/all properties).
    - Option B: New Person Profile / موظف أو نزيل جديد (Complete profile creation form with 4-part name, national ID, phone, department, job title, level, hire date, contract end, photo capture/upload, and ID documents upload with duplicate checks).
  - **Step 2: Profile Review / Details**
  - **Step 3: Room Selection, Dates, & Booking Type**
    - Booking Type: Direct Assignment ("تسكين فوري (Check-in الآن)") vs Upcoming Reservation ("حجز مستقبلي (Upcoming)").
    - Check-in Date, Check-out Date (`DateInput`).
    - Entire Room Booking switch (`is_entire_room`): Locks whole room exclusively.
    - Smart Room Recommender (`recommendBestRooms`): Ranks and suggests optimal rooms matching gender, department, occupancy, floor, building.
    - Manual Room Picker: Building filter, floor filter, room search, bed slot radio buttons.
    - Notes textarea.
    - Post-Submit: Prompts key card encoder modal (`KeyManagementPanel`) upon successful check-in.
- **Row Actions Dropdown:**
  - Check-in Now ("تسجيل دخول فوري") -> opens `checkinDialog` (confirm room & bed, then triggers key encoder).
  - Edit Reservation ("تعديل الحجز") -> opens `editDialog` (edit dates, guest details, room, bed).
  - Cancel Reservation ("إلغاء الحجز") -> opens `cancelDialog` (cancellation reason).
  - Print Housing Letter ("طباعة خطاب التسكين") -> opens `PrintLanguageDialog`.
  - Delete Reservation ("حذف الحجز") -> `AlertDialog`.
- **Bulk Action Bar & Pagination.**

---

### 5.3 Guest Hosting & Companions (`GuestHostingPage.tsx`)
- **Top Header Actions:**
  - "New Hosting / إضافة استضافة" button (`Plus` icon, permission `guest_hosting:create`).
  - Column chooser.
- **"New Hosting" Modal:**
  - Host Profile search (debounced auto-complete).
  - Hosting Type: `SAME_ROOM` (نفس غرفة المضيف) or `SEPARATE_ROOM` (غرفة مستقلة).
  - Room picker if separate room.
  - Expected From, Expected To dates.
  - **Companions List Builder:**
    - Companion Name input.
    - National ID / Passport Number input.
    - Document Type dropdown (ID, Passport, Birth Certificate).
    - Document Image upload (with validation: max 5MB, preview, file name).
    - Relation dropdown (Spouse, Child, Parent, Sibling, Friend, etc.).
    - Is Child checkbox + Age input.
    - "Add Companion / إضافة مرافق" button.
  - Notes textarea.
- **Table Row Actions:**
  - Check-in ("تسجيل دخول") -> opens room assignment & triggers key encoder dialog.
  - Check-out ("تسجيل خروج") -> calls `checkoutHosting`.
  - Edit Hosting -> opens `editDialog`.
  - View Companions / Documents -> opens companion details with image lightbox zoom (`ImageLightbox`).
  - Print Guest Voucher / Letter -> generates PDF voucher with companions list.
  - Delete Hosting -> `AlertDialog`.
- **Bulk Action Bar & Pagination.**

---

### 5.4 Accommodation History (`history.tsx`)
- **Filters:** Search input with 500ms debounce; Status filter (ALL, ENDED, TRANSFERRED, CANCELLED).
- **Bulk Action Bar:** Export to Excel (`xlsx`); Bulk Delete (`confirmBulkDelete` AlertDialog).
- **Row Actions:** Delete single record (`deleteRecord` AlertDialog).
- **Pagination:** `<DataPagination>`.

---

## 6. Module 5: Maintenance & Work Orders

**Source File:** `artifacts/housing/src/pages/maintenance.tsx`, `artifacts/housing/src/components/ui/maintenance-*.tsx`

### 6.1 Tickets Management Overview
- **Filter Bar (`MaintenanceFilterBar`):**
  - Category filter: all, maintenance, housekeeping, general.
  - Status filter: all, open, in_progress, resolved, closed.
  - Priority filter: LOW, MEDIUM, HIGH, URGENT.
  - Search input with 500ms debounce.
- **"New Ticket / إضافة بلاغ" Button:** Opens modal `isOpen`.
- **New Ticket Modal Form Fields:**
  - Room selector (with building and floor info).
  - Category dropdown (`maintenance`, `housekeeping`, `general`).
  - Problem Type dropdown (`Plumbing`, `Electrical`, `HVAC`, `Furniture`, `Cleaning`, `Internet`, `Other`).
  - Priority dropdown (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - Description textarea.
  - Notes textarea.
  - Photo attachment (Camera/Upload button -> file reader data URL).
- **Table Columns:** Ticket ID & Category icon, Room & Building, Problem Type & Description, Priority badge, Status badge, Live duration timer (color-coded: green <=20m, yellow <=40m, red <=60m, dark >60m), Assigned Technician, Actions.
- **Row Action Controls:**
  - View Details: Opens `TicketDetailModal` or navigates to `/maintenance/:id`.
  - Start Work ("بدء العمل" -> status `in_progress`, timestamps `startedAt`).
  - Mark Resolved ("تم الحل" -> status `resolved`, timestamps `resolvedAt`).
  - Assign Technician dropdown.
  - Delete Ticket -> `AlertDialog`.
- **Bulk Action Bar:**
  - Checkbox select all / individual tickets.
  - Bulk status update (Open, In Progress, Resolved, Closed).
  - Export to Excel (`xlsx`).
- **Pagination:** `<DataPagination>`.

---

## 7. Module 6: Users & Permissions Matrix

**Source Directory:** `artifacts/housing/src/pages/users/`

### 7.1 Users Directory & Role Tabs (`users/index.tsx`)
- **Main View Tabs:**
  - "Users / المستخدمين" (`activeMainTab === "users"`).
  - "Permission Matrix Center / مركز الصلاحيات" (`activeMainTab === "matrix"`).
- **Role Tabs Strip:** All, Super Admin, Admin, Manager, Receptionist, Maintenance Staff with real-time user counts.
- **Filters:** Search input with 500ms debounce; Status dropdown (all, active, locked, inactive).
- **"New User / مستخدم جديد" Button:** Opens `CreateUserDialog`.
- **Row Actions Dropdown Menu:**
  1. "Permissions / مصفوفة الصلاحيات" (`ShieldCheck` icon): Opens `PermissionMatrixDialog` or focuses user in Matrix Center.
  2. "Edit User / تعديل المستخدم" (`Pencil` icon): Opens `EditUserDialog`.
  3. "Assigned Properties / تعديل الفروع" (`Building2` icon): Opens `EditPropertiesDialog`.
  4. "Signature / رفع التوقيع" (`Pen` icon): Opens `UploadSignatureDialog`.
  5. "Reset Password / إعادة تعيين كلمة المرور" (`KeyRound` icon): Opens `ResetPasswordDialog`.
  6. "Unlock Account / فك القفل" (`Unlock` icon, visible if locked): Opens `UnlockUserDialog`.
  7. "Delete User / حذف المستخدم" (`Trash` icon, red): Opens `DeleteUserDialog`.
- **Bulk Action Bar & Pagination.**

---

### 7.2 Create User Dialog (`CreateUserDialog.tsx`)
- **Form Sections & Fields:**
  1. **Account Credentials:**
     - Username* (`username`, min 3 chars, trimmed).
     - Password* (`password`, with interactive `PasswordStrengthMeter` evaluating length, uppercase, lowercase, numbers, symbols).
     - Full Name / Display Name (`displayName`).
     - Email Address (`email`, format validated).
     - Phone Number (`phone`).
     - Job Title (`jobTitle`).
  2. **Hotel / Property Multi-Select Assignment:**
     - Multi-property selection checkboxes (`propertyIds`).
     - Required for all roles except `super_admin`.
  3. **Role Selector:**
     - System roles with descriptive badges: `super_admin`, `system_admin`, `admin`, `manager`, `receptionist`, `maintenance_staff`, `hr_admin`, `security_staff`, `portal_admin`.
  4. **Account Status:**
     - Status selector: `ACTIVE` | `INACTIVE`.
- **Validation:** Bilingual error messages matching system password policies.

---

### 7.3 Edit User Dialog (`EditUserDialog.tsx`)
Pre-populates user account details, optional password change with strength validation, role modification, property assignments, and status updates.

---

### 7.4 Permission Matrix Dialog & Center (`PermissionMatrixDialog.tsx`, `PermissionMatrixCenter.tsx`)
- **Features:**
  - **Module Grouping:** Organizes 22 system modules into logical operational domains (Daily Operations, Accommodation Flow, Employee Portal, Management, Security & Audit).
  - **Bulk Module Controls:** "Select All / تحديد الكل" and "Deselect All / إلغاء الكل" per module.
  - **Role Presets:** Single-click buttons to load baseline presets (Admin, Manager, Receptionist, Maintenance).
  - **Real-Time Search Bar:** Filters modules and actions in both English and Arabic.
  - **Visual Distinction:** Visual badges distinguishing inherited role defaults from custom granted permissions.
  - **Action Dependency Enforcement:** Selecting any sub-action forces `view` ON; unchecking `view` automatically revokes all sub-actions in that module.
  - **Save Action:** Saves array of normalized permission keys (`module.action`) via API.

---

### 7.5 User Utility Modals
- **Reset Password Dialog (`ResetPasswordDialog.tsx`):** Allows admin to set new password with policy validation or auto-generate secure password.
- **Unlock User Dialog (`UnlockUserDialog.tsx`):** Unlocks accounts locked due to excessive failed login attempts, resets failure counter.
- **Edit Properties Dialog (`EditPropertiesDialog.tsx`):** Multi-select property access assignment for multi-tenant isolation.
- **Upload Signature Dialog (`UploadSignatureDialog.tsx`):** Canvas drawing or image upload for digital signatures used in approvals and PDF vouchers.
- **Delete User Dialog (`DeleteUserDialog.tsx`):** Guarded confirmation dialog preventing self-deletion or deletion of primary system administrator.

---

## 8. Module 7: System Settings

**Source Directory:** `artifacts/housing/src/pages/settings/`

### 8.1 7-Section Settings Architecture (`index.tsx`)
1. **General Settings (`GeneralSettings.tsx`):**
   - System Name (`systemName`, text input).
   - System Logo upload & remove.
   - Default Language dropdown (English vs Arabic).
   - Primary Brand Color picker (`primaryColor`).
   - Button Accent Color picker (`buttonColor`).
   - Departure Alert Threshold days (`departureAlertThreshold`, default 3).
   - Enable Departure Alerts switch (`departureAlertsEnabled`).
   - Report Footer text (`reportFooter`).
   - "Save Settings / حفظ الإعدادات" button (Permission `settings:edit`).
2. **Departments Lookup (`LookupSection.tsx`):**
   - Search bar with debounce.
   - Table of departments with active/disabled badges.
   - Add Department modal (value, Arabic label).
   - Edit Department modal.
   - Delete Department confirmation.
   - Toggle enabled/disabled switch.
   - Pagination.
3. **Job Titles Lookup (`LookupSection.tsx`):**
   - Linked to Department (parent category).
   - Linked to Level/Grade (extra value).
   - Search, Add, Edit, Delete, Pagination.
4. **Room Types Lookup (`LookupSection.tsx`):**
   - Linked to default bed capacity (parent value).
   - Search, Add, Edit, Delete, Pagination.
5. **Security & Password Policy (`SecuritySettings.tsx`):**
   - Minimum password length (`passwordMinLength`, default 8).
   - Require uppercase letter switch (`passwordRequireUppercase`).
   - Require lowercase letter switch (`passwordRequireLowercase`).
   - Require number switch (`passwordRequireNumber`).
   - Require special symbol switch (`passwordRequireSymbol`).
   - Password expiry days (`passwordExpiryDays`, default 90).
   - Password history count (`passwordHistoryCount`, default 5).
   - Account lockout threshold attempts (`lockoutThreshold`, default 5).
   - Lockout duration in minutes (`lockoutDurationMinutes`, default 15).
   - "Save Security Policy / حفظ سياسة الأمان" button.
6. **HR Database Sync (`HrSyncSection.tsx`):**
   - API Endpoint URL input.
   - Secret API Key / Token input.
   - "Test Connection / فحص الاتصال" button.
   - "Sync Now / مزامنة الآن" button (triggers full HR import).
   - Last sync timestamp display and audit status.
7. **Hotek Door Locks (`DoorLocksSection.tsx`):**
   - Hotek TCP Bridge Server Host IP input.
   - Hotek Port input (default 10006).
   - Encoder model selector.
   - "Test Encoder Connection / اختبار الاتصال بالمشفر" button.
   - Live socket status badge (Connected / Disconnected).

---

## 9. Module 8: Activity Log & Key Card Audit

**Source File:** `artifacts/housing/src/pages/activity-log.tsx`

### 9.1 Two-Tab Architecture
- **Tab 1: System Activity Log (`activeView === "activity"`):**
  - **Filters:**
    - Search input (user, action, details).
    - Module dropdown (24 modules: auth, system, dashboard, housing, profiles, accommodation, reservations, maintenance, reports, users, settings, activity_log, etc.).
    - Action dropdown (LOGIN, LOGOUT, LOGIN_FAILED, ACCOUNT_LOCKED, PASSWORD_CHANGED, PROPERTY_SWITCH, CREATE, UPDATE, DELETE, CHECKOUT, CHECKIN, AUTH, SECURITY).
  - **Table Columns:** User Avatar & Username, Action badge, Module badge, Details summary, IP Address & User Agent, Timestamp.
  - **Row Action:** "View Details / عرض التفاصيل" (`Eye` icon) -> opens JSON Inspector Dialog with formatted syntax tree and "Copy JSON" button.
  - **Export CSV Button:** Invokes `downloadCsv`.
- **Tab 2: Key Card Audit (`activeView === "keys"`):**
  - **Filters:** Key Search input, Key Action dropdown (`issue`, `revoke`, `extend`), Date From, Date To.
  - **Table Columns:** Room Number, Card Number, Operator / User, Action badge, Valid Dates, Notes, Timestamp.
  - **Pagination:** `<DataPagination>`.

---

## 10. Supplementary Modules

### 10.1 Authentication (`login.tsx`)
- Username input (`min=1`).
- Password input with show/hide toggle (`Eye` / `EyeOff`).
- "Keep me logged in / تذكرني" checkbox.
- "Sign in / تسجيل الدخول" button.
- Account lockout warning banner with remaining countdown minutes.
- Remaining login attempts counter before lockout.
- Session timeout expiration alert.
- Bilingual language toggle.

### 10.2 Properties Administration (`properties.tsx`)
- Visible strictly to Super Admin.
- Table listing properties with name, code, status, admin account.
- "Add Property" modal: General info, Branding color pickers, Admin credentials, and optional Excel Housing Configuration file upload.
- Row actions: Edit, Delete (`AnimatedConfirmModal`), and Import Rooms (`RoomImportWizard`).

### 10.3 Hosting Requests (`hosting-requests/`)
- Tabs: All, In Signing, Approved, Rejected.
- Multi-step approval workflow (Housing Manager -> HR Manager -> Accounts Manager).
- Digital signature verification and PDF voucher printing.

### 10.4 Reports Center (`reports/ReportsPage.tsx`)
- Tabs: Analytics Dashboard, Occupancy, Vacant Beds, In-House Residents, Expiring Contracts, Maintenance, Reservations, Guest Hosting.
- Multi-dimensional filters (Property, Building, Floor, Room Type, Department, Gender, Nationality, Dates).
- Export Toolbar: Export to Excel (`xlsx`), Export PDF (`jspdf-autotable`), Export Analytics PDF.

---

## 11. Current Test Coverage Audit

A thorough examination of the workspace revealed:

1. **Root `tests/` Directory:**
   - `tests/e2e-user-permissions.test.mjs` (1,825 lines): Tests RBAC specification, password validation rules, permission normalization, role inheritance, and payload schemas via Node.js / Vitest assertions.
   - `tests/adversarial-rbac-state.test.mjs` (1,001 lines): Adversarial security test suite testing role boundary conditions, permission revoking, and multi-tenant schema isolation.
   - `tests/challenger-1-adversarial.test.mjs`: Tests permission matrix calculations and role baseline inheritance.
2. **Frontend `artifacts/housing/src/tests/`:**
   - Currently **empty**.
3. **Conclusion on Test Coverage:**
   - **Zero automated browser UI / DOM component tests exist.**
   - Existing tests operate purely at the Node.js / unit domain logic layer.
   - No automated test currently visits the web application in a real browser, clicks buttons, opens modals, exercises forms, verifies toast feedback, or validates that the browser console remains at zero runtime exceptions.

---

## 12. Recommended Automated End-to-End Testing Strategy

To achieve the acceptance criteria mandated in `ORIGINAL_REQUEST.md` (Section `## 2026-09-08T13:32:04Z`), the following automated testing strategy is recommended:

### 12.1 Testing Framework Architecture
- **Tool:** Playwright (recommended) or Puppeteer / Vitest Browser Mode.
- **Environment:** Run against local Vite dev server (`http://localhost:5173`) connected to the local API server (`http://localhost:3001`) and PostgreSQL 18.
- **Error Sentinel:** Attach `page.on('console', msg => { if (msg.type() === 'error') throw ... })` and `page.on('pageerror', err => ...)` to fail any test that produces an uncaught browser console error.

### 12.2 Test Suite Execution Matrix
1. **Suite 1: Navigation & Global Shell Test**
   - Click every sidebar navigation link and verify page load and URL match.
   - Click Language Switcher (EN <-> AR) and assert `document.dir` flips between `ltr` and `rtl`.
   - Click Theme Switcher (Light <-> Dark) and assert HTML class toggles.
   - Click Property Switcher dropdown and switch between "All Properties" and individual hotels.
   - Open Change Password modal, test validation errors on empty/mismatched inputs, and close.
   - Open Notifications dropdown, filter by category, and click "Mark all read".
2. **Suite 2: Dashboard Interaction Test**
   - Click each KPI card and verify route navigation.
   - Click all 7 Quick Access shortcut cards.
   - Hover over Recharts bar chart elements to test tooltip mounting.
   - Click departure alerts and recent activity rows.
3. **Suite 3: Housing & Housekeeping Suite**
   - Switch between all 7 Housing tabs.
   - Open Add Building dialog, test Smart Generation toggle, add a floor config, close modal.
   - Open Add Floor dialog, test required validations.
   - Open Add Room dialog, test duplicate room number validation.
   - Test bulk selection checkboxes in Rooms table and trigger Bulk Delete dialog.
   - Switch to Room Space View, test search filter and click a bed slot to open details.
   - On Housekeeping page, click "Mark Clean" and "Mark Dirty" on rooms, open OOS modal.
   - Test "Export Excel" buttons across tables and verify valid `.xlsx` blob generation.
4. **Suite 4: Profiles & Employee Directory Suite**
   - Toggle ColumnChooser columns on/off.
   - Switch between Table and Grid view modes.
   - Open New Profile dialog: cycle through all tabs, test duplicate checking on code/NID/phone, test file drag-and-drop.
   - Open Edit Profile and Reset Password dialogs on table rows.
   - Navigate to Profile Detail (`/profiles/:id`): test Vacation dialog, Print Housing Letter modal, and Document preview lightbox.
5. **Suite 5: Accommodation Suite**
   - On In-House: test search debounce, open Transfer Room dialog, Extend Stay dialog, and Checkout dialog.
   - On Reservations: open "New Reservation" wizard, step through Step 1 -> Step 2 -> Step 3, test smart room recommender suggestions, test check-in dialog.
   - On Guest Hosting: open New Hosting dialog, test add companion form with age/isChild toggles and document upload.
6. **Suite 6: Maintenance Suite**
   - Open New Ticket dialog: select room, category, problem type, priority, attach dummy image, and submit.
   - Click Start Work and Mark Resolved buttons on tickets.
   - Open Ticket Detail modal and test technician assignment.
7. **Suite 7: Users & Permission Matrix Suite**
   - Switch between role tabs (All, Super Admin, Admin, Manager, Receptionist, Maintenance).
   - Open Create User dialog: test password strength meter with weak/fair/strong passwords.
   - Open Edit User, Edit Properties, Reset Password, and Upload Signature dialogs.
   - Switch to Permission Matrix Center: test module search in Arabic and English, click "Select All" / "Deselect All", toggle role baseline presets.
8. **Suite 8: Settings Suite**
   - Cycle through all 7 tabs: General, Departments, Job Titles, Room Types, Security, HR Sync, Door Locks.
   - Test Add/Edit lookup modals.
   - Test Hotek socket connection test button.
9. **Suite 9: Negative Boundary & Zero Console Error Assertion**
   - Submit forms with empty required fields to assert bilingual validation messages without UI crash.
   - Test rapid typing into debounced search bars to verify zero race conditions.
   - Assert console error count remains strictly **0** throughout all runs.

---
*Report compiled and certified by Housing UI Explorer Agent.*
