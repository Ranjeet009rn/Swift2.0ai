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
    echo json_encode(["success" => false, "message" => "Access Denied"]);
    exit();
}

$rootUserId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

// Helper to fetch node details
function fetchNode($db, $referral_code)
{
    // Get user details
    $q = "SELECT u.id, u.user_id, u.role, u.created_at, h.name, h.referral_code, h.selected_package as current_plan, h.rank_achieved as `rank`, h.id as h_id
          FROM users u
          JOIN hierarchical_users h ON u.id = h.user_identity_id
          WHERE u.user_id = ? OR h.referral_code = ? LIMIT 1";
    $stmt = $db->prepare($q);
    $stmt->execute([$referral_code, $referral_code]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}


// Recursive function to build tree
function buildTree($db, $parentId, $depth = 0, $maxDepth = 3)
{
    if ($depth >= $maxDepth)
        return [];

    // Fetch children (binary or hierarchy - assuming referral/sponsor based for hierarchy view)
    // For hierarchy view (Sponsor Tree), we use sponsor_id
    // For binary view (Placement Tree), we use parent_id
    // Here we will default to Sponsor Tree logic for simplicity or check a 'type' param

    $type = isset($_GET['type']) && $_GET['type'] === 'binary' ? 'binary' : 'hierarchy';

    if ($type === 'binary') {
        $q = "SELECT u.user_id, h.name, h.referral_code, h.selected_package as current_plan, h.rank_achieved as `rank`, h.id as h_id
              FROM hierarchical_users h
              JOIN users u ON h.user_identity_id = u.id
              WHERE h.upline_id = ?"; // Placement parent (upline_id)
    } else {
        $q = "SELECT u.user_id, h.name, h.referral_code, h.selected_package as current_plan, h.rank_achieved as `rank`, h.id as h_id
              FROM hierarchical_users h
              JOIN users u ON h.user_identity_id = u.id
              WHERE h.sponsor_id = ?"; // Sponsor parent
    }

    $stmt = $db->prepare($q);
    $stmt->execute([$parentId]);
    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];
    foreach ($children as $child) {
        $node = [
            'name' => $child['name'],
            'id' => $child['user_id'], // Display ID
            'rank' => $child['rank'] ?: 'None',
            'package' => 0, // Placeholder, join packages table if needed
            'referrals' => 0, // Placeholder count
            'owner_id' => $child['h_id'], // Internal ID for recursion
            'children' => buildTree($db, $child['h_id'], $depth + 1, $maxDepth)
        ];
        $result[] = $node;
    }
    return $result;
}

// Main Logic
if ($rootUserId) {
    $rootNode = fetchNode($db, $rootUserId);
} else {
    // Find absolute root (user with no sponsor/parent or specific ID 1)
    $q = "SELECT u.id, u.user_id, h.name, h.referral_code, h.id as h_id, h.rank_achieved as `rank` 
          FROM users u 
          JOIN hierarchical_users h ON u.id = h.user_identity_id 
          ORDER BY u.id ASC LIMIT 1";
    $stmt = $db->prepare($q);
    $stmt->execute();
    $rootNode = $stmt->fetch(PDO::FETCH_ASSOC);
}

if ($rootNode) {
    $tree = [
        'name' => $rootNode['name'],
        'id' => $rootNode['user_id'],
        'rank' => $rootNode['rank'] ?: 'None',
        'package' => 0,
        'referrals' => 0,
        'children' => buildTree($db, $rootNode['h_id'], 0, 3) // Depth 3 for visualization
    ];
    echo json_encode(["success" => true, "data" => $tree]);
} else {
    echo json_encode(["success" => false, "message" => "Root node not found", "data" => null]);
}
?>