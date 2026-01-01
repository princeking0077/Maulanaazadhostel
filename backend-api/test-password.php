<?php
// Test password hashing and verification

$password = 'admin123';
$hashFromDB = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

echo "Testing password verification:\n";
echo "Password: admin123\n";
echo "Hash from database.sql: $hashFromDB\n\n";

// Test if the hash verifies
if (password_verify($password, $hashFromDB)) {
    echo "✓ Password verification SUCCESSFUL\n";
} else {
    echo "✗ Password verification FAILED\n";
    echo "\nGenerating new hash for 'admin123':\n";
    $newHash = password_hash('admin123', PASSWORD_BCRYPT);
    echo "New hash: $newHash\n\n";
    echo "SQL to update database:\n";
    echo "UPDATE users SET password = '$newHash' WHERE username = 'admin';\n";
}
?>
