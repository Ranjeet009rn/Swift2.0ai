<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Basic Binary Team Stats
// Calculating counts of left (A) and right (B) teams
function countDownline($parentId, $position, $pdo)
{
    // This is a simplified count. For deep recursion in SQL you might need CTEs.
    // Here we just fetch immediate children of position and recurse in PHP (might be slow for large trees)
    // Or simpler: count all users where path includes this parent?
    // Assuming 'hierarchical_users.position' stores 'L' or 'R' relative to parent.

    // Check if we have a direct child in that position
    $sql = "SELECT id FROM hierarchical_users WHERE parent_id = ? AND position = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$parentId, $position]);
    $child = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$child)
        return 0;

    // Count that child + all its descendants
    // Uses a CTE for recursion if MySQL 8.0+
    $childId = $child['id'];
    $cte = "WITH RECURSIVE subordinates AS (
        SELECT id FROM hierarchical_users WHERE id = :rootId
        UNION ALL
        SELECT u.id FROM hierarchical_users u
        INNER JOIN subordinates s ON u.parent_id = s.id
    ) SELECT COUNT(*) as total FROM subordinates";

    $stmtCte = $pdo->prepare($cte);
    $stmtCte->bindParam(':rootId', $childId);
    $stmtCte->execute();
    return $stmtCte->fetch(PDO::FETCH_ASSOC)['total'];
}

$countA = 0; // Left
$countB = 0; // Right
// Note: Depending on your DB version, CTE might fail. If so, return 0.
try {
    $countA = countDownline($user_id, 'L', $db);
    $countB = countDownline($user_id, 'R', $db);
} catch (Exception $e) {
    // Fallback if CTE not supported
    $countA = 0;
    $countB = 0;
}

$teams = [
    "total_team" => $countA + $countB,
    "total_earnings" => 0, // Calculate from earnings table
    "team_a" => ["count" => $countA, "members" => []],
    "team_b" => ["count" => $countB, "members" => []]
];

echo json_encode([
    "success" => true,
    "teams" => $teams
]);
?>