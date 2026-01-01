<?php
require_once 'config.php';

function nextReceiptNumber(PDO $pdo): string {
    $year = date('Y');
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT currentValue FROM receipt_sequence WHERE yearKey = ? FOR UPDATE");
        $stmt->execute([$year]);
        $val = $stmt->fetchColumn();
        if ($val === false) {
            $pdo->prepare("INSERT INTO receipt_sequence (yearKey, currentValue) VALUES (?,0)")->execute([$year]);
            $val = 0;
        }
        $newVal = ((int)$val) + 1;
        $pdo->prepare("UPDATE receipt_sequence SET currentValue = ? WHERE yearKey = ?")->execute([$newVal, $year]);
        $pdo->commit();
        return $year . '-' . str_pad((string)$newVal, 4, '0', STR_PAD_LEFT);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        // List or single receipt
        try {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM payment_receipts WHERE id = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                sendJSON($row ?: ['error' => 'Receipt not found'], $row ? 200 : 404);
            } else {
                $studentId = $_GET['studentId'] ?? null;
                $year = $_GET['academicYear'] ?? null;
                $category = $_GET['category'] ?? null; // Hosteller / Non-Hosteller
                $query = "SELECT pr.*, s.category, s.name FROM payment_receipts pr LEFT JOIN students s ON pr.studentId = s.id WHERE 1=1";
                $params = [];
                if ($studentId) { $query .= " AND pr.studentId = ?"; $params[] = $studentId; }
                if ($year) { $query .= " AND pr.academicYear = ?"; $params[] = $year; }
                if ($category) { $query .= " AND s.category = ?"; $params[] = $category; }
                $query .= " ORDER BY pr.paymentDate DESC, pr.id DESC";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                sendJSON($stmt->fetchAll());
            }
        } catch (Exception $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;

    case 'POST':
        try {
            $data = getRequestData();
            // Manual or auto receipt number
            $manualReceipt = $data['manualReceiptNumber'] ?? null;
            $isManual = isset($manualReceipt) && $manualReceipt !== '';

            $studentId = $data['studentId'] ?? null; // may be null for pending-first
            $academicYear = $data['academicYear'] ?? date('Y') . '-' . (date('Y') + 1);
            $paymentAmount = (float)($data['paymentAmount'] ?? 0);
            $paymentDate = $data['paymentDate'] ?? date('Y-m-d');
            $paymentMode = $data['paymentMode'] ?? 'Cash';
            $totalFee = isset($data['totalFee']) ? (float)$data['totalFee'] : null; // only on first installment
            $notes = $data['notes'] ?? '';
            $createdBy = $data['createdBy'] ?? 'System';

            if ($paymentAmount <= 0) {
                sendJSON(['error' => 'paymentAmount must be > 0'], 400); return;
            }

            if (!$studentId && empty($data['tempReference'])) {
                sendJSON(['error' => 'studentId or tempReference required'], 400); return;
            }

            if ($isManual) {
                // Ensure uniqueness
                $stmt = $pdo->prepare("SELECT id FROM payment_receipts WHERE receiptNumber = ?");
                $stmt->execute([$manualReceipt]);
                if ($stmt->fetch()) { sendJSON(['error' => 'Manual receipt number already exists'], 409); return; }
                $receiptNumber = $manualReceipt;
            } else {
                $receiptNumber = nextReceiptNumber($pdo);
            }

            if (!$studentId) {
                // Record pending payment
                $tempRef = $data['tempReference'];
                $stmt = $pdo->prepare("INSERT INTO pending_payments (tempReference, paymentAmount, paymentDate, paymentMode, notes, academicYear) VALUES (?,?,?,?,?,?)");
                $stmt->execute([$tempRef, $paymentAmount, $paymentDate, $paymentMode, $notes, $academicYear]);
                sendJSON([
                    'success' => true,
                    'pendingPaymentId' => $pdo->lastInsertId(),
                    'receiptNumber' => $receiptNumber,
                    'message' => 'Pending payment stored; link when student is registered.'
                ], 201);
                return;
            }

            // Handle student fee record
            $stmt = $pdo->prepare("SELECT * FROM student_fees WHERE studentId = ? AND academicYear = ?");
            $stmt->execute([$studentId, $academicYear]);
            $feeRow = $stmt->fetch();

            if (!$feeRow) {
                if ($totalFee === null) { sendJSON(['error' => 'totalFee required for first installment'], 400); return; }
                $paidAmount = $paymentAmount;
                $pendingAmount = max($totalFee - $paidAmount, 0);
                $status = $pendingAmount <= 0 ? 'Paid' : ($paidAmount > 0 ? 'Partially Paid' : 'Unpaid');
                $stmt = $pdo->prepare("INSERT INTO student_fees (studentId, academicYear, totalFee, paidAmount, pendingAmount, status, lastPaymentDate) VALUES (?,?,?,?,?,?,?)");
                $stmt->execute([$studentId, $academicYear, $totalFee, $paidAmount, $pendingAmount, $status, $paymentDate]);
                $feeRow = [
                    'totalFee' => $totalFee,
                    'paidAmount' => $paidAmount,
                    'pendingAmount' => $pendingAmount,
                    'status' => $status
                ];
                $installmentNumber = 1;
            } else {
                // Update existing
                if ($totalFee !== null && $totalFee != $feeRow['totalFee']) {
                    // Adjust total fee if changed
                    $feeRow['totalFee'] = $totalFee;
                }
                $newPaid = (float)$feeRow['paidAmount'] + $paymentAmount;
                $pendingAmount = max((float)$feeRow['totalFee'] - $newPaid, 0);
                $status = $pendingAmount <= 0 ? 'Paid' : ($newPaid > 0 ? 'Partially Paid' : 'Unpaid');
                $stmt = $pdo->prepare("UPDATE student_fees SET totalFee = ?, paidAmount = ?, pendingAmount = ?, status = ?, lastPaymentDate = ? WHERE studentId = ? AND academicYear = ?");
                $stmt->execute([$feeRow['totalFee'], $newPaid, $pendingAmount, $status, $paymentDate, $studentId, $academicYear]);
                // Count existing installments
                $cntStmt = $pdo->prepare("SELECT COUNT(*) FROM payment_receipts WHERE studentId = ? AND academicYear = ?");
                $cntStmt->execute([$studentId, $academicYear]);
                $installmentNumber = ((int)$cntStmt->fetchColumn()) + 1;
                $feeRow['paidAmount'] = $newPaid;
                $feeRow['pendingAmount'] = $pendingAmount;
                $feeRow['status'] = $status;
            }

            $stmt = $pdo->prepare("INSERT INTO payment_receipts (studentId, academicYear, receiptNumber, installmentNumber, paymentAmount, totalFeeSnapshot, paidAmountToDate, pendingAmountAfter, paymentDate, paymentMode, isManual, manualReceiptProvided, notes, createdBy) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $studentId,
                $academicYear,
                $receiptNumber,
                $installmentNumber,
                $paymentAmount,
                $feeRow['totalFee'],
                $feeRow['paidAmount'],
                $feeRow['pendingAmount'],
                $paymentDate,
                $paymentMode,
                $isManual ? 1 : 0,
                $isManual ? 1 : 0,
                $notes,
                $createdBy
            ]);

            sendJSON([
                'success' => true,
                'receiptNumber' => $receiptNumber,
                'installmentNumber' => $installmentNumber,
                'feeStatus' => $feeRow['status'],
                'paidAmount' => $feeRow['paidAmount'],
                'pendingAmount' => $feeRow['pendingAmount']
            ], 201);
        } catch (Exception $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}
?>
