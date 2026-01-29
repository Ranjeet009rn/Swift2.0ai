<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/jwt.php';

handleCors();

$database = new Database();
$db = $database->getConnection();
$jwtHandler = new JWTHandler();

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$arr = explode(" ", $authHeader);
$jwt = $arr[1] ?? '';

if (!$jwt) {
    http_response_code(401);
    echo json_encode(array("message" => "Access denied."));
    exit;
}

try {
    $decoded = $jwtHandler->validate($jwt);
    $userId = $decoded->data->id;

    $query = "SELECT * FROM product_orders WHERE user_identity_id = ? ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $userId);
    $stmt->execute();

    $orders = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Fetch items for each order
        $itemQ = "SELECT * FROM product_order_items WHERE order_id = ?";
        $itemStmt = $db->prepare($itemQ);
        $itemStmt->bindParam(1, $row['id']);
        $itemStmt->execute();
        $row['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        $orders[] = $row;
    }

    echo json_encode(array(
        "success" => true,
        "orders" => $orders
    ));

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => $e->getMessage()));
}
?>