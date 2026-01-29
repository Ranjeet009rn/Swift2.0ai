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

    $tables = [
        'earnings',
        'withdrawals',
        'transactions',
        'payouts',
        'wallets',
        'hierarchical_users',
        'hierarchical_franchise'
    ];

    $results = [];

    foreach ($tables as $table) {
        try {
            $stmt = $conn->query("SELECT COUNT(*) as count FROM $table");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $results[$table] = [
                'exists' => true,
                'count' => $row['count']
            ];
        } catch (PDOException $e) {
            $results[$table] = [
                'exists' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "tables" => $results
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>