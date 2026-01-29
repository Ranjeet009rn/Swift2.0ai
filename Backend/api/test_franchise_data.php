<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$host = "localhost";
$db_name = "mlmswift";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check what's actually in hierarchical_franchise
    $query = "SELECT 
                hf.id,
                hf.franchise_name,
                hf.franchise_code,
                hf.franchise_type,
                hf.city,
                hf.state,
                hf.stock_value,
                hf.user_identity_id,
                u.email,
                u.user_id,
                fa.contact_person_name,
                fa.franchisee_name,
                fa.mobile_number,
                fa.application_status
              FROM hierarchical_franchise hf
              JOIN users u ON hf.user_identity_id = u.id
              LEFT JOIN franchise_applications fa ON u.email = fa.email
              WHERE u.role = 'franchise'
              LIMIT 5";

    $stmt = $conn->query($query);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "count" => count($data),
        "data" => $data
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>