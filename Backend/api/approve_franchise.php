<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

try {
    $db = new Database();
    $conn = $db->getConnection();

    $input = json_decode(file_get_contents('php://input'), true);

    $application_id = $input['application_id'] ?? null;
    $action = $input['action'] ?? null; // 'approve' or 'reject'

    if (!$application_id || !$action) {
        echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
        exit();
    }

    // Get application details
    $stmt = $conn->prepare("SELECT * FROM franchise_applications WHERE id = ?");
    $stmt->execute([$application_id]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        echo json_encode(['success' => false, 'message' => 'Application not found']);
        exit();
    }

    if ($action === 'approve') {
        // Generate franchise code
        $franchise_code = 'FR' . str_pad($application_id, 6, '0', STR_PAD_LEFT);

        // Start transaction
        $conn->beginTransaction();

        try {
            // 1. Create user account
            $user_id = 'FRAN' . str_pad($application_id, 4, '0', STR_PAD_LEFT);

            $insert_user = $conn->prepare("
                INSERT INTO users (user_id, email, password, role, status, is_verified, created_at)
                VALUES (?, ?, ?, 'franchise', 'active', 1, NOW())
            ");
            $insert_user->execute([
                $user_id,
                $application['email'],
                $application['password'] // Already hashed
            ]);

            $user_identity_id = $conn->lastInsertId();

            // 2. Create franchise record
            $insert_franchise = $conn->prepare("
                INSERT INTO hierarchical_franchise (
                    user_identity_id, franchise_name, franchise_code, franchise_type,
                    city, state, pincode, address, gst_number, owner_name, mobile, pan_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $insert_franchise->execute([
                $user_identity_id,
                $application['franchisee_name'],
                $franchise_code,
                $application['franchise_type'],
                $application['city'],
                $application['state'],
                $application['pincode'],
                $application['business_address'],
                $application['gst_number'],
                $application['contact_person_name'],
                $application['mobile_number'],
                $application['pan_number']
            ]);

            // 3. Create wallet
            $insert_wallet = $conn->prepare("
                INSERT INTO wallets (user_identity_id, balance, total_earned, total_withdrawn)
                VALUES (?, 0.00, 0.00, 0.00)
            ");
            $insert_wallet->execute([$user_identity_id]);

            // 4. Create bank details
            $insert_bank = $conn->prepare("
                INSERT INTO bank_details (
                    user_identity_id, bank_name, account_holder, account_number, ifsc_code
                ) VALUES (?, ?, ?, ?, ?)
            ");
            $insert_bank->execute([
                $user_identity_id,
                $application['bank_name'],
                $application['account_holder_name'],
                $application['account_number'],
                $application['ifsc_code']
            ]);

            // 5. Update application status
            $update_app = $conn->prepare("
                UPDATE franchise_applications 
                SET application_status = 'approved',
                    franchise_code = ?,
                    reviewed_at = NOW(),
                    activated_at = NOW()
                WHERE id = ?
            ");
            $update_app->execute([$franchise_code, $application_id]);

            $conn->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Franchise application approved and account created successfully',
                'franchise_code' => $franchise_code,
                'user_id' => $user_id
            ]);

        } catch (Exception $e) {
            $conn->rollBack();
            throw $e;
        }

    } elseif ($action === 'reject') {
        $rejection_reason = $input['rejection_reason'] ?? 'No reason provided';

        $update_app = $conn->prepare("
            UPDATE franchise_applications 
            SET application_status = 'rejected',
                rejection_reason = ?,
                reviewed_at = NOW()
            WHERE id = ?
        ");
        $update_app->execute([$rejection_reason, $application_id]);

        echo json_encode([
            'success' => true,
            'message' => 'Franchise application rejected'
        ]);

    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error processing application: ' . $e->getMessage()
    ]);
}
?>