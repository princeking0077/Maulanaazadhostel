<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
  case 'GET':
    try {
      if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM pending_payments WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        sendJSON($row ?: ['error' => 'Pending payment not found'], $row ? 200 : 404);
      } else {
        $stmt = $pdo->query("SELECT * FROM pending_payments WHERE isLinked = 0 ORDER BY createdAt DESC");
        sendJSON($stmt->fetchAll());
      }
    } catch (Exception $e) {
      sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
    break;

  case 'POST':
    try {
      $data = getRequestData();
      validateRequired($data, ['tempReference','paymentAmount','paymentDate']);
      $stmt = $pdo->prepare("INSERT INTO pending_payments (tempReference, paymentAmount, paymentDate, paymentMode, notes, academicYear) VALUES (?,?,?,?,?,?)");
      $stmt->execute([
        $data['tempReference'],
        $data['paymentAmount'],
        $data['paymentDate'],
        $data['paymentMode'] ?? 'Cash',
        $data['notes'] ?? '',
        $data['academicYear'] ?? null
      ]);
      sendJSON(['success' => true, 'id' => $pdo->lastInsertId()], 201);
    } catch (Exception $e) {
      sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
    break;

  case 'PUT':
    try {
      if (!$id) { sendJSON(['error' => 'id required'], 400); return; }
      $data = getRequestData();
      // Link to student
      if (!isset($data['studentId'])) { sendJSON(['error' => 'studentId required to link'], 400); return; }
      $stmt = $pdo->prepare("UPDATE pending_payments SET linkedStudentId = ?, isLinked = 1 WHERE id = ?");
      $stmt->execute([$data['studentId'], $id]);
      sendJSON(['success' => true]);
    } catch (Exception $e) {
      sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
    break;

  case 'DELETE':
    try {
      if (!$id) { sendJSON(['error' => 'id required'], 400); return; }
      $stmt = $pdo->prepare("DELETE FROM pending_payments WHERE id = ?");
      $stmt->execute([$id]);
      sendJSON(['success' => true]);
    } catch (Exception $e) {
      sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
    break;

  default:
    sendJSON(['error' => 'Method not allowed'], 405);
}
?>
