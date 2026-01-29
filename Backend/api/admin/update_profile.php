<?php
require_once '../../config/database.php';
require_once '../../utils/auth_middleware.php';
require_once '../../utils/cors.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

// Verify admin authentication
$user = validateAuth($db);
if (!$user || $user->role !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

try {
    $userId = $user->id;
    $name = $data['name'] ?? '';
    $currentPassword = $data['currentPassword'] ?? '';
    $newPassword = $data['newPassword'] ?? '';

    // Validate name
    if (empty($name)) {
        throw new Exception('Name is required');
    }

    // Start transaction
    $db->beginTransaction();

    // Update admin name in user_id column (using it as display name for admin)
    $updateNameQuery = "UPDATE users SET user_id = :name WHERE id = :id";
    $nameStmt = $db->prepare($updateNameQuery);
    $nameStmt->bindParam(':name', $name);
    $nameStmt->bindParam(':id', $userId);
    $nameStmt->execute();

    // If password change is requested
    if (!empty($newPassword)) {
        if (empty($currentPassword)) {
            throw new Exception('Current password is required to change password');
        }

        // Verify current password
        $query = "SELECT password FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new Exception('User not found');
        }

        // Plain text comparison
        if ($currentPassword !== $row['password']) {
            throw new Exception('Current password is incorrect');
        }

        // Update password (plain text)
        $updateQuery = "UPDATE users SET password = :password WHERE id = :id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':password', $newPassword);
        $updateStmt->bindParam(':id', $userId);
        $updateStmt->execute();
    }

    $db->commit();

    // Get updated user data
    $getUserQuery = "SELECT id, user_id, email, role FROM users WHERE id = :id";
    $getUserStmt = $db->prepare($getUserQuery);
    $getUserStmt->bindParam(':id', $userId);
    $getUserStmt->execute();
    $updatedUser = $getUserStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'data' => [
            'user' => [
                'id' => $updatedUser['id'],
                'user_id' => $updatedUser['user_id'],
                'name' => $updatedUser['user_id'], // Using user_id as name for admin
                'email' => $updatedUser['email'],
                'role' => $updatedUser['role']
            ]
        ]
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>