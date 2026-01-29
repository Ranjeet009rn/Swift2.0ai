<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../models/User.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Get user from token
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

    if (!$token) {
        echo json_encode(['success' => false, 'message' => 'No token provided']);
        exit();
    }

    // Decode token to get user_id
    $user_id = null;
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ?");
    $stmt->execute([$token]); // Simplified - in production use proper JWT
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
        exit();
    }

    $user_id = $user['user_id'];

    // Check if user has a franchise application
    $stmt = $conn->prepare("
        SELECT 
            id,
            franchisee_name,
            application_status,
            created_at
        FROM franchise_users
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    ");

    $stmt->execute([$user_id]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        echo json_encode([
            'success' => true,
            'status' => null,
            'approved' => false,
            'message' => 'No application found'
        ]);
        exit();
    }

    $approved = ($application['application_status'] === 'approved');

    echo json_encode([
        'success' => true,
        'status' => $application['application_status'],
        'approved' => $approved,
        'franchisee_name' => $application['franchisee_name'],
        'application_date' => $application['created_at']
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>