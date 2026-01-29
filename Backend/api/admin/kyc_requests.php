<?php
// backend/api/admin/kyc_requests.php

// CORS and Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/Database.php';
require_once '../../utils/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

// Verify Admin
$userData = validateAuth($db);

// Check if role is admin
// We might need to fetch role from DB to be safe, or trust the token if it has role
// Let's fetch the user to be sure and safe
$checkQuery = "SELECT role FROM users WHERE id = :id";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':id', $userData->id);
$checkStmt->execute();
$currentUser = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$currentUser || $currentUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized Access']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Fetch all pending KYC requests
        // Joining with users to get names associated with user_id
        // NOTE: The table kyc_documents uses 'user_identity_id' which links to 'users.id'
        // We also need the name. The 'users' table doesn't have a name column directly (it might be in 'hierarchical_users' or similar for specific details, but let's check users table again)
        // Users table: id, user_id (string ID), email, ...
        // Hierarchical Users table: user_identity_id, name ...
        // Hierarchical Franchise table: user_identity_id, franchise_name ...

        // We need to fetch name effectively. Coalesce name from hierarchical tables or just use ID if simple.

        $query = "
            SELECT 
                k.id,
                k.user_identity_id,
                k.doc_type,
                k.doc_number,
                k.file_path,
                k.status,
                k.uploaded_at,
                u.user_id as user_code,
                u.email,
                u.role,
                COALESCE(hu.name, hf.franchise_name, ha.username, 'Unknown') as name
            FROM kyc_documents k
            JOIN users u ON k.user_identity_id = u.id
            LEFT JOIN hierarchical_users hu ON u.id = hu.user_identity_id
            LEFT JOIN hierarchical_franchise hf ON u.id = hf.user_identity_id
            LEFT JOIN hierarchical_admin ha ON u.id = ha.user_identity_id
            WHERE 1
            ORDER BY k.uploaded_at DESC
        ";

        $stmt = $db->prepare($query);
        $stmt->execute();

        $requests = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Format dates or other fields if necessary
            $requests[] = [
                'id' => $row['id'],
                'userId' => $row['user_identity_id'],
                'userCode' => $row['user_code'],
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => $row['role'],
                'type' => ucfirst($row['doc_type']),
                'docNumber' => $row['doc_number'],
                'status' => ucfirst($row['status']), // Added status to response
                // Force correct path structure using basename to avoid relative path issues
                'file' => 'http://localhost/mlm/backend/uploads/kyc/' . basename($row['file_path']),
                'date' => date('Y-m-d H:i', strtotime($row['uploaded_at']))
            ];
        }

        echo json_encode([
            'success' => true,
            'count' => count($requests),
            'data' => $requests
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // Handle ACTION (Approve/Reject)
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->action) || !isset($data->kyc_id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing action or kyc_id']);
        exit();
    }

    $kycId = $data->kyc_id;
    $action = $data->action; // 'approve' or 'reject'
    $reason = isset($data->reason) ? $data->reason : null;

    try {
        $db->beginTransaction();

        if ($action === 'approve') {
            // 1. Update KYC Document Status
            $updateKyc = "UPDATE kyc_documents SET status = 'approved' WHERE id = :id";
            $stmt = $db->prepare($updateKyc);
            $stmt->bindParam(':id', $kycId);
            $stmt->execute();

            // 2. Get User ID from KYC record
            $getUser = "SELECT user_identity_id FROM kyc_documents WHERE id = :id";
            $stmt = $db->prepare($getUser);
            $stmt->bindParam(':id', $kycId);
            $stmt->execute();
            $userId = $stmt->fetchColumn();

            if ($userId) {
                // 3. Update User Verification Status
                $updateUser = "UPDATE users SET is_verified = 1 WHERE id = :uid";
                $stmt = $db->prepare($updateUser);
                $stmt->bindParam(':uid', $userId);
                $stmt->execute();
            }

            $message = 'KYC Approved Successfully';

        } elseif ($action === 'reject') {
            // 1. Update KYC Document Status
            $updateKyc = "UPDATE kyc_documents SET status = 'rejected', rejection_reason = :reason WHERE id = :id";
            $stmt = $db->prepare($updateKyc);
            $stmt->bindParam(':id', $kycId);
            $stmt->bindValue(':reason', $reason);
            $stmt->execute();

            // Optionally set users.is_verified = 0 if it was previously 1, but for safety, 
            // usually rejection just means this doc is rejected. 
            // If they were already verified, maybe they stay verified from another doc?
            // For now, let's assume strict KYC: if you get rejected, you are not verified (if this is the main doc).

            // For now, we won't toggle is_verified to 0 unless we are sure.
            // But usually, pending -> reject means they remain unverified.

            $message = 'KYC Rejected Successfully';

        } else {
            throw new Exception("Invalid action");
        }

        $db->commit();
        echo json_encode(['success' => true, 'message' => $message]);

    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Action Failed: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>