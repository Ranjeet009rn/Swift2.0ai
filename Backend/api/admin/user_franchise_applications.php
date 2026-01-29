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

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Get all franchise applications from franchise_users table
    $sql = "SELECT 
        id,
        user_id,
        user_name,
        franchisee_name,
        contact_person_name,
        mobile_number,
        franchise_type,
        area_territory,
        city,
        state,
        application_status,
        created_at,
        approved_at,
        admin_remarks
    FROM franchise_users
    ORDER BY 
        CASE application_status
            WHEN 'pending' THEN 1
            WHEN 'approved' THEN 2
            WHEN 'rejected' THEN 3
        END,
        created_at DESC";

    $stmt = $conn->query($sql);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'applications' => $applications,
        'total' => count($applications)
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>