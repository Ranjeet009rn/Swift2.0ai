<?php
require_once '../../config/database.php';
require_once '../../utils/auth_middleware.php';
require_once '../../utils/cors.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$user = validateAuth($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->current_password) && !empty($data->new_password)) {

    // Verify current password (PLAIN TEXT)
    $query = "SELECT password FROM users WHERE id = :id LIMIT 0,1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $user->id);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row['password'] !== $data->current_password) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Current password is incorrect."));
        exit;
    }

    // Update to new password (PLAIN TEXT)
    $updateQuery = "UPDATE users SET password = :password WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':password', $data->new_password);
    $updateStmt->bindParam(':id', $user->id);

    if ($updateStmt->execute()) {
        http_response_code(200);
        echo json_encode(array("success" => true, "message" => "Password updated successfully."));
    } else {
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to update password."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete data."));
}
?>