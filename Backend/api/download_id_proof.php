<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Application ID required']);
    exit();
}

try {
    $db = new Database();
    $conn = $db->getConnection();

    $stmt = $conn->prepare("SELECT id_proof_path, franchisee_name FROM franchise_applications WHERE id = ?");
    $stmt->execute([$_GET['id']]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Application not found']);
        exit();
    }

    $file_path = $application['id_proof_path'];

    // Handle both relative and absolute paths
    if (strpos($file_path, '../') === 0) {
        $file_path = str_replace('../', '', $file_path);
    }

    $full_path = __DIR__ . '/../' . $file_path;

    if (!file_exists($full_path)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'File not found: ' . $file_path]);
        exit();
    }

    // Get file info
    $file_extension = pathinfo($full_path, PATHINFO_EXTENSION);
    $file_name = 'ID_Proof_' . $application['franchisee_name'] . '.' . $file_extension;

    // Set headers for download
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $file_name . '"');
    header('Content-Length: ' . filesize($full_path));
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: public');

    // Output file
    readfile($full_path);
    exit();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>