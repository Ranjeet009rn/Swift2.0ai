<?php
require_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
/** @var \PDO $db */
$db = $database->getConnection();

$userData = validateAuth($db);
$userId = $userData->id;

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch Bank Details
        $query = "SELECT * FROM bank_details WHERE user_identity_id = ?";
        $stmt = $db->prepare($query);
        $stmt->bindParam(1, $userId);
        $stmt->execute();
        $bank = $stmt->fetch(PDO::FETCH_ASSOC);

        // Return generic success with data or null
        echo json_encode(array("success" => true, "data" => $bank));
        break;

    case 'POST':
        // Add/Update Bank Details
        $data = json_decode(file_get_contents("php://input"));

        // Check if exists
        $check = "SELECT id FROM bank_details WHERE user_identity_id = ?";
        $stmt = $db->prepare($check);
        $stmt->bindParam(1, $userId);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            // Update
            $query = "UPDATE bank_details SET bank_name=?, account_number=?, ifsc_code=?, account_holder=?, upi_id=? WHERE user_identity_id=?";
            $stmt = $db->prepare($query);
            $stmt->bindParam(1, $data->bank_name);
            $stmt->bindParam(2, $data->account_number);
            $stmt->bindParam(3, $data->ifsc_code);
            $stmt->bindParam(4, $data->account_holder);
            $stmt->bindParam(5, $data->upi_id);
            $stmt->bindParam(6, $userId);
        } else {
            // Insert
            $query = "INSERT INTO bank_details (user_identity_id, bank_name, account_number, ifsc_code, account_holder, upi_id) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(1, $userId);
            $stmt->bindParam(2, $data->bank_name);
            $stmt->bindParam(3, $data->account_number);
            $stmt->bindParam(4, $data->ifsc_code);
            $stmt->bindParam(5, $data->account_holder);
            $stmt->bindParam(6, $data->upi_id);
        }

        if ($stmt->execute()) {
            echo json_encode(array("success" => true, "message" => "Bank details saved."));
        } else {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Failed to save bank details."));
        }
        break;

    case 'DELETE':
        // Clear Bank Details
        $query = "DELETE FROM bank_details WHERE user_identity_id = ?";
        $stmt = $db->prepare($query);
        $stmt->bindParam(1, $userId);
        if ($stmt->execute()) {
            echo json_encode(array("success" => true, "message" => "Bank details removed."));
        } else {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Failed to remove."));
        }
        break;
}
?>