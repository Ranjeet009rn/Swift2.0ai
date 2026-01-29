<?php
// API to fetch all packages
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

require_once '../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    $query = "SELECT * FROM packages ORDER BY price ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $packages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch products for each package
    foreach ($packages as &$pkg) {
        $pStmt = $conn->prepare("SELECT product_name, type FROM package_products WHERE package_id = ?");
        $pStmt->execute([$pkg['id']]);
        $pkg['products'] = $pStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    unset($pkg); // Break reference

    // Format response
    $response = [
        'success' => true,
        'packages' => array_map(function ($pkg) {
            return [
                'id' => $pkg['id'],
                'name' => $pkg['name'],
                'price' => (float) $pkg['price'],
                'pv' => (float) $pkg['pv'],
                'is_combo_fixed' => (bool) $pkg['is_combo_fixed'],
                'products' => $pkg['products'], // Include products
                'label' => $pkg['name'] . ' - ₹' . number_format($pkg['price'])
            ];
        }, $packages)
    ];

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>