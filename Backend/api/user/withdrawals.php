include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Fetch Bank Details
$bank_details = null;
$qBank = "SELECT bank_name, account_number, ifsc_code, account_holder as account_holder_name FROM bank_details WHERE
user_identity_id = ?";
$stmtBank = $db->prepare($qBank);
$stmtBank->bindParam(1, $user_id);
if($stmtBank->execute()){
$bank_details = $stmtBank->fetch(PDO::FETCH_ASSOC);
}

// Fetch Withdrawals
$query = "SELECT * FROM withdrawals WHERE user_identity_id = ? ORDER BY request_date DESC";
$stmt = $db->prepare($query);
$stmt->bindParam(1, $user_id);
$stmt->execute();
$withdrawals = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
"success" => true,
"bank_details" => $bank_details,
"withdrawals" => $withdrawals
]);
?>