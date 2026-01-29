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
    exit();
}

// Admin Org Chart
function fetchAdminDownline($db, $reportId)
{
    $query = "SELECT id, username, department, role_level 
              FROM hierarchical_admin WHERE reports_to_admin_id = ?";
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $reportId);
    $stmt->execute();
    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($children as &$child) {
        $child['children'] = fetchAdminDownline($db, $child['id']);
    }
    return $children;
}

// Get the Admin's own node first
$qRoot = "SELECT id, username, department, role_level 
          FROM hierarchical_admin WHERE user_identity_id = ?";
$sRoot = $db->prepare($qRoot);
$sRoot->bindParam(1, $userData->id);
$sRoot->execute();
$rootNode = $sRoot->fetch(PDO::FETCH_ASSOC);

if ($rootNode) {
    $treeData = $rootNode;
    $treeData['children'] = fetchAdminDownline($db, $rootNode['id']);
    echo json_encode(array("success" => true, "tree" => $treeData));
} else {
    echo json_encode(array("success" => false, "message" => "Admin node not found."));
}
?>