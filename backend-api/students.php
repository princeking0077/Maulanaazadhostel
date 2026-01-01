<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        try {
            if ($id) {
                // Get single student
                $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
                $stmt->execute([$id]);
                $student = $stmt->fetch();
                
                if ($student) {
                    // Convert dates to proper format
                    $student['joiningDate'] = $student['joiningDate'] ?? null;
                    $student['stayEndDate'] = $student['stayEndDate'] ?? null;
                    sendJSON($student);
                } else {
                    sendJSON(['error' => 'Student not found'], 404);
                }
            } else {
                // Get all students
                $stmt = $pdo->query("SELECT * FROM students ORDER BY createdAt DESC");
                $students = $stmt->fetchAll();
                sendJSON($students);
            }
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'POST':
        try {
            $data = getRequestData();
            validateRequired($data, ['name', 'enrollmentNo']);
            
            $stmt = $pdo->prepare("
                INSERT INTO students (name, mobile, email, enrollmentNo, faculty, collegeName, 
                    yearOfCollege, address, residencyStatus, wing, roomNo, studentType, 
                    joiningDate, annualFee, stayDuration, stayEndDate, customAmount, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['name'],
                $data['mobile'] ?? '',
                $data['email'] ?? '',
                $data['enrollmentNo'],
                $data['faculty'] ?? '',
                $data['collegeName'] ?? '',
                $data['yearOfCollege'] ?? '',
                $data['address'] ?? '',
                $data['residencyStatus'] ?? 'Permanent',
                $data['wing'] ?? 'A',
                $data['roomNo'] ?? '',
                $data['studentType'] ?? 'Hosteller',
                $data['joiningDate'] ?? date('Y-m-d'),
                $data['annualFee'] ?? 50000,
                $data['stayDuration'] ?? '',
                $data['stayEndDate'] ?? null,
                $data['customAmount'] ?? 0,
                $data['status'] ?? 'Active'
            ]);
            
            sendJSON(['success' => true, 'id' => $pdo->lastInsertId()], 201);
        } catch(PDOException $e) {
            if ($e->getCode() == 23000) {
                sendJSON(['error' => 'Enrollment number already exists'], 409);
            }
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'PUT':
        try {
            if (!$id) sendJSON(['error' => 'Student ID required'], 400);
            
            $data = getRequestData();
            
            $stmt = $pdo->prepare("
                UPDATE students SET 
                    name=?, mobile=?, email=?, enrollmentNo=?, faculty=?, 
                    collegeName=?, yearOfCollege=?, address=?, residencyStatus=?, wing=?, 
                    roomNo=?, studentType=?, joiningDate=?, annualFee=?, stayDuration=?, 
                    stayEndDate=?, customAmount=?, status=?, updatedAt=NOW()
                WHERE id=?
            ");
            
            $stmt->execute([
                $data['name'],
                $data['mobile'] ?? '',
                $data['email'] ?? '',
                $data['enrollmentNo'],
                $data['faculty'] ?? '',
                $data['collegeName'] ?? '',
                $data['yearOfCollege'] ?? '',
                $data['address'] ?? '',
                $data['residencyStatus'] ?? 'Permanent',
                $data['wing'] ?? 'A',
                $data['roomNo'] ?? '',
                $data['studentType'] ?? 'Hosteller',
                $data['joiningDate'],
                $data['annualFee'] ?? 50000,
                $data['stayDuration'] ?? '',
                $data['stayEndDate'] ?? null,
                $data['customAmount'] ?? 0,
                $data['status'] ?? 'Active',
                $id
            ]);
            
            sendJSON(['success' => true]);
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'DELETE':
        try {
            if (!$id) sendJSON(['error' => 'Student ID required'], 400);
            
            $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
            $stmt->execute([$id]);
            
            sendJSON(['success' => true]);
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}
?>
