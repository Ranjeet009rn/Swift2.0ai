<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$userId = $userData->id;

// Recursive function to fetch downline with proper error handling
// Helper to get earnings
function getEarnings($db, $userIdentityId)
{
    if (!$userIdentityId)
        return ['total' => 0, 'sponsor' => 0];

    // Total Earnings
    try {
        $qTotal = "SELECT SUM(amount) as total FROM earnings WHERE user_identity_id = ?";
        $stmtTotal = $db->prepare($qTotal);
        $stmtTotal->execute([$userIdentityId]);
        $total = $stmtTotal->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    } catch (Exception $e) {
        $total = 0;
    }

    // Sponsor Income
    try {
        $qSponsor = "SELECT SUM(amount) as sponsor FROM earnings WHERE user_identity_id = ? AND type IN ('direct_income', 'sponsor_income')";
        $stmtSponsor = $db->prepare($qSponsor);
        $stmtSponsor->execute([$userIdentityId]);
        $sponsor = $stmtSponsor->fetch(PDO::FETCH_ASSOC)['sponsor'] ?? 0;
    } catch (Exception $e) {
        $sponsor = 0;
    }

    return ['total' => (float) $total, 'sponsor' => (float) $sponsor];
}

function fetchDownline($db, $parentId, $currentLevel, $maxLevel)
{
    if ($currentLevel > $maxLevel) {
        return [];
    }

    try {
        $query = "SELECT id, name, user_identity_id, referral_code, left_count, right_count, position, profile_image, selected_package 
                  FROM hierarchical_users WHERE parent_id = ? ORDER BY position ASC";
        $stmt = $db->prepare($query);
        $stmt->execute([$parentId]);
        $children = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Recursively fetch children for each child
        foreach ($children as &$child) {
            // Determine if this user is a team leader (has downline)
            $child['is_team_leader'] = ($child['left_count'] > 0 || $child['right_count'] > 0);

            // Fetch financial data
            $financials = getEarnings($db, $child['user_identity_id']);
            $child['earnings'] = $financials['total'];
            $child['sponsor_income'] = $financials['sponsor'];

            $child['children'] = fetchDownline($db, $child['id'], $currentLevel + 1, $maxLevel);
        }

        return $children;
    } catch (Exception $e) {
        error_log("Error fetching downline: " . $e->getMessage());
        return [];
    }
}

try {
    // Get current user's node from hierarchical_users
    $qRoot = "SELECT id, name, user_identity_id, referral_code, left_count, right_count, position, profile_image, selected_package 
              FROM hierarchical_users WHERE user_identity_id = ?";
    $sRoot = $db->prepare($qRoot);
    $sRoot->execute([$userId]);
    $rootNode = $sRoot->fetch(PDO::FETCH_ASSOC);

    if ($rootNode) {
        $treeData = $rootNode;
        // Determine if root is a team leader
        $treeData['is_team_leader'] = ($rootNode['left_count'] > 0 || $rootNode['right_count'] > 0);

        // Fetch financial data for Root
        $rootFinancials = getEarnings($db, $rootNode['user_identity_id']);
        $treeData['earnings'] = $rootFinancials['total'];
        $treeData['sponsor_income'] = $rootFinancials['sponsor'];

        $treeData['children'] = fetchDownline($db, $rootNode['id'], 1, 5);

        // Calculate Team Size
        $teamSize = $rootNode['left_count'] + $rootNode['right_count'];

        // Calculate Growth (New members in last 30 days)
        $growthPercentage = 0;
        if ($teamSize > 0) {
            try {
                // Check if MySQL supports CTE (MySQL 8.0+)
                // Using a simpler approach if not, or assuming 8.0 given the environment
                $growthQuery = "WITH RECURSIVE Downline AS (
                    SELECT id, created_at FROM hierarchical_users WHERE parent_id = ?
                    UNION ALL
                    SELECT u.id, u.created_at 
                    FROM hierarchical_users u
                    INNER JOIN Downline d ON u.parent_id = d.id
                )
                SELECT COUNT(*) as new_count FROM Downline WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";

                $stmtGrowth = $db->prepare($growthQuery);
                $stmtGrowth->execute([$rootNode['id']]);
                $growthResult = $stmtGrowth->fetch(PDO::FETCH_ASSOC);
                $newMembersCount = $growthResult['new_count'] ?? 0;

                $previousSize = $teamSize - $newMembersCount;
                if ($previousSize > 0) {
                    $growthPercentage = ($newMembersCount / $previousSize) * 100;
                } else if ($newMembersCount > 0) {
                    $growthPercentage = 100; // 100% growth if starting from 0
                }
            } catch (Exception $e) {
                // Fallback or ignore if CTE fails (e.g., older MySQL)
                error_log("Growth calculation failed: " . $e->getMessage());
            }
        }

        echo json_encode([
            "success" => true,
            "team_size" => $teamSize,
            "growth_percentage" => round($growthPercentage, 1),
            "tree" => $treeData
        ]);
    } else {
        // User not found in hierarchical_users table
        echo json_encode([
            "success" => false,
            "message" => "User not found in tree. Please contact support.",
            "user_id" => $userId
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error fetching tree: " . $e->getMessage()
    ]);
}
?>