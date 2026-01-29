<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);

if ($userData->role !== 'franchise') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied."));
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 1. Get Inventory Summary
    $qInv = "SELECT * FROM franchise_inventory WHERE franchise_user_id = ?";
    $sInv = $db->prepare($qInv);
    $sInv->bindParam(1, $userData->id);
    $sInv->execute();
    $inventory = $sInv->fetchAll(PDO::FETCH_ASSOC);

    // If empty to start with, maybe return some mock structure with 0 balance or packages list
    if (empty($inventory)) {
        // Fetch packages to show 0 balance
        $qPkg = "SELECT id, package_name, price FROM packages";
        $sPkg = $db->prepare($qPkg);
        $sPkg->execute();
        $packages = $sPkg->fetchAll(PDO::FETCH_ASSOC);

        $inventory = [];
        foreach ($packages as $pkg) {
            $inventory[] = [
                "id" => $pkg['id'],
                "package_name" => $pkg['package_name'],
                "quantity" => 0,
                "total_purchased" => 0,
                "total_issued" => 0,
                "price" => $pkg['price']
            ];
        }
    }

    // 2. Get Transaction History
    $qHist = "SELECT * FROM franchise_transactions WHERE franchise_user_id = ? ORDER BY created_at DESC LIMIT 50";
    $sHist = $db->prepare($qHist);
    $sHist->bindParam(1, $userData->id);
    $sHist->execute();
    $history = $sHist->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(array(
        "success" => true,
        "inventory" => $inventory,
        "history" => $history
    ));
}
?>