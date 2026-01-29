<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/plain');

// Direct database connection
$host = "localhost";
$db_name = "mlmswift";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "=== DATABASE CHECK ===\n\n";

    // Check hierarchical_franchise
    echo "1. HIERARCHICAL_FRANCHISE TABLE:\n";
    $stmt = $conn->query("SELECT id, franchise_name, franchise_code, city, state, user_identity_id FROM hierarchical_franchise LIMIT 3");
    $count = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $count++;
        echo "  Row $count:\n";
        echo "    ID: {$row['id']}\n";
        echo "    Name: {$row['franchise_name']}\n";
        echo "    Code: {$row['franchise_code']}\n";
        echo "    Location: {$row['city']}, {$row['state']}\n";
        echo "    User Identity ID: {$row['user_identity_id']}\n\n";
    }
    if ($count == 0)
        echo "  No data found!\n\n";

    // Check users
    echo "2. USERS TABLE (franchise role):\n";
    $stmt = $conn->query("SELECT id, user_id, email, role FROM users WHERE role = 'franchise' LIMIT 3");
    $count = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $count++;
        echo "  Row $count:\n";
        echo "    ID: {$row['id']}\n";
        echo "    User ID: {$row['user_id']}\n";
        echo "    Email: {$row['email']}\n";
        echo "    Role: {$row['role']}\n\n";
    }
    if ($count == 0)
        echo "  No franchise users found!\n\n";

    // Check franchise_applications
    echo "3. FRANCHISE_APPLICATIONS (approved):\n";
    $stmt = $conn->query("SELECT id, email, franchisee_name, contact_person_name, mobile_number FROM franchise_applications WHERE application_status = 'approved' LIMIT 3");
    $count = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $count++;
        echo "  Row $count:\n";
        echo "    ID: {$row['id']}\n";
        echo "    Email: {$row['email']}\n";
        echo "    Franchisee Name: {$row['franchisee_name']}\n";
        echo "    Contact Person: {$row['contact_person_name']}\n";
        echo "    Phone: {$row['mobile_number']}\n\n";
    }
    if ($count == 0)
        echo "  No approved applications found!\n\n";

    // Check the JOIN
    echo "4. JOINED QUERY (what the API should return):\n";
    $query = "SELECT 
                hf.id,
                hf.franchise_name,
                hf.city,
                hf.state,
                u.email as user_email,
                fa.email as app_email,
                fa.contact_person_name,
                fa.franchisee_name
              FROM hierarchical_franchise hf
              JOIN users u ON hf.user_identity_id = u.id
              LEFT JOIN franchise_applications fa ON u.email = fa.email
              WHERE u.role = 'franchise'
              LIMIT 3";
    $stmt = $conn->query($query);
    $count = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $count++;
        echo "  Row $count:\n";
        echo "    Franchise Name: {$row['franchise_name']}\n";
        echo "    Location: {$row['city']}, {$row['state']}\n";
        echo "    User Email: {$row['user_email']}\n";
        echo "    App Email: {$row['app_email']}\n";
        echo "    Contact Person: {$row['contact_person_name']}\n";
        echo "    Franchisee Name: {$row['franchisee_name']}\n\n";
    }
    if ($count == 0)
        echo "  No joined data found!\n\n";

} catch (PDOException $e) {
    echo "DATABASE ERROR: " . $e->getMessage() . "\n";
}
?>