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

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID is required"]);
    exit();
}

try {
    // Get root user
    $rootQuery = "SELECT u.id, u.user_id, u.email, u.role, u.status,
                         h.id as h_id, h.name, h.referral_code, h.rank_achieved as `rank`, h.position
                  FROM users u
                  LEFT JOIN hierarchical_users h ON u.id = h.user_identity_id
                  WHERE u.id = ?";
    $stmt = $db->prepare($rootQuery);
    $stmt->execute([$user_id]);
    $root = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$root) {
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit();
    }

    $tree = [
        'id' => $root['id'],
        'user_id' => $root['user_id'],
        'name' => $root['name'] ?: 'Unknown',
        'email' => $root['email'],
        'role' => $root['role'],
        'status' => $root['status'],
        'rank' => $root['rank'] ?: 'None',
        'avatar' => strtoupper(substr($root['name'] ?: 'U', 0, 1)),
        'position' => $root['position']
    ];

    // Get direct children (Level 2)
    if ($root['h_id']) {
        $childQuery = "SELECT u.id, u.user_id, u.email, u.role, u.status,
                              h.id as h_id, h.name, h.referral_code, h.rank_achieved as `rank`, h.position
                       FROM hierarchical_users h
                       JOIN users u ON h.user_identity_id = u.id
                       WHERE h.parent_id = ?
                       ORDER BY h.position ASC";
        $stmt = $db->prepare($childQuery);
        $stmt->execute([$root['h_id']]);
        $level2 = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($level2 as $child) {
            $childNode = [
                'id' => $child['id'],
                'user_id' => $child['user_id'],
                'name' => $child['name'] ?: 'Unknown',
                'email' => $child['email'],
                'role' => $child['role'],
                'status' => $child['status'],
                'rank' => $child['rank'] ?: 'None',
                'avatar' => strtoupper(substr($child['name'] ?: 'U', 0, 1)),
                'position' => $child['position']
            ];

            // Get grandchildren (Level 3)
            $stmt2 = $db->prepare($childQuery);
            $stmt2->execute([$child['h_id']]);
            $level3 = $stmt2->fetchAll(PDO::FETCH_ASSOC);

            foreach ($level3 as $grandchild) {
                $grandchildNode = [
                    'id' => $grandchild['id'],
                    'user_id' => $grandchild['user_id'],
                    'name' => $grandchild['name'] ?: 'Unknown',
                    'email' => $grandchild['email'],
                    'role' => $grandchild['role'],
                    'status' => $grandchild['status'],
                    'rank' => $grandchild['rank'] ?: 'None',
                    'avatar' => strtoupper(substr($grandchild['name'] ?: 'U', 0, 1)),
                    'position' => $grandchild['position']
                ];

                if ($grandchild['position'] === 'L' || $grandchild['position'] === 'left') {
                    $childNode['left'] = $grandchildNode;
                } else {
                    $childNode['right'] = $grandchildNode;
                }
            }

            // Assign to left or right
            if ($child['position'] === 'L' || $child['position'] === 'left') {
                $tree['left'] = $childNode;
            } else {
                $tree['right'] = $childNode;
            }
        }
    }

    echo json_encode([
        "success" => true,
        "tree" => $tree,
        "message" => "User tree fetched successfully"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch user tree: " . $e->getMessage()
    ]);
}
?>