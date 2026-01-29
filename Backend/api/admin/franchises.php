<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
if ($userData->role !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch from hierarchical_franchise table (approved franchises)
        $query = "SELECT 
                    hf.id,
                    hf.franchise_name as name,
                    hf.franchise_code,
                    hf.franchise_type as type,
                    hf.city,
                    hf.state,
                    hf.pincode,
                    hf.address,
                    hf.gst_number,
                    COALESCE(hf.stock_value, 0) as stock,
                    u.email,
                    u.user_id as user_code,
                    u.role,
                    u.status,
                    u.created_at,
                    CONCAT(COALESCE(hf.city, 'Unknown'), ', ', COALESCE(hf.state, 'Unknown')) as region,
                    COALESCE(fa.contact_person_name, fa.franchisee_name, hf.franchise_name, 'Owner Not Set') as owner,
                    COALESCE(fa.mobile_number, 'N/A') as phone,
                    0 as sales
                  FROM hierarchical_franchise hf
                  JOIN users u ON hf.user_identity_id = u.id
                  LEFT JOIN franchise_applications fa ON u.email = fa.email
                  WHERE u.role = 'franchise'
                  ORDER BY hf.id DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $franchises = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Debug: Log what we're sending
        error_log("Franchises API returning " . count($franchises) . " records");
        if (count($franchises) > 0) {
            error_log("First franchise: " . json_encode($franchises[0]));
        }

        echo json_encode([
            "success" => true,
            "data" => $franchises,
            "meta" => [
                "count" => count($franchises),
                "fetched_at" => date('Y-m-d H:i:s'),
                "source" => "hierarchical_franchise table (LIVE DATABASE)"
            ]
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->name) || !isset($data->email) || !isset($data->location)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing required fields"]);
            exit();
        }

        try {
            $db->beginTransaction();

            // 1. Create User
            $userId = 'FR' . rand(1000, 9999);
            $password = '123456'; // Default password (Plain text as per system config)

            $uQuery = "INSERT INTO users (user_id, email, password, role, status) VALUES (?, ?, ?, 'franchise', 'active')";
            $uStmt = $db->prepare($uQuery);
            $uStmt->execute([$userId, $data->email, $password]);
            $uId = $db->lastInsertId();

            // 2. Create Franchise details in hierarchical_franchise
            $fQuery = "INSERT INTO hierarchical_franchise (user_identity_id, franchise_name, franchise_code, franchise_type, city, state, address) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)";
            $fStmt = $db->prepare($fQuery);
            $type = $data->type ?? 'mini';
            $franchiseCode = 'FR' . str_pad($uId, 6, '0', STR_PAD_LEFT);
            $fStmt->execute([$uId, $data->name, $franchiseCode, $type, $data->city ?? '', $data->state ?? '', $data->location]);

            $db->commit();
            echo json_encode(["success" => true, "message" => "Franchise created successfully"]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;
}
?>