<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    $status = $_GET['status'] ?? 'all';

    $sql = "SELECT * FROM franchise_applications";

    if ($status !== 'all') {
        $sql .= " WHERE application_status = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$status]);
    } else {
        $stmt = $conn->prepare($sql);
        $stmt->execute();
    }

    $sql .= " ORDER BY applied_at DESC";

    if ($status !== 'all') {
        $stmt = $conn->prepare($sql);
        $stmt->execute([$status]);
    } else {
        $stmt = $conn->prepare($sql);
        $stmt->execute();
    }

    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'applications' => $applications
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching applications: ' . $e->getMessage()
    ]);
}
?>