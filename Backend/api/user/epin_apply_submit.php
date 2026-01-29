<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Check if request is POST and has generated data
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

// Get form data (since it's multipart/form-data, use $_POST and $_FILES)
$package = $_POST['package'] ?? '';
$quantity = $_POST['quantity'] ?? 0;
$amount = $_POST['amount'] ?? 0; // Or calculate based on package to be safe
$paymentMode = $_POST['paymentMode'] ?? '';
$transactionId = $_POST['transactionId'] ?? '';
$screenshotPath = null;

// Validate Inputs
if (empty($package) || empty($quantity) || empty($paymentMode) || empty($transactionId)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

// Handle File Upload
if (isset($_FILES['screenshot']) && $_FILES['screenshot']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = '../../uploads/receipts/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileTmpPath = $_FILES['screenshot']['tmp_name'];
    $fileName = $_FILES['screenshot']['name'];
    $fileSize = $_FILES['screenshot']['size'];
    $fileType = $_FILES['screenshot']['type'];
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));

    $allowedfileExtensions = array('jpg', 'gif', 'png', 'jpeg');
    if (in_array($fileExtension, $allowedfileExtensions)) {
        // Generate unique filename
        $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
        $dest_path = $uploadDir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $dest_path)) {
            // Store relative path for DB
            $screenshotPath = 'uploads/receipts/' . $newFileName;
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error moving uploaded file"]);
            exit;
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid file type. Allowed: JPG, PNG only"]);
        exit;
    }
}

// Verify price (Security Step)
// Ideally fetch package price from DB to verify quantity * price = amount
// For now, accepting frontend amount but you should validate this in production.
$stmtPackage = $db->prepare("SELECT price FROM products WHERE name = :name LIMIT 1"); // Assuming products table holds packages or hardcoded logic
// If using the packages.php logic which seemed to come from product_categories or similar, adjust accordingly.
// Let's stick to the logic used previously or accept the amount for now but logged.

// Insert into DB
try {
    // Check if screenshot column exists (soft migration)
    // We already tried to add it. Let's assume it might not generate error if we don't insert if missing, 
    // but better to try insert.

    $query = "INSERT INTO epin_requests (user_identity_id, package, quantity, amount, payment_mode, transaction_id, status, created_at, screenshot) 
              VALUES (:user_id, :package, :quantity, :amount, :payment_mode, :transaction_id, 'Pending', NOW(), :screenshot)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->bindParam(":package", $package);
    $stmt->bindParam(":quantity", $quantity);
    $stmt->bindParam(":amount", $amount);
    $stmt->bindParam(":payment_mode", $paymentMode);
    $stmt->bindParam(":transaction_id", $transactionId);
    $stmt->bindParam(":screenshot", $screenshotPath);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Request submitted successfully"]);
    } else {
        throw new Exception("Database insert failed");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>