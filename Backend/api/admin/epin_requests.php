<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);

// Only admin can access
if ($userData->role !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied"]);
    exit;
}

try {
    $query = "SELECT 
                er.id,
                er.package,
                er.quantity,
                er.amount,
                er.payment_mode,
                er.transaction_id,
                er.status,
                er.admin_remarks,
                er.screenshot,
                er.created_at,
                u.user_id as user_code,
                u.email as user_email,
                hu.name as user_name,
                hu.mobile
              FROM epin_requests er
              LEFT JOIN users u ON er.user_identity_id = u.id
              LEFT JOIN hierarchical_users hu ON u.id = hu.user_identity_id
              ORDER BY er.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Count by status
    $countQuery = "SELECT status, COUNT(*) as count FROM epin_requests GROUP BY status";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $counts = $countStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    echo json_encode([
        "success" => true,
        "data" => $requests,
        "counts" => [
            "pending" => $counts['Pending'] ?? 0,
            "approved" => $counts['Approved'] ?? 0,
            "rejected" => $counts['Rejected'] ?? 0,
            "total" => array_sum($counts)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error fetching requests: " . $e->getMessage()
    ]);
}
?>