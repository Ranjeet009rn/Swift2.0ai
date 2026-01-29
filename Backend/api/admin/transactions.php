<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
// Check if admin
if ($userData->role !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied"]);
    exit;
}

// Fetch all earnings/transactions
$query = "SELECT e.*, u.name as user_name, u.referral_code as user_id 
          FROM earnings e 
          JOIN users u ON e.user_id = u.id 
          ORDER BY e.created_at DESC";

$transactions = [];
try {
    $stmt = $db->prepare($query);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($results as $row) {
        $transactions[] = [
            "id" => "TXN" . $row['id'],
            "user" => $row['user_name'],
            "type" => "Credit", // Earnings are usually credits. Withdrawals check would be needed for Debit.
            "category" => ucwords(str_replace('_', ' ', $row['source_type'])),
            "amount" => $row['amount'],
            "date" => date("Y-m-d h:i A", strtotime($row['created_at'])),
            "status" => $row['status']
        ];
    }
} catch (Exception $e) {
    // Return empty if table issues
}

echo json_encode(["success" => true, "data" => $transactions]);
?>