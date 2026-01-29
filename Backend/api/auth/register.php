<?php
/**
 * Comprehensive User Registration API
 * Handles all registration fields including KYC document uploads
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';
include_once '../../models/User.php';
include_once '../../utils/cors.php';

handleCors();

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Handle multipart/form-data for file uploads
$response = array();

try {
    // Get form data
    $fullName = $_POST['fullName'] ?? '';
    $username = $_POST['username'] ?? '';
    $email = $_POST['email'] ?? '';
    $mobile = $_POST['mobile'] ?? '';
    $password = $_POST['password'] ?? '';
    $dateOfBirth = $_POST['dateOfBirth'] ?? '';

    // Address details
    $country = $_POST['country'] ?? 'India';
    $state = $_POST['state'] ?? '';
    $city = $_POST['city'] ?? '';
    $pinCode = $_POST['pinCode'] ?? '';
    $fullAddress = $_POST['fullAddress'] ?? '';

    // KYC details
    $govIdType = $_POST['govIdType'] ?? 'aadhaar';
    $govIdNumber = $_POST['govIdNumber'] ?? '';
    $panNumber = $_POST['panNumber'] ?? '';

    // MLM Network details
    $sponsorId = $_POST['sponsorId'] ?? '';
    $placement = $_POST['placement'] ?? 'left';
    $uplineId = $_POST['uplineId'] ?? '';

    // Bank details
    $bankName = $_POST['bankName'] ?? '';
    $accountHolderName = $_POST['accountHolderName'] ?? '';
    $accountNumber = $_POST['accountNumber'] ?? '';
    $ifscCode = $_POST['ifscCode'] ?? '';
    $branchName = $_POST['branchName'] ?? '';
    $accountType = $_POST['accountType'] ?? 'savings';

    // Nominee details
    $nomineeName = $_POST['nomineeName'] ?? '';
    $nomineeRelation = $_POST['nomineeRelation'] ?? '';

    // Security
    $transactionPassword = $_POST['transactionPassword'] ?? '';

    // Package selection
    $selectedPackage = $_POST['selectedPackage'] ?? '';

    // Validate strict required fields only (Basic Credentials)
    if (empty($fullName) || empty($username) || empty($email) || empty($password)) {
        throw new Exception('Name, Username, Email, and Password are required.');
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Check if email already exists
    $checkEmailQuery = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($checkEmailQuery);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        throw new Exception('Email already exists');
    }

    // Check if username already exists
    $checkUsernameQuery = "SELECT id FROM hierarchical_users WHERE username = :username";
    $stmt = $db->prepare($checkUsernameQuery);
    $stmt->bindParam(':username', $username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        throw new Exception('Username already taken');
    }

    // Handle KYC document upload
    $kycFilePath = '';
    $kycFileName = '';

    if (isset($_FILES['kycDocument']) && $_FILES['kycDocument']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/kyc/';

        // Create directory if it doesn't exist
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileExtension = pathinfo($_FILES['kycDocument']['name'], PATHINFO_EXTENSION);
        $kycFileName = uniqid('kyc_' . $username . '_') . '.' . $fileExtension;
        $kycFilePath = $uploadDir . $kycFileName;

        // Validate file size (max 5MB)
        if ($_FILES['kycDocument']['size'] > 5 * 1024 * 1024) {
            throw new Exception('KYC document size must be less than 5MB');
        }

        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!in_array($_FILES['kycDocument']['type'], $allowedTypes)) {
            throw new Exception('Invalid file type. Only JPG, PNG, and PDF are allowed');
        }

        if (!move_uploaded_file($_FILES['kycDocument']['tmp_name'], $kycFilePath)) {
            throw new Exception('Failed to upload KYC document');
        }
    }

    // Start transaction
    $db->beginTransaction();

    // Generate user_id and referral_code
    $userId = 'USR' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
    $referralCode = 'REF' . strtoupper(substr($username, 0, 3)) . rand(1000, 9999);

    // Get client IP
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';

    // 1. Insert into users table
    $insertUserQuery = "INSERT INTO users (user_id, email, password, role, status, is_verified, last_login) 
                        VALUES (:user_id, :email, :password, 'user', 'active', 0, NOW())";

    $stmt = $db->prepare($insertUserQuery);
    // REMOVED HASHING: Storing as plain text
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $password);
    $stmt->execute();

    $userIdentityId = $db->lastInsertId();

    // 2. Insert into hierarchical_users table
    $insertHierarchyQuery = "INSERT INTO hierarchical_users (
        user_identity_id, name, username, mobile, referral_code, 
        date_of_birth, country, state, city, pin_code, full_address, pan_number,
        sponsor_id, parent_id, position, selected_package, transaction_password,
        nominee_name, nominee_relation, account_status, last_ip_address, level
    ) VALUES (
        :user_identity_id, :name, :username, :mobile, :referral_code,
        :date_of_birth, :country, :state, :city, :pin_code, :full_address, :pan_number,
        :sponsor_id, :parent_id, :position, :selected_package, :transaction_password,
        :nominee_name, :nominee_relation, 'pending', :ip_address, 1
    )";

    $stmt = $db->prepare($insertHierarchyQuery);
    // REMOVED HASHING for transaction password too

    // Get sponsor_id from hierarchical_users if sponsorId is provided
    $sponsorDbId = null;
    if (!empty($sponsorId)) {
        // Updated to include username check and ensure robustness
        $sponsorQuery = "SELECT id FROM hierarchical_users WHERE referral_code = :sponsor_code OR username = :sponsor_code OR user_identity_id = (SELECT id FROM users WHERE user_id = :sponsor_code)";
        $sponsorStmt = $db->prepare($sponsorQuery);
        $sponsorStmt->bindParam(':sponsor_code', $sponsorId);
        $sponsorStmt->execute();
        if ($sponsorStmt->rowCount() > 0) {
            $sponsorDbId = $sponsorStmt->fetch(PDO::FETCH_ASSOC)['id'];
        } else {
            throw new Exception("Invalid Sponsor ID provided.");
        }
    }

    // Get parent_id (Resolved similar to sponsor)
    // In binary tree: parent is where user is placed, sponsor is who referred them
    $parentDbId = null;
    if (!empty($uplineId)) {
        $parentQuery = "SELECT id FROM hierarchical_users WHERE referral_code = :parent_code OR username = :parent_code OR user_identity_id = (SELECT id FROM users WHERE user_id = :parent_code)";
        $parentStmt = $db->prepare($parentQuery);
        $parentStmt->bindParam(':parent_code', $uplineId);
        $parentStmt->execute();

        if ($parentStmt->rowCount() > 0) {
            $parentDbId = $parentStmt->fetch(PDO::FETCH_ASSOC)['id'];
        } else {
            throw new Exception("Invalid Parent/Upline ID provided.");
        }
    } elseif ($sponsorDbId) {
        // Default to Sponsor if Parent is not provided
        $parentDbId = $sponsorDbId;
    }

    // Spillover Logic: Traverse down to find next available spot in binary tree
    if ($parentDbId && !empty($placement)) {
        // Safety limit to prevent infinite loops
        $maxDepth = 1000;
        $depth = 0;

        while ($depth < $maxDepth) {
            // Check if the position (L or R) is already occupied under this parent
            $posCheckQuery = "SELECT id FROM hierarchical_users WHERE parent_id = :pid AND position = :pos";
            $posCheckStmt = $db->prepare($posCheckQuery);
            $posCheckStmt->bindParam(':pid', $parentDbId);
            $posCheckStmt->bindParam(':pos', $placement);
            $posCheckStmt->execute();

            if ($posCheckStmt->rowCount() > 0) {
                // Position occupied, move down to that child node and check again
                $parentDbId = $posCheckStmt->fetch(PDO::FETCH_ASSOC)['id'];
                $depth++;
            } else {
                // Position available, use this parent
                break;
            }
        }
    }

    $stmt->bindParam(':user_identity_id', $userIdentityId);
    $stmt->bindParam(':name', $fullName);
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':mobile', $mobile);
    $stmt->bindParam(':referral_code', $referralCode);
    $stmt->bindParam(':date_of_birth', $dateOfBirth);
    $stmt->bindParam(':country', $country);
    $stmt->bindParam(':state', $state);
    $stmt->bindParam(':city', $city);
    $stmt->bindParam(':pin_code', $pinCode);
    $stmt->bindParam(':full_address', $fullAddress);
    $stmt->bindParam(':pan_number', $panNumber);
    $stmt->bindParam(':sponsor_id', $sponsorDbId);
    $stmt->bindParam(':parent_id', $parentDbId);
    $stmt->bindParam(':position', $placement);
    $stmt->bindParam(':selected_package', $selectedPackage);
    $stmt->bindParam(':transaction_password', $transactionPassword); // Plain text
    $stmt->bindParam(':nominee_name', $nomineeName);
    $stmt->bindParam(':nominee_relation', $nomineeRelation);
    $stmt->bindParam(':ip_address', $ipAddress);
    $stmt->execute();

    // 3. Insert bank details
    if (!empty($bankName) && !empty($accountNumber)) {
        $insertBankQuery = "INSERT INTO bank_details (
            user_identity_id, bank_name, account_number, ifsc_code, 
            account_holder, branch_name, account_type, is_verified
        ) VALUES (
            :user_identity_id, :bank_name, :account_number, :ifsc_code,
            :account_holder, :branch_name, :account_type, 0
        )";

        $stmt = $db->prepare($insertBankQuery);
        $stmt->bindParam(':user_identity_id', $userIdentityId);
        $stmt->bindParam(':bank_name', $bankName);
        $stmt->bindParam(':account_number', $accountNumber);
        $stmt->bindParam(':ifsc_code', $ifscCode);
        $stmt->bindParam(':account_holder', $accountHolderName);
        $stmt->bindParam(':branch_name', $branchName);
        $stmt->bindParam(':account_type', $accountType);
        $stmt->execute();
    }

    // 4. Insert KYC document
    if (!empty($kycFilePath)) {
        $insertKycQuery = "INSERT INTO kyc_documents (
            user_identity_id, doc_type, doc_number, file_path, status
        ) VALUES (
            :user_identity_id, :doc_type, :doc_number, :file_path, 'pending'
        )";

        $stmt = $db->prepare($insertKycQuery);
        $stmt->bindParam(':user_identity_id', $userIdentityId);
        $stmt->bindParam(':doc_type', $govIdType);
        $stmt->bindParam(':doc_number', $govIdNumber);
        $stmt->bindParam(':file_path', $kycFilePath);
        $stmt->execute();

        // Track uploaded file
        $insertFileQuery = "INSERT INTO uploaded_files (
            user_identity_id, file_type, original_filename, stored_filename, 
            file_path, file_size, mime_type
        ) VALUES (
            :user_identity_id, 'kyc_document', :original_filename, :stored_filename,
            :file_path, :file_size, :mime_type
        )";

        $stmt = $db->prepare($insertFileQuery);
        $stmt->bindParam(':user_identity_id', $userIdentityId);
        $stmt->bindParam(':original_filename', $_FILES['kycDocument']['name']);
        $stmt->bindParam(':stored_filename', $kycFileName);
        $stmt->bindParam(':file_path', $kycFilePath);
        $stmt->bindParam(':file_size', $_FILES['kycDocument']['size']);
        $stmt->bindParam(':mime_type', $_FILES['kycDocument']['type']);
        $stmt->execute();
    }

    // 5. Create wallet for user
    $insertWalletQuery = "INSERT INTO wallets (user_identity_id, balance, total_earned, total_withdrawn) 
                          VALUES (:user_identity_id, 0.00, 0.00, 0.00)";
    $stmt = $db->prepare($insertWalletQuery);
    $stmt->bindParam(':user_identity_id', $userIdentityId);
    $stmt->execute();

    // 6. Log registration
    $registrationData = json_encode(array(
        'username' => $username,
        'email' => $email,
        'package' => $selectedPackage,
        'sponsor' => $sponsorId
    ));

    $insertLogQuery = "INSERT INTO registration_logs (
        user_identity_id, registration_step, ip_address, user_agent, registration_data
    ) VALUES (
        :user_identity_id, 'completed', :ip_address, :user_agent, :registration_data
    )";

    $stmt = $db->prepare($insertLogQuery);
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $stmt->bindParam(':user_identity_id', $userIdentityId);
    $stmt->bindParam(':ip_address', $ipAddress);
    $stmt->bindParam(':user_agent', $userAgent);
    $stmt->bindParam(':registration_data', $registrationData);
    $stmt->execute();

    // Commit transaction
    $db->commit();

    // Success response
    http_response_code(201);
    $response = array(
        'success' => true,
        'message' => 'Registration successful! Your account is pending activation.',
        'data' => array(
            'user_id' => $userId,
            'username' => $username,
            'referral_code' => $referralCode,
            'email' => $email,
            'account_status' => 'pending'
        )
    );

} catch (Exception $e) {
    // Rollback transaction on error
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    // Delete uploaded file if exists
    if (!empty($kycFilePath) && file_exists($kycFilePath)) {
        unlink($kycFilePath);
    }

    http_response_code(400);
    $response = array(
        'success' => false,
        'message' => $e->getMessage()
    );
}

echo json_encode($response);
?>