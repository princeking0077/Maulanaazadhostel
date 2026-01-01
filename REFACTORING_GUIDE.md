# Hostel Management System Refactoring Guide (v2.3.0 Draft)

This guide documents structural changes implementing payment-first and installment workflows.

## 1. Payment-First Workflow
- New endpoint: `backend-api/pending-payments.php` allows capturing a payment before student registration.
- Table: `pending_payments` stores temporary payments keyed by `tempReference`.
- Link workflow: After student is created, send PUT to pending-payments with `studentId`.

## 2. Installment System
- Tables `student_fees` + `payment_receipts` track aggregated and per-installment data.
- First installment must include `totalFee` creating `student_fees` row.
- Each POST to `receipts.php` updates cumulative paid/pending and derives status.

## 3. Receipt Number Generation
- Yearly sequences stored in `receipt_sequence` with row per year.
- Atomic generation using transaction + SELECT ... FOR UPDATE.
- Format: `YYYY-####` (e.g. 2025-0001). Manual override supported via `manualReceiptNumber`.

## 4. Manual Receipt Entry
- `manualReceiptNumber` triggers uniqueness check, sets `isManual=1`.
- Both manual and auto entries stored in `payment_receipts`.

## 5. Academic Year & Renewal
- Students now have `academicYear`, `currentYear`, `category`, `renewalStatus` columns.
- Renewal/promotion endpoints still pending (TODO #7) to manipulate `student_history`.

## 6. Status Calculation
- Derived statuses: `Unpaid`, `Partially Paid`, `Paid` maintained in `student_fees`.
- Snapshot fields (`totalFeeSnapshot`, `paidAmountToDate`, `pendingAmountAfter`) stored per receipt.

## 7. Non-Hosteller Support
- `category` column differentiates `Hosteller` vs `Non-Hosteller` (filter integration pending).

## 8. Date Formatting & Academic Period
- Frontend utilities in `src/utils/dateUtils.ts` provide: `formatDateDDMonthYYYY`, `calculateAcademicPeriodEnd`, `getRemainingPeriod`.

## 9. Frontend Components
- `ManualReceiptForm` (add first or subsequent installment; supports manual receipt).
- `NextInstallmentForm` (quick generation of next payment).
- Further components for linking pending payment & printing receipts are TODO.

## 10. Pending Items (Open TODOs)
- Renewal / promotion endpoint & UI.
- Non-hosteller filters + billing separation.
- Print template components & PDF generation.
- IndexedDB (Dexie) schema extension.
- Dashboard integration & alerts (<30 days remaining / pending fees).

## 11. Migration Notes
- Run updated `database.sql` to append new tables and alters.
- Existing payment logic (`payments.php`) remains untouched; consider deprecation after migration.
- For legacy data, batch script should populate `student_fees` with `totalFee=annualFees`, `paidAmount` aggregated from historic payments.

## 12. API Usage Examples
### Create First Installment
POST `/backend-api/receipts.php`
```
{
  "studentId": 42,
  "academicYear": "2025-26",
  "totalFee": 40000,
  "paymentAmount": 10000,
  "paymentDate": "2025-01-15",
  "paymentMode": "Cash"
}
```
### Add Subsequent Installment
```
{
  "studentId": 42,
  "academicYear": "2025-26",
  "paymentAmount": 15000,
  "paymentDate": "2025-02-14",
  "paymentMode": "UPI"
}
```
### Manual Receipt
```
{
  "studentId": 42,
  "academicYear": "2025-26",
  "paymentAmount": 5000,
  "paymentDate": "2025-02-20",
  "manualReceiptNumber": "OFFLINE-9876",
  "paymentMode": "Cash",
  "notes": "Cash received previous day"
}
```
### Pending Payment (before student)
```
{
  "tempReference": "+919999888877",
  "paymentAmount": 8000,
  "paymentDate": "2025-01-10",
  "paymentMode": "Cash",
  "notes": "Advance"
}
```

## 13. Next Steps
Prioritize endpoint for renewal/promotion and dashboard integration to surface fee & period statuses.

---
Prepared automatically by refactor tasks (draft). Update as features finalize.
