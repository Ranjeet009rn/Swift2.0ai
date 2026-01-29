<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

// Get sponsor ID from query parameter
$sponsorId = isset($_GET['sponsor_id']) ? trim($_GET['sponsor_id']) : '';

if (empty($sponsorId)) {
    echo json_encode([
        "success" => false,
        "message" => "Sponsor ID is required"
    ]);
    exit();
}

try {
    // Find sponsor in hierarchical_users table
    $sponsorQuery = "SELECT id, name, referral_code 
                     FROM hierarchical_users 
                     WHERE referral_code = :sponsor_code 
                        OR username = :sponsor_code 
                        OR user_identity_id = (SELECT id FROM users WHERE user_id = :sponsor_code)";

    $stmt = $db->prepare($sponsorQuery);
    $stmt->bindParam(':sponsor_code', $sponsorId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Sponsor not found"
        ]);
        exit();
    }

    $sponsor = $stmt->fetch(PDO::FETCH_ASSOC);
    $sponsorDbId = $sponsor['id'];

    // Check which positions are occupied
    $positionQuery = "SELECT position FROM hierarchical_users WHERE parent_id = :sponsor_id";
    $posStmt = $db->prepare($positionQuery);
    $posStmt->bindParam(':sponsor_id', $sponsorDbId);
    $posStmt->execute();

    $occupiedPositions = [];
    while ($row = $posStmt->fetch(PDO::FETCH_ASSOC)) {
        $occupiedPositions[] = $row['position'];
    }

    // Determine available positions
    $availablePositions = [];
    if (!in_array('L', $occupiedPositions) && !in_array('left', $occupiedPositions)) {
        $availablePositions[] = 'left';
    }
    if (!in_array('R', $occupiedPositions) && !in_array('right', $occupiedPositions)) {
        $availablePositions[] = 'right';
    }

    // Check if sponsor is full
    $isFull = empty($availablePositions);

    echo json_encode([
        "success" => true,
        "sponsor" => [
            "name" => $sponsor['name'],
            "referral_code" => $sponsor['referral_code']
        ],
        "available_positions" => $availablePositions,
        "is_full" => $isFull,
        "message" => $isFull ? "This sponsor is full. Both positions are occupied." : "Sponsor found"
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>