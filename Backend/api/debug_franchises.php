<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Check hierarchical_franchise table
    $stmt1 = $conn->query("SELECT COUNT(*) as count FROM hierarchical_franchise");
    $hf_count = $stmt1->fetch(PDO::FETCH_ASSOC);

    // Check users with franchise role
    $stmt2 = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'franchise'");
    $user_count = $stmt2->fetch(PDO::FETCH_ASSOC);

    // Get sample data
    $stmt3 = $conn->query("SELECT * FROM hierarchical_franchise LIMIT 5");
    $sample_hf = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    // Get the actual query result from franchises.php
    $query = "SELECT 
                hf.id,
                hf.franchise_name as name,
                hf.franchise_code,
                hf.franchise_type as type,
                hf.city,
                hf.state,
                hf.pincode,
                hf.address,
                hf.gst_number,
                hf.stock_value as stock,
                u.email,
                u.user_id as user_code,
                u.role,
                u.status,
                u.created_at,
                CONCAT(hf.city, ', ', hf.state) as region,
                fa.contact_person_name as owner,
                fa.mobile_number as phone,
                0 as sales
              FROM hierarchical_franchise hf
              JOIN users u ON hf.user_identity_id = u.id
              LEFT JOIN franchise_applications fa ON u.email = fa.email
              WHERE u.role = 'franchise'
              ORDER BY hf.id DESC";
    $stmt4 = $conn->query($query);
    $franchises = $stmt4->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'debug_info' => [
            'hierarchical_franchise_count' => $hf_count['count'],
            'franchise_users_count' => $user_count['count'],
            'sample_hierarchical_franchise' => $sample_hf,
            'final_query_result' => $franchises,
            'final_query_count' => count($franchises)
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>