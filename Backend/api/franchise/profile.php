<?php
// Disable error display in output to prevent JSON corruption
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');

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
    // Fetch Profile
    $query = "SELECT 
                u.id as user_id,
                u.email,
                hf.franchise_name,
                hf.franchise_code,
                hf.franchise_type,
                hf.city,
                hf.state,
                hf.address,
                hf.pincode,
                hf.gst_number,
                hf.pan_number,
                hf.owner_name,
                hf.mobile
              FROM users u
              JOIN hierarchical_franchise hf ON u.id = hf.user_identity_id
              WHERE u.id = ?";

    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $userData->id);
    $stmt->execute();
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($profile) {
        // If mobile is not in hf, maybe fetch from users? 
        // For now, assuming the query covers it. 
        echo json_encode(array("success" => true, "data" => $profile));
    } else {
        echo json_encode(array("success" => false, "message" => "Profile not found."));
    }

} elseif ($method === 'POST') {
    // Update Profile
    $data = json_decode(file_get_contents("php://input"));

    if (!$data) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "No data provided."));
        exit();
    }

    try {
        $db->beginTransaction();

        // Update Users Table (Email)
        if (isset($data->email) && !empty($data->email)) {
            $q1 = "UPDATE users SET email = ? WHERE id = ?";
            $s1 = $db->prepare($q1);
            $s1->bindParam(1, $data->email);
            $s1->bindParam(2, $userData->id);
            $s1->execute();
        }

        // Update Franchise Table
        // We act optimistically and try to update all common fields
        $fields = [];
        $params = [];

        if (isset($data->franchise_name)) {
            $fields[] = "franchise_name = ?";
            $params[] = $data->franchise_name;
        }
        if (isset($data->owner_name)) {
            $fields[] = "owner_name = ?";
            $params[] = $data->owner_name;
        }
        if (isset($data->mobile)) {
            $fields[] = "mobile = ?";
            $params[] = $data->mobile;
        }
        if (isset($data->address)) {
            $fields[] = "address = ?";
            $params[] = $data->address;
        }
        if (isset($data->city)) {
            $fields[] = "city = ?";
            $params[] = $data->city;
        }
        if (isset($data->state)) {
            $fields[] = "state = ?";
            $params[] = $data->state;
        }
        if (isset($data->pincode)) {
            $fields[] = "pincode = ?";
            $params[] = $data->pincode;
        }
        if (isset($data->gst_number)) {
            $fields[] = "gst_number = ?";
            $params[] = $data->gst_number;
        }
        if (isset($data->pan_number)) {
            $fields[] = "pan_number = ?";
            $params[] = $data->pan_number;
        }

        if (!empty($fields)) {
            $q2 = "UPDATE hierarchical_franchise SET " . implode(", ", $fields) . " WHERE user_identity_id = ?";
            $params[] = $userData->id;
            $s2 = $db->prepare($q2);
            $s2->execute($params);
        }

        $db->commit();
        echo json_encode(array("success" => true, "message" => "Profile updated successfully."));

    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Update failed: " . $e->getMessage()));
    }
} else {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}
?>