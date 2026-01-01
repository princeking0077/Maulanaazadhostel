# Hostel Management System v2.0.5 - Release Notes

**Release Date:** November 14, 2025  
**Build:** Hostel Management System Setup 2.0.5.exe (106 MB)  
**Location:** `dist-electron\Hostel Management System Setup 2.0.5.exe`

---

## 🎉 New Features

### 1. ✅ **Bulk Excel Import - All Rows Support**
- **Fixed:** Import now processes ALL rows from Excel/CSV files (previously showed only sample data)
- **Enhanced:** Full XLSX library integration for reading Excel workbooks
- **Smart Mapping:** Automatically maps common column variations:
  - "Sr.No", "Sr No", "S.No" → Serial Number
  - "Student Name & Mobile", "Student Name" → Student Name
  - "Wing & Room", "Wing", "Room No" → Wing and Room assignments
  - Supports all payment fields: Registration Fee, Room Rent, Water Charges, etc.
- **Preview:** Shows first 50 records with full count (e.g., "50 of 250 records")
- **Import All:** Imports ALL records with proper validation and duplicate checking

**Impact:** Now you can import hundreds of students from hostel register Excel files in one go!

---

### 2. 📅 **Academic Year Filtering (10-Month Hostel Year)**
- **New Filter:** "Academic Year" dropdown in Students page
- **10-Month Cycle:** Automatically calculates academic years (August to May)
  - 2024-25 (Aug 2024 - May 2025)
  - 2023-24 (Aug 2023 - May 2024)
  - Covers last 5 years by default
- **Smart Detection:** Based on student joining date
  - June-July onwards → Current year
  - Before June → Previous year
- **Export Integration:** Academic year included in Excel exports

**Impact:** Easily filter and view students by hostel academic year, not calendar year!

---

### 3. 💰 **Wing-Specific Annual Fees Configuration**
- **Settings Page:** New "Wing Annual Fees Configuration" section
- **Per-Wing Fees:** Set different annual fees for each wing:
  - Wing A: Default ₹50,000 (33 rooms, 3 students/room)
  - Wing B: Default ₹55,000 (7 rooms, 4 students/room)
  - Wing C: Default ₹45,000 (35 rooms, 2 students/room)
  - Wing D: Default ₹48,000 (9 rooms, 2 students/room)
- **Visual Table:** Shows room count and capacity per wing
- **Save Anytime:** Update fees and click "Save Fees" button
- **Database Storage:** Fees saved in Settings table for persistence

**Impact:** Different wings can have different fee structures based on facilities!

---

### 4. 🔍 **Enhanced Data Export with Filters**
- **College-Wise Export:** Filter by specific college before export
- **Year-Wise Export:** Filter by year of college (1st, 2nd, 3rd, etc.)
- **Faculty-Wise Export:** Filter by faculty/department
- **Academic Year Export:** Filter by hostel academic year
- **Filtered Export:** Only exports students matching current filters
- **Academic Year Column:** Added to Excel export automatically
- **Smart Validation:** Shows error if no students match filters

**Export Columns Include:**
- S.No, Student Name, Enrollment No, Mobile, Email
- Faculty, College Name, Year of College
- Wing, Room No, Student Type, Residency Status
- Joining Date, **Academic Year** (NEW!)
- Annual Fee, Total Paid, Pending Amount, Payment Status
- Number of Payments, Last Payment Date

**Impact:** Export exactly the data you need - by college, year, faculty, or academic year!

---

## 🛠️ Technical Improvements

### Database Enhancements
- Added `AcademicYear` interface with start/end year and label
- Added `WingFees` configuration type
- New utility functions:
  - `getAcademicYearFromDate()` - Calculate academic year from any date
  - `getCurrentAcademicYear()` - Get current 10-month hostel year
  - `generateAcademicYears(count)` - Generate multiple years for dropdown
  - `DEFAULT_WING_FEES` - Default fee structure per wing

### Import Processing
- Full FileReader integration for Excel/CSV parsing
- ArrayBuffer processing with XLSX library
- Column name normalization (handles variations)
- Number parsing with currency symbol removal
- Date normalization to ISO format
- Mobile number extraction from combined fields

### Filter Logic
- Added `collegeFilter`, `academicYearFilter` state variables
- Enhanced `filteredStudents` to check academic year matching
- College options generated from unique student colleges
- Academic year dropdown populated from last 5 years

### Settings Page
- New `wingFees` state management
- `loadWingFees()` - Fetch from database on mount
- `handleWingFeeChange()` - Update individual wing fees
- `saveWingFees()` - Persist to database with validation
- Material-UI Table for visual fee configuration

---

## 📊 Filter Examples

### Example 1: Engineering Faculty, 2nd Year Students
1. Select Faculty: "Engineering"
2. Select Year: "2nd Year"
3. Click "Export to Excel" → Only matching students exported

### Example 2: Academic Year 2024-25, Wing A
1. Select Academic Year: "2024-25"
2. Select Wing: "Wing A"
3. View filtered grid → Shows only students who joined in Aug 2024 - May 2025 in Wing A

### Example 3: Specific College Export
1. Select College: "XYZ College of Science"
2. Select Academic Year: "2023-24"
3. Export → Perfect for college-wise reports

---

## 🚀 How to Use New Features

### Bulk Import
1. Go to Students page
2. Click "Import Data" button
3. Select Excel file with hostel register data
4. Preview shows ALL records found
5. Click "Import X Records" to add all students

### Academic Year Filter
1. Go to Students page
2. Use "Academic Year" dropdown
3. Select "2024-25" or any year
4. Grid filters to show only students from that year

### Wing Fees Setup
1. Go to Settings page
2. Scroll to "Wing Annual Fees Configuration"
3. Edit fees for each wing (₹)
4. Click "Save Fees" button
5. New students will use these fees based on wing

### Filtered Export
1. Apply any filters (College, Faculty, Year, Academic Year, Wing)
2. Click "Export to Excel"
3. Excel file contains only filtered students
4. Academic year column included automatically

---

## 🐛 Bug Fixes from v2.0.4
- ✅ Fixed: Import now processes actual Excel file instead of sample data
- ✅ Fixed: All rows imported, not just first row
- ✅ Fixed: Export respects current filters
- ✅ Fixed: Academic year calculation for 10-month hostel year

---

## 📦 Installation

**File:** `Hostel Management System Setup 2.0.5.exe`  
**Size:** 106 MB  
**Location:** `dist-electron` folder

1. Close any running v2.0.4 instance
2. Double-click installer
3. Follow installation wizard
4. Launch application
5. Login: `admin` / `admin123`

---

## 🔄 Upgrade Notes

### From v2.0.4 to v2.0.5
- **Database:** Automatically adds wing fee settings
- **Compatibility:** All existing data preserved
- **Settings:** Wing fees default to standard values
- **Filters:** New filters available immediately

### Data Migration
- No manual migration needed
- Existing students retain all data
- Academic year calculated from joining dates
- Wing fees can be customized after install

---

## 📋 Summary of Changes

| Feature | Status | Description |
|---------|--------|-------------|
| Bulk Excel Import | ✅ Fixed | Now imports ALL rows from Excel files |
| Academic Year Filter | ✅ New | 10-month hostel year filtering (Aug-May) |
| Wing Annual Fees | ✅ New | Configure different fees per wing |
| Enhanced Export | ✅ New | Filter by college/year/faculty before export |
| Academic Year Column | ✅ New | Added to Excel exports |
| College Filter | ✅ New | Filter students by college name |

---

## 🎯 Next Steps

1. **Test Bulk Import:** Try importing your hostel register Excel file
2. **Configure Wing Fees:** Go to Settings and set fees for each wing
3. **Try Filters:** Use Academic Year filter to view year-wise data
4. **Export Reports:** Generate filtered Excel reports by college/faculty/year

---

## 💡 Tips

- **Excel Format:** Use column headers like "Student Name", "Mobile", "Wing", "Room", "Class", "Receipt No", "Reg.Fee", "Room Rent", etc.
- **Academic Year:** Automatically detected from joining date (June onwards = current year)
- **Wing Fees:** Update anytime in Settings, applies to new students
- **Filtered Export:** Apply filters BEFORE clicking Export to Excel

---

## 📞 Support

For issues or questions:
- Check import file format matches expected columns
- Verify academic year calculation (Aug-May cycle)
- Ensure wing fees saved before adding students
- Test filters one at a time for accuracy

---

**Enjoy the enhanced features in v2.0.5! 🎉**
