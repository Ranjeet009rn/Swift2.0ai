<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Check what's in hierarchical_franchise
    echo "=== HIERARCHICAL_FRANCHISE TABLE ===\n";
    $stmt1 = $conn->query("SELECT * FROM hierarchical_franchise LIMIT 5");
    $hf_data = $stmt1->fetchAll(PDO::FETCH_ASSOC);
    print_r($hf_data);

    echo "\n\n=== USERS WITH FRANCHISE ROLE ===\n";
    $stmt2 = $conn->query("SELECT * FROM users WHERE role = 'franchise' LIMIT 5");
    $user_data = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    print_r($user_data);

    echo "\n\n=== FRANCHISE_APPLICATIONS ===\n";
    $stmt3 = $conn->query("SELECT id, email, franchisee_name, contact_person_name, mobile_number, application_status FROM franchise_applications WHERE application_status = 'approved' LIMIT 5");
    $app_data = $stmt3->fetchAll(PDO::FETCH_ASSOC);
    print_r($app_data);

    echo "\n\n=== JOINED QUERY RESULT ===\n";
    $query = "SELECT 
                hf.id,
                hf.franchise_name,
                hf.franchise_code,
                hf.franchise_type,
                hf.city,
                hf.state,
                u.email,
                u.user_id,
                fa.contact_person_name,
                fa.franchisee_name,
                fa.mobile_number
              FROM hierarchical_franchise hf
              JOIN users u ON hf.user_identity_id = u.id
              LEFT JOIN franchise_applications fa ON u.email = fa.email
              WHERE u.role = 'franchise'
              LIMIT 5";
    $stmt4 = $conn->query($query);
    $joined_data = $stmt4->fetchAll(PDO::FETCH_ASSOC);
    print_r($joined_data);

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
?>