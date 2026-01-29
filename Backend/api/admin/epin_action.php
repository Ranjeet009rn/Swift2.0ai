<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);

// Only admin can access
if ($userData->role !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));
$requestId = $data->requestId ?? 0;
$action = $data->action ?? ''; // 'approve' or 'reject'
$remarks = $data->remarks ?? '';

if (!$requestId || !in_array($action, ['approve', 'reject'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

try {
    $db->beginTransaction();

    // Get request details
    $query = "SELECT * FROM epin_requests WHERE id = :id AND status = 'Pending'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $requestId);
    $stmt->execute();
    $request = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$request) {
        throw new Exception("Request not found or already processed");
    }

    if ($action === 'approve') {
        // Generate E-Pins
        $epins = [];
        for ($i = 0; $i < $request['quantity']; $i++) {
            $epinCode = 'EP' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 12));

            $insertPin = "INSERT INTO epins (epin_code, package, amount, status, generated_by, allocated_to, request_id) 
                          VALUES (:code, :package, :amount, 'unused', :admin_id, :user_id, :request_id)";
            $stmtPin = $db->prepare($insertPin);
            $stmtPin->bindParam(':code', $epinCode);
            $stmtPin->bindParam(':package', $request['package']);
            $stmtPin->bindParam(':amount', $request['amount']);
            $stmtPin->bindParam(':admin_id', $userData->id);
            $stmtPin->bindParam(':user_id', $request['user_identity_id']);
            $stmtPin->bindParam(':request_id', $requestId);
            $stmtPin->execute();

            $epins[] = $epinCode;
        }

        // Update request status
        $updateQuery = "UPDATE epin_requests SET status = 'Approved', admin_remarks = :remarks, updated_at = NOW() WHERE id = :id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':remarks', $remarks);
        $updateStmt->bindParam(':id', $requestId);
        $updateStmt->execute();

        $db->commit();

        echo json_encode([
            "success" => true,
            "message" => "Request approved and " . count($epins) . " E-Pins generated successfully",
            "epins" => $epins
        ]);

    } else {
        // Reject request
        $updateQuery = "UPDATE epin_requests SET status = 'Rejected', admin_remarks = :remarks, updated_at = NOW() WHERE id = :id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':remarks', $remarks);
        $updateStmt->bindParam(':id', $requestId);
        $updateStmt->execute();

        $db->commit();

        echo json_encode([
            "success" => true,
            "message" => "Request rejected successfully"
        ]);
    }

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error processing request: " . $e->getMessage()
    ]);
}
?>