<?php
include_once '../../config/database.php';
include_once '../../models/User.php';
include_once '../../utils/cors.php';
include_once '../../utils/jwt.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$user = new User($db);
$jwtHandler = new JWTHandler();

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$arr = explode(" ", $authHeader);
$jwt = $arr[1] ?? '';

if (!$jwt) {
    http_response_code(401);
    echo json_encode(array("message" => "Access denied. No token provided."));
    exit;
}

try {
    $decoded = $jwtHandler->validate($jwt);
    if (!$decoded) {
        throw new Exception("Invalid token");
    }

    $userId = $decoded->data->id; // Internal ID

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Fetch User Profile
        $query = "SELECT 
                    u.id, 
                    u.user_id, 
                    u.email, 
                    u.role, 
                    u.created_at, 
                    u.status,
                    hu.name as full_name, 
                    hu.referral_code, 
                    hu.mobile, 
                    hu.full_address as address,
                    hu.city,
                    hu.state,
                    hu.pin_code as pincode,
                    hu.nominee_name,
                    hu.nominee_relation,
                    hu.pan_number,
                    hu.date_of_birth as dob,
                    hu.bank_name,
                    hu.account_number as bank_account_no, 
                    hu.ifsc_code,
                    hu.rank_achieved as rank,
                    hu.sponsor_id,
                    hu.profile_image,
                    hu.cover_image,
                    w.balance, 
                    w.total_earned,

                    k.status as kyc_status
                  FROM users u 
                  LEFT JOIN hierarchical_users hu ON u.id = hu.user_identity_id 
                  LEFT JOIN wallets w ON u.id = w.user_identity_id 
                  LEFT JOIN (SELECT user_identity_id, status FROM kyc_documents ORDER BY id DESC LIMIT 1) k ON u.id = k.user_identity_id
                  WHERE u.id = ?";

        $stmt = $db->prepare($query);
        $stmt->bindParam(1, $userId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            // Rank null check
            if (!$row['rank'])
                $row['rank'] = 'Member';

            // Map KYC status
            $kycMap = [
                'approved' => 'Verified',
                'rejected' => 'Rejected',
                'pending' => 'Pending'
            ];
            $row['kyc_status'] = isset($row['kyc_status']) && isset($kycMap[$row['kyc_status']])
                ? $kycMap[$row['kyc_status']]
                : 'Pending';

            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "user" => $row
            ));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "User not found."));
        }

    } elseif ($method === 'PUT' || $method === 'POST') {
        // Update User Profile
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            throw new Exception("No data provided");
        }

        // Helper to save Base64 Image
        function saveBase64Image($base64String, $userId, $type)
        {
            if (strpos($base64String, 'data:image') !== 0) {
                // Not a base64 string, assume it's already a URL
                return $base64String;
            }

            $matches = [];
            preg_match('/^data:image\/(\w+);base64,/', $base64String, $matches);
            $extension = $matches[1] ?? 'png';
            $data = substr($base64String, strpos($base64String, ',') + 1);
            $data = base64_decode($data);

            if ($data === false) {
                return null;
            }

            // Define path
            // Adjust path to save into frontend public folder
            $uploadDir = '../../../frontend/public/uploads/profiles/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $filename = $userId . '_' . $type . '_' . time() . '.' . $extension;
            $filepath = $uploadDir . $filename;

            if (file_put_contents($filepath, $data)) {
                return '/uploads/profiles/' . $filename; // Return web-accessible path
            }

            return null;
        }

        $updates = [];
        $params = [];

        // Handle Fields
        if (isset($data['full_name'])) {
            $updates[] = "name = ?";
            $params[] = $data['full_name'];
        }
        if (isset($data['mobile'])) {
            $updates[] = "mobile = ?";
            $params[] = $data['mobile'];
        }
        if (isset($data['address'])) {
            $updates[] = "full_address = ?";
            $params[] = $data['address'];
        }
        if (isset($data['city'])) {
            $updates[] = "city = ?";
            $params[] = $data['city'];
        }
        if (isset($data['state'])) {
            $updates[] = "state = ?";
            $params[] = $data['state'];
        }
        if (isset($data['pincode'])) {
            $updates[] = "pin_code = ?";
            $params[] = $data['pincode'];
        }
        if (isset($data['dob'])) {
            $updates[] = "date_of_birth = ?";
            $params[] = $data['dob'];
        }
        if (isset($data['nominee_name'])) {
            $updates[] = "nominee_name = ?";
            $params[] = $data['nominee_name'];
        }
        if (isset($data['nominee_relation'])) {
            $updates[] = "nominee_relation = ?";
            $params[] = $data['nominee_relation'];
        }
        if (isset($data['pan_number'])) {
            $updates[] = "pan_number = ?";
            $params[] = $data['pan_number'];
        }
        // Bank details typically in hierarchical_users if added by registration script, or bank_details table.
        // The script setup_shopping.php added them to hierarchical_users for simplicity if not exists.
        // Let's update them in hierarchical_users.
        if (isset($data['bank_name'])) {
            $updates[] = "bank_name = ?";
            $params[] = $data['bank_name'];
        }
        if (isset($data['branch_name'])) {
            $updates[] = "branch_name = ?";
            $params[] = $data['branch_name'];
        }
        if (isset($data['account_holder_name'])) {
            $updates[] = "account_holder_name = ?";
            $params[] = $data['account_holder_name'];
        }
        if (isset($data['account_number'])) {
            $updates[] = "account_number = ?";
            $params[] = $data['account_number'];
        }
        if (isset($data['ifsc_code'])) {
            $updates[] = "ifsc_code = ?";
            $params[] = $data['ifsc_code'];
        }
        if (isset($data['email'])) {
            // Email is in users table, complicated join update or separate query.
            // For safety, let's update email in users table separately if valid
            // Validating email uniqueness is skipped for brevity but recommended
            // Ignoring email update for now unless requested specifically as it affects login
        }

        // Handle Images
        if (isset($data['profile_image'])) {
            $path = saveBase64Image($data['profile_image'], $userId, 'profile');
            if ($path) {
                $updates[] = "profile_image = ?";
                $params[] = $path;
            }
        }
        if (isset($data['cover_image'])) {
            $path = saveBase64Image($data['cover_image'], $userId, 'cover');
            if ($path) {
                $updates[] = "cover_image = ?";
                $params[] = $path;
            }
        }

        if (count($updates) > 0) {
            $query = "UPDATE hierarchical_users SET " . implode(", ", $updates) . " WHERE user_identity_id = ?";
            $params[] = $userId;

            $stmt = $db->prepare($query);
            if ($stmt->execute($params)) {
                http_response_code(200);
                echo json_encode(array("success" => true, "message" => "Profile updated successfully"));
            } else {
                throw new Exception("Update failed");
            }
        } else {
            http_response_code(200);
            echo json_encode(array("success" => true, "message" => "No changes to save"));
        }
    }

} catch (Exception $e) {
    http_response_code(400); // Bad Request or Unauthorized
    echo json_encode(array("success" => false, "message" => $e->getMessage()));
}
?>