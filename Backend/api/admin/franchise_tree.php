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

$franchise_id = isset($_GET['franchise_id']) ? intval($_GET['franchise_id']) : null;

// Recursive function to build franchise tree
function buildFranchiseTree($db, $parentId = null, $depth = 0, $maxDepth = 3)
{
    if ($depth >= $maxDepth) {
        return null;
    }

    if ($parentId === null) {
        // Get root franchise (first franchise or master franchise)
        $query = "SELECT hf.*, u.user_id as user_code, u.email, fa.contact_person_name, fa.mobile_number
                  FROM hierarchical_franchise hf
                  JOIN users u ON hf.user_identity_id = u.id
                  LEFT JOIN franchise_applications fa ON u.email = fa.email
                  WHERE hf.master_franchise_id IS NULL
                  ORDER BY hf.id ASC
                  LIMIT 1";
    } else {
        $query = "SELECT hf.*, u.user_id as user_code, u.email, fa.contact_person_name, fa.mobile_number
                  FROM hierarchical_franchise hf
                  JOIN users u ON hf.user_identity_id = u.id
                  LEFT JOIN franchise_applications fa ON u.email = fa.email
                  WHERE hf.id = ?";
    }

    $stmt = $db->prepare($query);
    if ($parentId !== null) {
        $stmt->execute([$parentId]);
    } else {
        $stmt->execute();
    }

    $franchise = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$franchise) {
        return null;
    }

    // Get children
    $childQuery = "SELECT hf.*, u.user_id as user_code, u.email, fa.contact_person_name, fa.mobile_number
                   FROM hierarchical_franchise hf
                   JOIN users u ON hf.user_identity_id = u.id
                   LEFT JOIN franchise_applications fa ON u.email = fa.email
                   WHERE hf.master_franchise_id = ?
                   ORDER BY hf.id ASC
                   LIMIT 2"; // Binary tree: max 2 children

    $childStmt = $db->prepare($childQuery);
    $childStmt->execute([$franchise['id']]);
    $children = $childStmt->fetchAll(PDO::FETCH_ASSOC);

    $node = [
        'id' => $franchise['id'],
        'name' => $franchise['franchise_name'] ?? 'Unnamed',
        'franchise_name' => $franchise['franchise_name'] ?? 'Unnamed',
        'franchise_code' => $franchise['franchise_code'],
        'type' => $franchise['franchise_type'] ?? 'Standard',
        'franchise_type' => $franchise['franchise_type'] ?? 'Standard',
        'location' => ($franchise['city'] ?? 'Unknown') . ', ' . ($franchise['state'] ?? 'Unknown'),
        'region' => ($franchise['city'] ?? 'Unknown') . ', ' . ($franchise['state'] ?? 'Unknown'),
        'city' => $franchise['city'] ?? 'Unknown',
        'state' => $franchise['state'] ?? 'Unknown',
        'status' => 'active',
        'stock' => $franchise['stock_value'] ?? 0,
        'sales' => 0,
        'total_sales' => 0,
        'commission' => 0,
        'contact_person' => $franchise['contact_person_name'] ?? $franchise['franchisee_name'] ?? $franchise['franchise_name'] ?? 'Not Available',
        'phone' => $franchise['mobile_number'] ?? 'N/A',
        'email' => $franchise['email'],
        'owner' => $franchise['contact_person_name'] ?? $franchise['franchisee_name'] ?? $franchise['franchise_name'] ?? 'Not Available'
    ];

    // Recursively build children for binary tree
    if (isset($children[0])) {
        $node['left'] = buildFranchiseTree($db, $children[0]['id'], $depth + 1, $maxDepth);
    }
    if (isset($children[1])) {
        $node['right'] = buildFranchiseTree($db, $children[1]['id'], $depth + 1, $maxDepth);
    }

    return $node;
}

try {
    $tree = buildFranchiseTree($db, $franchise_id);

    if ($tree) {
        echo json_encode([
            "success" => true,
            "tree" => $tree,
            "message" => "Franchise tree fetched successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Franchise not found"
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch franchise tree: " . $e->getMessage()
    ]);
}
?>