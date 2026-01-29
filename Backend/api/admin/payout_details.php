<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
if ($userData->role !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied"]);
    exit();
}

// Get payout ID from query parameter
$payoutId = isset($_GET['payout_id']) ? intval($_GET['payout_id']) : null;

if (!$payoutId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Payout ID is required"]);
    exit();
}

try {
    // Fetch payout details with user information
    $query = "SELECT 
                pd.*,
                u.user_id,
                u.email,
                hu.name as user_name,
                bd.account_number,
                bd.bank_name,
                bd.ifsc_code
              FROM payout_details pd
              JOIN users u ON pd.user_identity_id = u.id
              LEFT JOIN hierarchical_users hu ON u.id = hu.user_identity_id
              LEFT JOIN bank_details bd ON u.id = bd.user_identity_id
              WHERE pd.payout_id = ?
              ORDER BY pd.amount DESC";

    $stmt = $db->prepare($query);
    $stmt->execute([$payoutId]);
    $details = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the data
    $formattedDetails = array_map(function ($detail) {
        return [
            'id' => $detail['id'],
            'user_id' => $detail['user_id'],
            'user_name' => $detail['user_name'] ?? 'N/A',
            'email' => $detail['email'],
            'amount' => floatval($detail['amount']),
            'status' => $detail['status'],
            'payment_method' => $detail['payment_method'],
            'transaction_reference' => $detail['transaction_reference'],
            'bank_account' => $detail['account_number'] ?? 'N/A',
            'bank_name' => $detail['bank_name'] ?? 'N/A',
            'ifsc_code' => $detail['ifsc_code'] ?? 'N/A',
            'paid_at' => $detail['paid_at']
        ];
    }, $details);

    echo json_encode([
        "success" => true,
        "data" => $formattedDetails,
        "meta" => [
            "count" => count($formattedDetails),
            "payout_id" => $payoutId
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch payout details: " . $e->getMessage()
    ]);
}
?>