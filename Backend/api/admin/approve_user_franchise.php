<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $application_id = $data['application_id'] ?? null;
    $action = $data['action'] ?? null; // 'approve' or 'reject'
    $remarks = $data['remarks'] ?? '';

    if (!$application_id || !$action) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit();
    }

    if (!in_array($action, ['approve', 'reject'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        exit();
    }

    $db = new Database();
    $conn = $db->getConnection();

    // Get application details
    $stmt = $conn->prepare("SELECT user_id, user_name, franchisee_name FROM franchise_users WHERE id = ?");
    $stmt->execute([$application_id]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        echo json_encode(['success' => false, 'message' => 'Application not found']);
        exit();
    }

    $new_status = ($action === 'approve') ? 'approved' : 'rejected';

    // Update application status
    $sql = "UPDATE franchise_users 
            SET application_status = ?,
                admin_remarks = ?,
                approved_at = NOW(),
                approved_by = 'admin',
                updated_at = NOW()
            WHERE id = ?";

    $stmt = $conn->prepare($sql);
    $result = $stmt->execute([$new_status, $remarks, $application_id]);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Application ' . $new_status . ' successfully',
            'status' => $new_status
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update application']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>