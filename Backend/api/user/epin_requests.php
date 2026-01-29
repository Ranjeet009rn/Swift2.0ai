<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

try {
    // Determine if screenshot column exists to avoid errors if not running migration
    // But better to just select * or specific columns logic.
    // SELECT * is fine for this purpose.

    $query = "SELECT id, package, quantity, amount, payment_mode, transaction_id, status, created_at, admin_remarks, screenshot 
              FROM epin_requests 
              WHERE user_identity_id = :user_id 
              ORDER BY created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->execute();
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $requests]);

} catch (Exception $e) {
    // Fallback if table doesn't exist or column issue (though * would fail only if table missing)
    http_response_code(200); // Return 200 with empty data to avoid frontend crash
    echo json_encode(["success" => true, "data" => [], "message" => $e->getMessage()]);
}
?>