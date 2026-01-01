# Hostel Register Import Template

## Import Format Guide

The system can import Excel/CSV files with hostel register data in the following format:

### Required Columns (in this order):

1. **Sr.No** - Serial Number
2. **Name of Student & Mobile** - Student name followed by mobile number (separated by comma)
3. **Wing & Room** - Wing and room number (e.g., "C-06")
4. **Class** - Student's class/course
5. **Date of Joining** - Date format: DD.MM.YYYY or MM/DD/YYYY
6. **Receipt No.** - Receipt number
7. **Receipt Date** - Receipt date
8. **Reg. Fee** - Registration fee amount
9. **Room Rent** - Room rent amount
10. **Water & Electricity Charges** - Utility charges
11. **Other Activity** - Other activity charges
12. **Total Fees Collection** - Total amount
13. **Approved Hostel Fees** - Approved fees
14. **Outstanding Fee** - Balance/outstanding amount
15. **Remark** - Any remarks
16. **Security Deposit** - Security deposit amount

### Sample Data Format:

| Sr.No | Name of Student & Mobile | Wing & Room | Class | Date of Joining | Receipt No. | Receipt Date | Reg.Fee | Room Rent | Water & Electricity Charges | Other Activity | Total Fees Collection | Approved Hostel Fees | Outstanding Fee | Remark | Security Deposit |
|-------|-------------------------|-------------|-------|----------------|------------|-------------|---------|-----------|----------------------------|---------------|---------------------|---------------------|----------------|--------|-----------------|
| 17 | Mohd Wahid Mohd Sadique, at. By pass road rohinkhed Tq. Motala, 8482914403, 9372272981 | C-06 | B.Sc. Comp. I | 08.07.2025 to 09.05.2026 | 6774 | 08.07.2025 | 500 | 3000 | 3000 | 0 | 6500 | 14500 | 4000 | UPI | 1500 |

### Important Notes:

1. **Student Name & Mobile**: Format should be "Name, address, mobile1, mobile2" - the system will extract the name and last mobile number
2. **Wing & Room**: Use format like "C-06", "A-12", etc. The system will split wing and room number automatically  
3. **Date Format**: Use DD.MM.YYYY format or standard date formats
4. **Numbers**: All fee amounts should be numbers only (no currency symbols)
5. **File Format**: Excel (.xlsx, .xls) or CSV files are supported

### How to Import:

1. Go to **Students** page
2. Click **Import Data** button
3. Upload your Excel/CSV file
4. Preview the data to verify it's parsed correctly
5. Click **Import** to add all records

The system will:
- Create student records with all personal details
- Create payment records for each student
- Calculate outstanding balances automatically
- Handle duplicate detection

### Template Download:

You can export existing data to see the exact format, or create a new file following the column structure above.