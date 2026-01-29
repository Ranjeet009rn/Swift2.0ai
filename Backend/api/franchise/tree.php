<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$userId = $userData->id;

if ($userData->role !== 'franchise') {
    http_response_code(403);
    exit();
}

// Fetch Franchise Tree (Supply Chain)
function fetchFranchiseDownline($db, $masterId)
{
    $query = "SELECT id, franchise_name, franchise_code, franchise_type, city, stock_value 
              FROM hierarchical_franchise WHERE master_franchise_id = ?";
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $masterId);
    $stmt->execute();
    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($children as &$child) {
        $child['children'] = fetchFranchiseDownline($db, $child['id']);
    }
    return $children;
}

$qRoot = "SELECT id, franchise_name, franchise_code, franchise_type, city, stock_value 
          FROM hierarchical_franchise WHERE user_identity_id = ?";
$sRoot = $db->prepare($qRoot);
$sRoot->bindParam(1, $userId);
$sRoot->execute();
$rootNode = $sRoot->fetch(PDO::FETCH_ASSOC);

if ($rootNode) {
    $treeData = $rootNode;
    $treeData['children'] = fetchFranchiseDownline($db, $rootNode['id']);

    // Calculate Stats
    $totalUnits = 0;
    $totalSales = 0;

    function calculateStats($node, &$totalUnits, &$totalSales)
    {
        $totalUnits++;
        $totalSales += floatval($node['stock_value'] ?? 0);

        if (!empty($node['children'])) {
            foreach ($node['children'] as $child) {
                calculateStats($child, $totalUnits, $totalSales);
            }
        }
    }

    calculateStats($treeData, $totalUnits, $totalSales);

    echo json_encode(array(
        "success" => true,
        "tree" => $treeData,
        "stats" => [
            "active_units" => $totalUnits,
            "total_sales" => $totalSales
        ]
    ));
} else {
    echo json_encode(array("success" => false, "message" => "Franchise not found."));
}
?>