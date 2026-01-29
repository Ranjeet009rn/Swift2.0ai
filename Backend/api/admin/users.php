<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

// Validate Admin Token (assuming fetchAdminProfile or similar logic exists, or just check role)
$userData = validateAuth($db);
if ($userData->role !== 'admin') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Admin only."));
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch all users with hierarchy info
        $query = "
            SELECT 
                u.id, 
                u.user_id, 
                u.email, 
                u.role, 
                u.status, 
                u.created_at as join_date,
                h.name, 
                h.referral_code, 
                h.rank_achieved as `rank`,
                h.selected_package as current_plan,
                h.sponsor_id
            FROM users u
            LEFT JOIN hierarchical_users h ON u.id = h.user_identity_id
            WHERE u.role = 'user'
            ORDER BY u.created_at DESC
        ";

        $stmt = $db->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format data if needed
        $formattedUsers = [];
        foreach ($users as $user) {
            $formattedUsers[] = [
                'id' => $user['id'],
                'user_id' => $user['user_id'], // Display ID
                'name' => $user['name'] ?: 'N/A',
                'email' => $user['email'],
                'role' => ucfirst($user['role']),
                'rank' => $user['rank'] ?: 'None',
                'status' => $user['status'] === 'banned' ? 'Blocked' : ucfirst($user['status']),
                'joinDate' => date('Y-m-d', strtotime($user['join_date'])),
                'avatar' => $user['name'] ? strtoupper(substr($user['name'], 0, 1)) : 'U'
            ];
        }

        echo json_encode(array("success" => true, "data" => $formattedUsers));
        break;

    // Handle Block/Unblock/Delete/Update if needed later
    case 'POST':
        // For simple status updates or editing (simplified for now)
        $raw_input = file_get_contents("php://input");
        $data = json_decode($raw_input);

        if (isset($data->action) && isset($data->user_id)) {
            $user_id = $data->user_id;

            if ($data->action === 'block') {
                // DB uses 'banned' or 'suspended', mapping 'block' to 'banned'
                // Enum: active, inactive, banned, suspended
                $q = "UPDATE users SET status = 'banned' WHERE id = ?";
                $s = $db->prepare($q);
                if ($s->execute([$user_id])) {
                    echo json_encode(array("success" => true, "message" => "User blocked successfully"));
                } else {
                    http_response_code(500);
                    echo json_encode(array("success" => false, "message" => "Database error blocking user"));
                }
            } elseif ($data->action === 'active') { // Unblock
                $q = "UPDATE users SET status = 'active' WHERE id = ?";
                $s = $db->prepare($q);
                if ($s->execute([$user_id])) {
                    echo json_encode(array("success" => true, "message" => "User activated successfully"));
                } else {
                    http_response_code(500);
                    echo json_encode(array("success" => false, "message" => "Database error activating user"));
                }
            }
        } else {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Invalid parameters"));
        }
        break;
}
?>