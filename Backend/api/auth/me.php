<?php
// Disable errors in output
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');

require_once '../../config/database.php';
require_once '../../utils/auth_middleware.php'; // ensure this path is correct
require_once '../../utils/cors.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

try {
    // validateAuth will exit if token is invalid or missing
    $userDataFromToken = validateAuth($db);

    // Convert object to array if needed, though validateAuth usually returns object
    $userId = $userDataFromToken->id;

    // Fetch fresh user data from DB
    $query = "SELECT id, user_id, email, role, password FROM users WHERE id = :id LIMIT 0,1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // Populate User object properties to use its helper methods/logic if complex
        // Or just straightforwardly fetch additional details
        $responseUser = [
            'id' => $row['id'],
            'email' => $row['email'],
            'role' => $row['role'],
            'user_id' => $row['user_id']
        ];

        // Fetch KYC Status
        $kycQuery = "SELECT status, rejection_reason FROM kyc_documents WHERE user_identity_id = :uid ORDER BY id DESC LIMIT 1";
        $kycStmt = $db->prepare($kycQuery);
        $kycStmt->bindParam(':uid', $row['id']);
        $kycStmt->execute();
        $kycData = $kycStmt->fetch(PDO::FETCH_ASSOC);

        $responseUser['kyc_status'] = $kycData ? ucfirst($kycData['status']) : 'Pending'; // Default to Pending if no doc or just 'Not Submitted'
        // Actually if no doc, it might be 'Not Submitted', but prompt asks for "Verified/Rejected". 
        // If row exists, use status. If not, maybe 'Pending' or 'None'.
        // Let's stick to map: if verified -> 'Verified', if rejected -> 'Rejected', else 'Pending'
        if ($kycData && $kycData['status'] === 'approved')
            $responseUser['kyc_status'] = 'Verified';
        if ($kycData && $kycData['status'] === 'rejected')
            $responseUser['kyc_status'] = 'Rejected';
        if ($kycData && $kycData['status'] === 'pending')
            $responseUser['kyc_status'] = 'Pending';
        if (!$kycData)
            $responseUser['kyc_status'] = 'Pending'; // Or 'Not Uploaded'

        $responseUser['kyc_rejection_reason'] = $kycData ? $kycData['rejection_reason'] : null;

        // Fetch additional details based on role
        // Fetch additional details based on role
        $role = strtolower($row['role']);
        if ($role == 'user') {
            $q2 = "SELECT 
                name, 
                referral_code, 
                profile_image, 
                cover_image,
                mobile, 
                full_address as address, 
                city, 
                state, 
                pin_code as pincode, 
                nominee_name, 
                nominee_relation, 
                pan_number, 
                date_of_birth as dob, 
                bank_name, 
                branch_name, 
                ifsc_code, 
                account_holder_name, 
                account_number,
                sponsor_id,
                upline_id,
                created_at,
                position,
                username,
                country,
                selected_package,
                activation_date
            FROM hierarchical_users WHERE user_identity_id = ?";
            $s2 = $db->prepare($q2);
            $s2->bindParam(1, $row['id']);
            $s2->execute();
            if ($r2 = $s2->fetch(PDO::FETCH_ASSOC)) {
                $responseUser['name'] = $r2['name'];
                $responseUser['referral_code'] = $r2['referral_code'];
                $responseUser['profile_image'] = $r2['profile_image'];
                $responseUser['cover_image'] = $r2['cover_image'];
                $responseUser['mobile'] = $r2['mobile'];
                $responseUser['address'] = $r2['address'];
                $responseUser['city'] = $r2['city'];
                $responseUser['state'] = $r2['state'];
                $responseUser['pincode'] = $r2['pincode'];
                $responseUser['nominee_name'] = $r2['nominee_name'];
                $responseUser['nominee_relation'] = $r2['nominee_relation'];
                $responseUser['pan_number'] = $r2['pan_number'];
                $responseUser['dob'] = $r2['dob'];
                $responseUser['bank_name'] = $r2['bank_name'];
                $responseUser['branch_name'] = $r2['branch_name'];
                $responseUser['ifsc_code'] = $r2['ifsc_code'];
                $responseUser['account_holder_name'] = $r2['account_holder_name'];
                $responseUser['account_number'] = $r2['account_number'];
                $responseUser['sponsor_id'] = $r2['sponsor_id'];
                $responseUser['created_at'] = $r2['created_at'];
                $responseUser['position'] = $r2['position'];
                $responseUser['username'] = $r2['username'];
                $responseUser['country'] = $r2['country'];
                $responseUser['upline_id'] = $r2['upline_id'];
                $responseUser['package'] = $r2['selected_package'];
                $responseUser['activation_date'] = $r2['activation_date'];
            }
        } elseif ($role == 'franchise') {
            $q2 = "SELECT franchise_name, franchise_code FROM hierarchical_franchise WHERE user_identity_id = ?";
            $s2 = $db->prepare($q2);
            $s2->bindParam(1, $row['id']);
            $s2->execute();
            if ($r2 = $s2->fetch(PDO::FETCH_ASSOC)) {
                $responseUser['name'] = $r2['franchise_name'];
                $responseUser['referral_code'] = $r2['franchise_code'];
            }
        } elseif ($role == 'admin') {
            $responseUser['name'] = $row['user_id'] ?: 'Admin'; // Admin uses user_id col as name
            $responseUser['referral_code'] = 'ADMIN';
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'user' => $responseUser
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>