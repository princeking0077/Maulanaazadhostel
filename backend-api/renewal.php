<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
  sendJSON(['error' => 'Method not allowed'], 405);
  exit;
}

try {
  $data = getRequestData();
  validateRequired($data, ['studentId','newAcademicYear','action','newTotalFee']);

  $studentId = (int)$data['studentId'];
  $newAcademicYear = $data['newAcademicYear']; // e.g. 2025-26
  $action = $data['action']; // Renewed | Promoted
  $newTotalFee = (float)$data['newTotalFee'];
  $remarks = $data['remarks'] ?? '';

  if (!in_array($action, ['Renewed','Promoted'], true)) {
    sendJSON(['error' => 'Invalid action'], 400); return;
  }

  // Fetch student
  $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
  $stmt->execute([$studentId]);
  $student = $stmt->fetch();
  if (!$student) { sendJSON(['error' => 'Student not found'], 404); return; }

  // Derive previous academic year from existing student academicYear if present, else fallback
  $previousAcademicYear = $student['academicYear'] ?? '';

  // Ensure no duplicate fee record for new year
  $feeCheck = $pdo->prepare("SELECT id FROM student_fees WHERE studentId = ? AND academicYear = ?");
  $feeCheck->execute([$studentId, $newAcademicYear]);
  if ($feeCheck->fetch()) { sendJSON(['error' => 'Fee record for new academic year already exists'], 409); return; }

  $pdo->beginTransaction();

  // Insert history
  $hist = $pdo->prepare("INSERT INTO student_history (studentId, previousAcademicYear, newAcademicYear, renewalDate, oldTotalFee, newTotalFee, action, remarks) VALUES (?,?,?,?,?,?,?,?)");
  $hist->execute([
    $studentId,
    $previousAcademicYear,
    $newAcademicYear,
    date('Y-m-d'),
    $student['annualFees'] ?? 0,
    $newTotalFee,
    $action,
    $remarks
  ]);

  // Update student record with new academicYear and renewalStatus
  $upd = $pdo->prepare("UPDATE students SET academicYear = ?, renewalStatus = ?, updatedAt = NOW() WHERE id = ?");
  $upd->execute([$newAcademicYear, $action === 'Renewed' ? 'Renewed' : 'Promoted', $studentId]);

  // Create new fee tracking row (status Unpaid initially)
  $feeIns = $pdo->prepare("INSERT INTO student_fees (studentId, academicYear, totalFee, paidAmount, pendingAmount, status) VALUES (?,?,?,?,?,?)");
  $feeIns->execute([$studentId, $newAcademicYear, $newTotalFee, 0, $newTotalFee, 'Unpaid']);

  $pdo->commit();
  sendJSON(['success' => true, 'historyId' => $pdo->lastInsertId(), 'academicYear' => $newAcademicYear]);
} catch (Exception $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
