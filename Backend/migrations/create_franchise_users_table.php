<?php
require_once '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    echo "Creating franchise_users table...\n";

    // Create franchise_users table
    $sql = "CREATE TABLE IF NOT EXISTS franchise_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        franchisee_name VARCHAR(255) NOT NULL,
        contact_person_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(15) NOT NULL,
        franchise_type ENUM('district', 'state', 'master') DEFAULT 'district',
        area_territory VARCHAR(255) NOT NULL,
        business_address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        pan_number VARCHAR(20) NOT NULL,
        govt_id_type ENUM('aadhaar', 'passport') DEFAULT 'aadhaar',
        govt_id_number VARCHAR(50) NOT NULL,
        id_proof_path VARCHAR(500),
        gst_number VARCHAR(20),
        bank_name VARCHAR(255) NOT NULL,
        account_holder_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        ifsc_code VARCHAR(20) NOT NULL,
        agreement_accepted TINYINT(1) DEFAULT 0,
        application_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        admin_remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        approved_at TIMESTAMP NULL,
        approved_by VARCHAR(50),
        UNIQUE KEY unique_user_franchise (user_id),
        INDEX idx_status (application_status),
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $conn->exec($sql);
    echo "✓ franchise_users table created successfully\n";

    echo "\nDatabase setup completed successfully!\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>