<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
$offset = ($page - 1) * $limit;
$type = isset($_GET['type']) ? $_GET['type'] : 'all';

$where_clause = "user_identity_id = :user_id";
if ($type !== 'all') {
    $where_clause .= " AND type = :type"; // using 'type' column
}

// Count total
$count_query = "SELECT COUNT(*) as total FROM earnings WHERE " . $where_clause;
$stmt = $db->prepare($count_query);
$stmt->bindParam(":user_id", $user_id);
if ($type !== 'all') {
    $stmt->bindParam(":type", $type);
}
$stmt->execute();
$total_rows = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
$total_pages = $total_rows > 0 ? ceil($total_rows / $limit) : 1;

// Fetch data
$query = "SELECT * FROM earnings WHERE " . $where_clause . " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $user_id);
if ($type !== 'all') {
    $stmt->bindParam(":type", $type);
}
$stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
$stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
$stmt->execute();

$earnings = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Return response
echo json_encode([
    "success" => true,
    "data" => $earnings,
    "pagination" => [
        "current_page" => $page,
        "total_pages" => $total_pages,
        "total_records" => $total_rows
    ]
]);
?>