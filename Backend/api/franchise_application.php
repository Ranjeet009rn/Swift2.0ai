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

    // Handle file upload
    $id_proof_path = null;
    if (isset($_FILES['id_proof_file']) && $_FILES['id_proof_file']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = '../uploads/franchise_applications/';

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
        'email',
        'password',
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

    // Check if email already exists
    $check_email = $conn->prepare("SELECT id FROM franchise_applications WHERE email = ?");
    $check_email->execute([$_POST['email']]);
    if ($check_email->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email already registered. Please use a different email.']);
        exit();
    }

    // Hash password
    // SToring password as PLAIN TEXT as per user requirement
    $hashed_password = $_POST['password']; // Storing plain text

    // Insert application
    $sql = "INSERT INTO franchise_applications (
        franchisee_name, contact_person_name, mobile_number, email, password,
        franchise_type, area_territory, business_address, city, state, pincode,
        pan_number, govt_id_type, govt_id_number, id_proof_path, gst_number,
        sponsor_id, bank_name, account_holder_name, account_number, ifsc_code,
        agreement_accepted, application_status
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, 'pending'
    )";

    $stmt = $conn->prepare($sql);
    $result = $stmt->execute([
        $_POST['franchisee_name'],
        $_POST['contact_person_name'],
        $_POST['mobile_number'],
        $_POST['email'],
        $hashed_password,
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
        $_POST['sponsor_id'] ?? null,
        $_POST['bank_name'],
        $_POST['account_holder_name'],
        $_POST['account_number'],
        $_POST['ifsc_code'],
        $_POST['agreement_accepted'] === 'true' ? 1 : 0
    ]);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Franchise application submitted successfully! You will receive a confirmation email within 2-3 business days.'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to submit application. Please try again.']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>