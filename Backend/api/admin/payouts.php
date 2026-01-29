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

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch all payouts
        $query = "SELECT 
                    p.*,
                    u.user_id as admin_user_id,
                    u.email as admin_email
                  FROM payouts p
                  LEFT JOIN users u ON p.generated_by = u.id
                  ORDER BY p.created_at DESC";

        $stmt = $db->prepare($query);
        $stmt->execute();
        $payouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format the data
        $formattedPayouts = array_map(function ($payout) {
            return [
                'id' => $payout['id'],
                'payout_date' => $payout['payout_date'],
                'total_amount' => floatval($payout['total_amount']),
                'total_users' => intval($payout['total_users']),
                'status' => $payout['status'],
                'generated_by' => $payout['admin_user_id'] ?? 'N/A',
                'notes' => $payout['notes'],
                'created_at' => $payout['created_at'],
                'completed_at' => $payout['completed_at']
            ];
        }, $payouts);

        echo json_encode([
            "success" => true,
            "data" => $formattedPayouts,
            "meta" => [
                "count" => count($formattedPayouts),
                "fetched_at" => date('Y-m-d H:i:s'),
                "source" => "payouts table (LIVE DATABASE)"
            ]
        ]);
        break;

    case 'POST':
        // Generate new payout
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->payout_date)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Payout date is required"]);
            exit();
        }

        try {
            $db->beginTransaction();

            // Calculate total eligible earnings
            $earningsQuery = "SELECT 
                                e.user_id,
                                SUM(e.amount) as total_earnings
                              FROM earnings e
                              WHERE e.status = 'approved'
                              AND e.user_id NOT IN (
                                  SELECT DISTINCT user_identity_id 
                                  FROM payout_details 
                                  WHERE status = 'paid'
                              )
                              GROUP BY e.user_id";

            $stmt = $db->prepare($earningsQuery);
            $stmt->execute();
            $earnings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $totalAmount = 0;
            $totalUsers = count($earnings);

            foreach ($earnings as $earning) {
                $totalAmount += $earning['total_earnings'];
            }

            // Create payout record
            $insertPayout = "INSERT INTO payouts (payout_date, total_amount, total_users, generated_by, status, notes)
                            VALUES (?, ?, ?, ?, 'draft', ?)";
            $stmt = $db->prepare($insertPayout);
            $stmt->execute([
                $data->payout_date,
                $totalAmount,
                $totalUsers,
                $userData->id,
                $data->notes ?? 'Auto-generated payout'
            ]);

            $payoutId = $db->lastInsertId();

            // Create payout details for each user
            foreach ($earnings as $earning) {
                $insertDetail = "INSERT INTO payout_details (payout_id, user_identity_id, amount, status)
                                VALUES (?, ?, ?, 'pending')";
                $stmt = $db->prepare($insertDetail);
                $stmt->execute([
                    $payoutId,
                    $earning['user_id'],
                    $earning['total_earnings']
                ]);
            }

            $db->commit();

            echo json_encode([
                "success" => true,
                "message" => "Payout generated successfully",
                "data" => [
                    "payout_id" => $payoutId,
                    "total_amount" => $totalAmount,
                    "total_users" => $totalUsers
                ]
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to generate payout: " . $e->getMessage()
            ]);
        }
        break;
}
?>