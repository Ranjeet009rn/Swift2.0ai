<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$input = $_GET['id'] ?? '';
$type = $_GET['type'] ?? 'sponsor'; // 'sponsor' or 'upline'

if (empty($input)) {
    echo json_encode(['success' => false, 'message' => 'Input required']);
    exit;
}

// 1. Find the User (Sponsor or Upline)
// Search by username or referral_code or member_id (users.user_id)
// Join users table to get member_id
$query = "
    SELECT h.user_identity_id, h.name, h.username, u.user_id as member_id
    FROM hierarchical_users h
    JOIN users u ON h.user_identity_id = u.id
    WHERE h.username = ? OR h.referral_code = ? OR u.user_id = ?
    LIMIT 1
";

$stmt = $db->prepare($query);
$stmt->bindParam(1, $input);
$stmt->bindParam(2, $input);
$stmt->bindParam(3, $input);
$stmt->execute();

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$response = [
    'success' => true,
    'name' => $user['name'],
    'username' => $user['username'],
    'user_identity_id' => $user['user_identity_id'] // This is the ID used for hierarchy
];

// 2. If checking Upline, check Leg Availability
if ($type === 'upline') {
    $uplineId = $user['user_identity_id'];

    // Check occupied positions
    $posQuery = "SELECT position FROM hierarchical_users WHERE parent_id = ?";
    $posStmt = $db->prepare($posQuery);
    $posStmt->bindParam(1, $uplineId);
    $posStmt->execute();

    $occupied = [];
    while ($row = $posStmt->fetch(PDO::FETCH_ASSOC)) {
        if ($row['position']) {
            $occupied[] = strtolower($row['position']); // 'l' or 'r'
        }
    }

    // left is available if NOT in occupied
    // right is available if NOT in occupied
    $response['legs'] = [
        'left' => !in_array('left', $occupied) && !in_array('l', $occupied),
        'right' => !in_array('right', $occupied) && !in_array('r', $occupied)
    ];
}

echo json_encode($response);
?>