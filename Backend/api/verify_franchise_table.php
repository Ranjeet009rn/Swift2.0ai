<?php
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Check if table exists
    $stmt = $conn->query("SHOW TABLES LIKE 'franchise_applications'");
    $tableExists = $stmt->fetch() !== false;

    if (!$tableExists) {
        echo json_encode([
            'success' => false,
            'message' => 'Table does not exist',
            'action' => 'Please run the SQL file again'
        ]);
        exit();
    }

    // Get table structure
    $stmt = $conn->query("DESCRIBE franchise_applications");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'table_exists' => true,
        'columns' => $columns
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>