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

    // Check franchise users
    $query = "SELECT 
                u.id,
                u.user_id,
                u.email,
                u.password,
                u.role,
                hf.franchise_name,
                hf.franchise_code
              FROM users u
              LEFT JOIN hierarchical_franchise hf ON u.id = hf.user_identity_id
              WHERE u.role = 'franchise'";

    $stmt = $conn->query($query);
    $franchises = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "count" => count($franchises),
        "franchises" => $franchises
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>