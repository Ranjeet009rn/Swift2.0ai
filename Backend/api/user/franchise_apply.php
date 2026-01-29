<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Get user from token
    $token = $_POST['token'] ?? null;

    if (!$token) {
        echo json_encode(['success' => false, 'message' => 'No token provided']);
        exit();
    }

    // Get user_id from token
    $stmt = $conn->prepare("SELECT user_id, name, email FROM users WHERE user_id = ?");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
        exit();
    }

    $user_id = $user['user_id'];
    $user_name = $user['name'];

    // Check if user already has an application
    $check = $conn->prepare("SELECT id, application_status FROM franchise_users WHERE user_id = ?");
    $check->execute([$user_id]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['application_status'] === 'approved') {
            echo json_encode(['success' => false, 'message' => 'You already have an approved franchise application']);
            exit();
        } else if ($existing['application_status'] === 'pending') {
            echo json_encode(['success' => false, 'message' => 'You already have a pending application. Please wait for admin approval.']);
            exit();
        }
    }

    // Handle file upload
    $id_proof_path = null;
    if (isset($_FILES['id_proof_file']) && $_FILES['id_proof_file']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = '../../uploads/franchise_applications/';

        // Create directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $file_extension = pathinfo($_FILES['id_proof_file']['name'], PATHINFO_EXTENSION);
        $allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png'];

        if (!in_array(strtolower($file_extension), $allowed_extensions)) {
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only PDF, JPG, PNG allowed.']);
            exit();
        }

        // Check file size (5MB max)
        if ($_FILES['id_proof_file']['size'] > 5 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'File size exceeds 5MB limit.']);
            exit();
        }

        $unique_filename = uniqid() . '_' . time() . '.' . $file_extension;
        $target_path = $upload_dir . $unique_filename;

        if (!move_uploaded_file($_FILES['id_proof_file']['tmp_name'], $target_path)) {
            echo json_encode(['success' => false, 'message' => 'File upload failed.']);
            exit();
        }

        $id_proof_path = $target_path;
    } else {
        echo json_encode(['success' => false, 'message' => 'ID proof document is required.']);
        exit();
    }

    // Validate required fields
    $required_fields = [
        'franchisee_name',
        'contact_person_name',
        'mobile_number',
        'franchise_type',
        'area_territory',
        'business_address',
        'city',
        'state',
        'pincode',
        'pan_number',
        'govt_id_type',
        'govt_id_number',
        'bank_name',
        'account_holder_name',
        'account_number',
        'ifsc_code',
        'agreement_accepted'
    ];

    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
            exit();
        }
    }

    // Insert into franchise_users table
    $sql = "INSERT INTO franchise_users (
        user_id, user_name, franchisee_name, contact_person_name, mobile_number,
        franchise_type, area_territory, business_address, city, state, pincode,
        pan_number, govt_id_type, govt_id_number, id_proof_path, gst_number,
        bank_name, account_holder_name, account_number, ifsc_code,
        agreement_accepted, application_status, created_at
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, 'pending', NOW()
    )";

    $stmt = $conn->prepare($sql);
    $result = $stmt->execute([
        $user_id,
        $user_name,
        $_POST['franchisee_name'],
        $_POST['contact_person_name'],
        $_POST['mobile_number'],
        $_POST['franchise_type'],
        $_POST['area_territory'],
        $_POST['business_address'],
        $_POST['city'],
        $_POST['state'],
        $_POST['pincode'],
        $_POST['pan_number'],
        $_POST['govt_id_type'],
        $_POST['govt_id_number'],
        $id_proof_path,
        $_POST['gst_number'] ?? null,
        $_POST['bank_name'],
        $_POST['account_holder_name'],
        $_POST['account_number'],
        $_POST['ifsc_code'],
        $_POST['agreement_accepted'] === 'true' ? 1 : 0
    ]);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Franchise application submitted successfully! You will receive a confirmation within 2-3 business days.'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to submit application. Please try again.']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>