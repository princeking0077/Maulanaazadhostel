<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth();
$pdo = getDBConnection();

// GET all students or search
if ($method === 'GET' && !isset($_GET['id'])) {
    $query = 'SELECT * FROM students';
    $params = [];
    
    // Search functionality
    if (isset($_GET['search'])) {
        $search = '%' . $_GET['search'] . '%';
        $query .= ' WHERE name LIKE ? OR enrollment_no LIKE ? OR mobile LIKE ?';
        $params = [$search, $search, $search];
    }
    
    // Filter by wing
    if (isset($_GET['wing'])) {
        $query .= (strpos($query, 'WHERE') !== false ? ' AND' : ' WHERE') . ' wing = ?';
        $params[] = $_GET['wing'];
    }
    
    // Filter by status
    if (isset($_GET['status'])) {
        $query .= (strpos($query, 'WHERE') !== false ? ' AND' : ' WHERE') . ' status = ?';
        $params[] = $_GET['status'];
    }
    
    $query .= ' ORDER BY id DESC';
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $students = $stmt->fetchAll();
    
    sendJSON($students);
}

// GET single student
if ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT * FROM students WHERE id = ?');
    $stmt->execute([$_GET['id']]);
    $student = $stmt->fetch();
    
    if (!$student) {
        sendError('Student not found', 404);
    }
    
    sendJSON($student);
}

// CREATE student
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['name', 'mobile', 'email', 'enrollment_no', 'faculty', 'college_name', 
                 'year_of_college', 'address', 'wing', 'room_no', 'student_type', 'joining_date', 'annual_fee'];
    
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            sendError("Field $field is required", 400);
        }
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO students (
                name, mobile, email, enrollment_no, faculty, college_name, year_of_college,
                address, residency_status, wing, room_no, student_type, joining_date, annual_fee,
                admission_status, security_deposit, is_old_student, status, vacated_date, remarks,
                stay_duration, stay_end_date, custom_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $data['name'],
            $data['mobile'],
            $data['email'],
            $data['enrollment_no'],
            $data['faculty'],
            $data['college_name'],
            $data['year_of_college'],
            $data['address'],
            $data['residency_status'] ?? 'Permanent',
            $data['wing'],
            $data['room_no'],
            $data['student_type'],
            $data['joining_date'],
            $data['annual_fee'],
            $data['admission_status'] ?? 'Active',
            $data['security_deposit'] ?? 0,
            $data['is_old_student'] ?? 0,
            $data['status'] ?? 'Active',
            $data['vacated_date'] ?? null,
            $data['remarks'] ?? '',
            $data['stay_duration'] ?? null,
            $data['stay_end_date'] ?? null,
            $data['custom_amount'] ?? null
        ]);
        
        sendJSON(['id' => $pdo->lastInsertId(), 'message' => 'Student created successfully'], 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            sendError('Enrollment number already exists', 409);
        }
        sendError('Failed to create student: ' . $e->getMessage(), 500);
    }
}

// UPDATE student
if ($method === 'PUT' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('
        UPDATE students SET
            name = ?, mobile = ?, email = ?, faculty = ?, college_name = ?,
            year_of_college = ?, address = ?, residency_status = ?, wing = ?,
            room_no = ?, student_type = ?, annual_fee = ?, admission_status = ?,
            security_deposit = ?, is_old_student = ?, status = ?, vacated_date = ?,
            remarks = ?, stay_duration = ?, stay_end_date = ?, custom_amount = ?
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['name'],
        $data['mobile'],
        $data['email'],
        $data['faculty'],
        $data['college_name'],
        $data['year_of_college'],
        $data['address'],
        $data['residency_status'] ?? 'Permanent',
        $data['wing'],
        $data['room_no'],
        $data['student_type'],
        $data['annual_fee'],
        $data['admission_status'] ?? 'Active',
        $data['security_deposit'] ?? 0,
        $data['is_old_student'] ?? 0,
        $data['status'] ?? 'Active',
        $data['vacated_date'] ?? null,
        $data['remarks'] ?? '',
        $data['stay_duration'] ?? null,
        $data['stay_end_date'] ?? null,
        $data['custom_amount'] ?? null,
        $id
    ]);
    
    sendJSON(['message' => 'Student updated successfully']);
}

// DELETE student
if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('DELETE FROM students WHERE id = ?');
    $stmt->execute([$id]);
    
    sendJSON(['message' => 'Student deleted successfully']);
}
?>
