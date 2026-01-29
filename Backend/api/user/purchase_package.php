<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$userId = $userData->id;

$data = json_decode(file_get_contents("php://input"));
$packageId = $data->package_id;
$paymentMethod = $data->payment_method; // 'wallet'

if (empty($packageId)) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Package ID is required."));
    exit();
}

// 1. Get Package Details
$query = "SELECT * FROM packages WHERE id = ? AND status = 'active' LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(1, $packageId);
$stmt->execute();
$package = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$package) {
    http_response_code(404);
    echo json_encode(array("success" => false, "message" => "Package not found."));
    exit();
}

try {
    $db->beginTransaction();

    if ($paymentMethod === 'wallet') {
        // 2. Check Wallet Balance
        $query = "SELECT balance FROM wallets WHERE user_identity_id = ? FOR UPDATE";
        $stmt = $db->prepare($query);
        $stmt->bindParam(1, $userId);
        $stmt->execute();
        $wallet = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$wallet || $wallet['balance'] < $package['price']) {
            throw new Exception("Insufficient wallet balance.");
        }

        // 3. Deduct Balance
        $query = "UPDATE wallets SET balance = balance - ? WHERE user_identity_id = ?";
        $stmt = $db->prepare($query);
        $stmt->bindParam(1, $package['price']);
        $stmt->bindParam(2, $userId);
        if (!$stmt->execute()) {
            throw new Exception("Failed to deduct balance.");
        }
    } else {
        // Mocking other payment methods for now (e.g. gateway)
        // In real world, we verify transaction here.
    }

    // 4. Activate Package
    $query = "INSERT INTO user_packages (user_identity_id, package_id, amount, status, activated_at) VALUES (?, ?, ?, 'active', NOW())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $userId);
    $stmt->bindParam(2, $packageId);
    $stmt->bindParam(3, $package['price']);
    if (!$stmt->execute()) {
        throw new Exception("Failed to activate package.");
    }

    $db->commit();
    echo json_encode(array("success" => true, "message" => "Package purchased successfully."));

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => $e->getMessage()));
}
?>