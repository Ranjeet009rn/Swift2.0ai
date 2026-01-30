<?php
header("Content-Type: application/json");

// Ensure PHP errors do not break JSON responses
ini_set('display_errors', '0');
ini_set('html_errors', '0');

set_exception_handler(function ($e) {
    if (!headers_sent()) {
        http_response_code(500);
    }
    echo json_encode(["error" => "Server error", "details" => $e->getMessage()]);
    exit;
});

set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

register_shutdown_function(function () {
    $err = error_get_last();
    if (!$err)
        return;
    $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR];
    if (!in_array($err['type'], $fatalTypes, true))
        return;
    if (!headers_sent()) {
        http_response_code(500);
    }
    echo json_encode(["error" => "Server error", "details" => $err['message']]);
    exit;
});

/* =======================
   CORS (Localhost only)
======================= */
$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
$allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://192.168.29.35:3000",  // Network IP
    "http://127.0.0.1:3000"
];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}

function ensure_order_analytics_schema($mysqli)
{
    // Best-effort schema upgrades (idempotent)
    $hasPaymentMethod = false;
    $colRes = $mysqli->query("SHOW COLUMNS FROM orders LIKE 'payment_method'");
    if ($colRes && $colRes->num_rows > 0) {
        $hasPaymentMethod = true;
    }
    if ($colRes) {
        $colRes->free();
    }
    if (!$hasPaymentMethod) {
        $mysqli->query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) NULL AFTER status");
    }

    $create = "CREATE TABLE IF NOT EXISTS order_items (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id INT UNSIGNED NOT NULL,
        artwork_id INT UNSIGNED NULL,
        category VARCHAR(80) NULL,
        quantity INT NOT NULL DEFAULT 1,
        price INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY order_items_order_id_idx (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $mysqli->query($create);

    // If table existed already with older schema, add missing columns
    $cols = [];
    $res = $mysqli->query("SHOW COLUMNS FROM order_items");
    if ($res) {
        while ($r = $res->fetch_assoc()) {
            if (!empty($r['Field'])) {
                $cols[$r['Field']] = true;
            }
        }
        $res->free();
    }

    if (!isset($cols['category'])) {
        $mysqli->query("ALTER TABLE order_items ADD COLUMN category VARCHAR(80) NULL AFTER artwork_id");
    }
    if (!isset($cols['quantity'])) {
        $mysqli->query("ALTER TABLE order_items ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER category");
    }
    if (!isset($cols['price'])) {
        $mysqli->query("ALTER TABLE order_items ADD COLUMN price INT NOT NULL DEFAULT 0 AFTER quantity");
    }
    if (!isset($cols['created_at'])) {
        $mysqli->query("ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
    }
}

function ensure_user_shipping_schema($mysqli)
{
    // Best-effort schema upgrades for user shipping defaults (idempotent)
    $cols = [
        "shipping_phone" => "VARCHAR(40) NULL",
        "shipping_address" => "VARCHAR(255) NULL",
        "shipping_city" => "VARCHAR(120) NULL",
        "shipping_state" => "VARCHAR(120) NULL",
        "shipping_pincode" => "VARCHAR(20) NULL",
    ];

    foreach ($cols as $col => $ddl) {
        if (!column_exists($mysqli, "users", $col)) {
            $mysqli->query("ALTER TABLE users ADD COLUMN {$col} {$ddl}");
        }
    }
}
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

function column_exists($mysqli, $table, $column)
{
    $table = preg_replace('/[^a-zA-Z0-9_]/', '', (string) $table);
    $column = preg_replace('/[^a-zA-Z0-9_]/', '', (string) $column);
    if ($table === '' || $column === '')
        return false;
    $res = $mysqli->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
    if ($res) {
        $ok = $res->num_rows > 0;
        $res->free();
        return $ok;
    }
    return false;
}

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

/* =======================
   SESSION
======================= */
ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_samesite', 'Lax');
session_start();

require_once __DIR__ . "/config.php";

/* =======================
   HELPERS
======================= */
function json_ok($data)
{
    echo json_encode($data);
    exit;
}

function json_error($message, $status = 400, $extra = null)
{
    http_response_code($status);
    $res = ["error" => $message];
    if ($extra !== null)
        $res["details"] = $extra;
    echo json_encode($res);
    exit;
}

function require_post()
{
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        json_error("Method not allowed", 405);
    }
}

function get_json_input()
{
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data))
        json_error("Invalid JSON");
    return $data;
}

function require_admin()
{
    if (!isset($_SESSION["admin_id"])) {
        json_error("Unauthorized", 401);
    }
}

function require_user()
{
    if (!isset($_SESSION["user_id"])) {
        json_error("Unauthorized", 401);
    }
    return (int) $_SESSION["user_id"];
}

function ensure_admin_user($mysqli)
{
    require_admin();
    $adminId = (int) $_SESSION["admin_id"];
    $email = (string) ($_SESSION["admin_email"] ?? "admin@example.com");

    $stmt = $mysqli->prepare("SELECT id,name,email,password_hash FROM admin_users WHERE id=?");
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("i", $adminId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row)
        return $row;

    // Bootstrap admin user record on first use (dev-friendly)
    $name = "Admin";
    $hash = password_hash("admin", PASSWORD_BCRYPT);
    $stmt2 = $mysqli->prepare("INSERT INTO admin_users (id,name,email,password_hash) VALUES (?,?,?,?)");
    if (!$stmt2)
        json_error("DB error", 500);
    $stmt2->bind_param("isss", $adminId, $name, $email, $hash);
    $stmt2->execute();
    $stmt2->close();

    return ["id" => $adminId, "name" => $name, "email" => $email, "password_hash" => $hash];
}

function ensure_store_settings($mysqli)
{
    $stmt = $mysqli->prepare("SELECT id,store_name,store_logo,contact_phone,contact_email,delivery_charges,instagram_url,whatsapp_url,updated_at FROM store_settings WHERE id=1");
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row)
        return $row;

    $storeName = "Poorva's Art";
    $delivery = 0;
    $stmt2 = $mysqli->prepare("INSERT INTO store_settings (id, store_name, delivery_charges) VALUES (1, ?, ?)");
    if (!$stmt2)
        json_error("DB error", 500);
    $stmt2->bind_param("si", $storeName, $delivery);
    $stmt2->execute();
    $stmt2->close();

    return [
        "id" => 1,
        "store_name" => $storeName,
        "store_logo" => null,
        "contact_phone" => null,
        "contact_email" => null,
        "delivery_charges" => 0,
        "instagram_url" => null,
        "whatsapp_url" => null,
        "updated_at" => null,
    ];
}

function image_url($path)
{
    if (!$path)
        return "";
    // If already an absolute URL, return as-is
    if (preg_match('#^https?://#i', (string) $path)) {
        return (string) $path;
    }
    return "http://localhost/art-e-commerce-website/art-admin-backend/" . ltrim($path, "/");
}

$path = $_GET["path"] ?? "";

/* =======================
   ADMIN LOGIN (DEV ONLY)
======================= */
if ($path === "login") {
    require_post();
    $input = get_json_input();

    $_SESSION["admin_id"] = 1;
    $_SESSION["admin_email"] = $input["email"] ?? "admin@example.com";

    json_ok([
        "message" => "Login successful",
        "admin" => [
            "id" => 1,
            "email" => $_SESSION["admin_email"]
        ]
    ]);
}

/* =======================
   ADMIN ME
======================= */
if ($path === "admin_me") {
    require_admin();
    json_ok([
        "admin" => [
            "id" => (int) $_SESSION["admin_id"],
            "email" => (string) ($_SESSION["admin_email"] ?? "admin@example.com"),
        ]
    ]);
}

/* =======================
   ADMIN PROFILE GET
======================= */
if ($path === "admin_profile_get") {
    $admin = ensure_admin_user($mysqli);
    json_ok([
        "admin" => [
            "id" => (int) $admin["id"],
            "name" => (string) $admin["name"],
            "email" => (string) $admin["email"],
        ]
    ]);
}

/* =======================
   ADMIN PROFILE UPDATE
======================= */
if ($path === "admin_profile_update") {
    require_post();
    $admin = ensure_admin_user($mysqli);
    $i = get_json_input();

    $name = trim((string) ($i["name"] ?? ""));
    $email = trim((string) ($i["email"] ?? ""));
    if ($name === "" || $email === "") {
        json_error("Missing fields", 400);
    }

    $adminId = (int) $admin["id"];
    $stmt = $mysqli->prepare("UPDATE admin_users SET name=?, email=? WHERE id=?");
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("ssi", $name, $email, $adminId);
    if (!$stmt->execute()) {
        $stmt->close();
        json_error("Failed to update profile", 500);
    }
    $stmt->close();

    $_SESSION["admin_email"] = $email;
    json_ok(["message" => "Saved"]);
}

/* =======================
   ADMIN CHANGE PASSWORD
======================= */
if ($path === "admin_change_password") {
    require_post();
    $admin = ensure_admin_user($mysqli);
    $i = get_json_input();

    $current = (string) ($i["currentPassword"] ?? "");
    $next = (string) ($i["newPassword"] ?? "");
    if ($current === "" || $next === "") {
        json_error("Missing fields", 400);
    }
    if (strlen($next) < 6) {
        json_error("Password too short", 400);
    }

    if (!password_verify($current, (string) $admin["password_hash"])) {
        json_error("Current password is incorrect", 400);
    }

    $hash = password_hash($next, PASSWORD_BCRYPT);
    $adminId = (int) $admin["id"];
    $stmt = $mysqli->prepare("UPDATE admin_users SET password_hash=? WHERE id=?");
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("si", $hash, $adminId);
    if (!$stmt->execute()) {
        $stmt->close();
        json_error("Failed to change password", 500);
    }
    $stmt->close();
    json_ok(["message" => "Password updated"]);
}

/* =======================
   STORE SETTINGS GET
======================= */
if ($path === "store_settings_get") {
    require_admin();
    $row = ensure_store_settings($mysqli);
    json_ok([
        "settings" => [
            "storeName" => (string) ($row["store_name"] ?? ""),
            "storeLogo" => image_url((string) ($row["store_logo"] ?? "")),
            "contactPhone" => (string) ($row["contact_phone"] ?? ""),
            "contactEmail" => (string) ($row["contact_email"] ?? ""),
            "deliveryCharges" => (int) ($row["delivery_charges"] ?? 0),
            "instagramUrl" => (string) ($row["instagram_url"] ?? ""),
            "whatsappUrl" => (string) ($row["whatsapp_url"] ?? ""),
        ]
    ]);
}

/* =======================
   STORE SETTINGS UPDATE (JSON or multipart)
======================= */
if ($path === "store_settings_update") {
    require_admin();
    require_post();

    // Ensure row exists
    ensure_store_settings($mysqli);

    $storeName = "";
    $contactPhone = "";
    $contactEmail = "";
    $deliveryCharges = 0;
    $instagramUrl = "";
    $whatsappUrl = "";
    $logoPath = null;

    $contentType = $_SERVER["CONTENT_TYPE"] ?? "";
    $isMultipart = stripos($contentType, "multipart/form-data") !== false;

    if ($isMultipart) {
        $storeName = trim((string) ($_POST["storeName"] ?? ""));
        $contactPhone = trim((string) ($_POST["contactPhone"] ?? ""));
        $contactEmail = trim((string) ($_POST["contactEmail"] ?? ""));
        $deliveryCharges = (int) ($_POST["deliveryCharges"] ?? 0);
        $instagramUrl = trim((string) ($_POST["instagramUrl"] ?? ""));
        $whatsappUrl = trim((string) ($_POST["whatsappUrl"] ?? ""));

        $hasFile = isset($_FILES["logo"]) && is_array($_FILES["logo"]) && (($_FILES["logo"]["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE);
        if ($hasFile) {
            if (($_FILES["logo"]["error"] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                json_error("Logo upload failed", 400);
            }

            $tmp = $_FILES["logo"]["tmp_name"];
            $original = (string) ($_FILES["logo"]["name"] ?? "");
            $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
            $allowedExt = ["jpg", "jpeg", "png", "webp", "gif"];
            if (!in_array($ext, $allowedExt, true)) {
                json_error("Unsupported image type", 400);
            }

            $uploadDir = __DIR__ . "/uploads/store";
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0777, true);
            }
            if (!is_dir($uploadDir)) {
                json_error("Upload directory not writable", 500);
            }

            $filename = "store_logo_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $ext;
            $dest = $uploadDir . "/" . $filename;
            if (!move_uploaded_file($tmp, $dest)) {
                json_error("Failed to save uploaded file", 500);
            }

            $logoPath = "uploads/store/" . $filename;
        }
    } else {
        $i = get_json_input();
        $storeName = trim((string) ($i["storeName"] ?? ""));
        $contactPhone = trim((string) ($i["contactPhone"] ?? ""));
        $contactEmail = trim((string) ($i["contactEmail"] ?? ""));
        $deliveryCharges = (int) ($i["deliveryCharges"] ?? 0);
        $instagramUrl = trim((string) ($i["instagramUrl"] ?? ""));
        $whatsappUrl = trim((string) ($i["whatsappUrl"] ?? ""));
    }

    if ($storeName === "") {
        json_error("Store name is required", 400);
    }
    if ($deliveryCharges < 0) {
        json_error("Delivery charges must be 0 or more", 400);
    }

    if ($logoPath !== null) {
        $stmt = $mysqli->prepare(
            "UPDATE store_settings
             SET store_name=?, store_logo=?, contact_phone=?, contact_email=?, delivery_charges=?, instagram_url=?, whatsapp_url=?
             WHERE id=1"
        );
        if (!$stmt)
            json_error("DB error", 500);
        $stmt->bind_param("ssssiss", $storeName, $logoPath, $contactPhone, $contactEmail, $deliveryCharges, $instagramUrl, $whatsappUrl);
    } else {
        $stmt = $mysqli->prepare(
            "UPDATE store_settings
             SET store_name=?, contact_phone=?, contact_email=?, delivery_charges=?, instagram_url=?, whatsapp_url=?
             WHERE id=1"
        );
        if (!$stmt)
            json_error("DB error", 500);
        $stmt->bind_param("sssiss", $storeName, $contactPhone, $contactEmail, $deliveryCharges, $instagramUrl, $whatsappUrl);
    }

    if (!$stmt->execute()) {
        $stmt->close();
        json_error("Failed to save settings", 500);
    }
    $stmt->close();

    $row = ensure_store_settings($mysqli);
    json_ok([
        "message" => "Saved",
        "settings" => [
            "storeName" => (string) ($row["store_name"] ?? ""),
            "storeLogo" => image_url((string) ($row["store_logo"] ?? "")),
            "contactPhone" => (string) ($row["contact_phone"] ?? ""),
            "contactEmail" => (string) ($row["contact_email"] ?? ""),
            "deliveryCharges" => (int) ($row["delivery_charges"] ?? 0),
            "instagramUrl" => (string) ($row["instagram_url"] ?? ""),
            "whatsappUrl" => (string) ($row["whatsapp_url"] ?? ""),
        ]
    ]);
}

/* =======================
   ADMIN LOGOUT
======================= */
if ($path === "admin_logout") {
    require_post();
    session_destroy();
    json_ok(["message" => "Logged out"]);
}

/* =======================
   SIGNUP
======================= */
if ($path === "signup") {
    require_post();
    $i = get_json_input();

    $name = trim($i["name"] ?? "");
    $email = trim($i["email"] ?? "");
    $password = $i["password"] ?? "";

    if ($name === "" || $email === "" || $password === "") {
        json_error("Missing fields");
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $mysqli->prepare("INSERT INTO users (name,email,password_hash) VALUES (?,?,?)");
    if (!$stmt)
        json_error("DB error", 500);

    $stmt->bind_param("sss", $name, $email, $hash);

    if (!$stmt->execute()) {
        if ($mysqli->errno === 1062)
            json_error("Email exists", 409);
        json_error("Signup failed", 500);
    }

    json_ok(["message" => "Signup successful"]);
}

/* =======================
   USER LOGIN
======================= */
if ($path === "user_login") {
    require_post();
    $i = get_json_input();

    $stmt = $mysqli->prepare("SELECT id,name,email,password_hash FROM users WHERE email=?");
    $stmt->bind_param("s", $i["email"]);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    if (!$res || !password_verify($i["password"], $res["password_hash"])) {
        json_error("Invalid credentials", 401);
    }

    $_SESSION["user_id"] = $res["id"];

    json_ok([
        "message" => "Login successful",
        "user" => [
            "id" => $res["id"],
            "name" => $res["name"],
            "email" => $res["email"]
        ]
    ]);
}

/* =======================
   USER LOGOUT
======================= */
if ($path === "user_logout") {
    require_post();
    session_destroy();
    json_ok(["message" => "Logged out"]);
}

/* =======================
   FORGOT PASSWORD
======================= */
if ($path === "forgot_password" || $path === "user_forgot_password") {
    require_post();

    // Load email config only when needed
    require_once __DIR__ . "/email_config.php";

    $i = get_json_input();

    $email = trim($i["email"] ?? "");
    if ($email === "") {
        json_error("Email is required", 400);
    }

    // Check if email exists
    $stmt = $mysqli->prepare("SELECT id FROM users WHERE email=?");
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        // Don't reveal if email exists (security best practice)
        // But for development, we'll show a message
        json_error("Email not found", 404);
    }

    $userId = (int) $user["id"];

    // Generate secure token (32 bytes = 64 hex characters)
    $token = bin2hex(random_bytes(32));

    // Set expiry time (30 minutes from now)
    $expiresAt = date("Y-m-d H:i:s", strtotime("+30 minutes"));

    // Delete any existing tokens for this user
    $deleteStmt = $mysqli->prepare("DELETE FROM password_resets WHERE user_id=?");
    if ($deleteStmt) {
        $deleteStmt->bind_param("i", $userId);
        $deleteStmt->execute();
        $deleteStmt->close();
    }

    // Insert new token
    $insertStmt = $mysqli->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
    if (!$insertStmt)
        json_error("DB error", 500);
    $insertStmt->bind_param("iss", $userId, $token, $expiresAt);
    if (!$insertStmt->execute()) {
        $insertStmt->close();
        json_error("Failed to generate reset token", 500);
    }
    $insertStmt->close();

    // Generate reset link
    $resetLink = "http://localhost/art-e-commerce-website/reset-password.php?token=" . $token;

    // Send password reset email
    $emailSent = send_password_reset_email($email, $resetLink);

    if (!$emailSent) {
        // For development: still return success even if email fails
        // In production: you might want to return an error
        json_ok([
            "message" => "Reset link generated (email sending disabled for localhost)",
            "resetLink" => $resetLink,  // Remove this in production!
            "expiresIn" => "30 minutes"
        ]);
    }

    // Success response (email sent)
    json_ok([
        "message" => "Password reset link has been sent to your email",
        "expiresIn" => "30 minutes"
    ]);
}

/* =======================
   RESET PASSWORD
======================= */
if ($path === "reset_password") {
    require_post();
    $i = get_json_input();

    $token = trim($i["token"] ?? "");
    $newPassword = $i["password"] ?? "";

    if ($token === "" || $newPassword === "") {
        json_error("Missing fields", 400);
    }

    if (strlen($newPassword) < 6) {
        json_error("Password must be at least 6 characters", 400);
    }

    // Verify token and check expiry
    $stmt = $mysqli->prepare("SELECT user_id FROM password_resets WHERE token=? AND expires_at > NOW()");
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    $resetData = $result->fetch_assoc();
    $stmt->close();

    if (!$resetData) {
        json_error("Invalid or expired reset token", 400);
    }

    $userId = (int) $resetData["user_id"];

    // Hash new password
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);

    // Update password
    $updateStmt = $mysqli->prepare("UPDATE users SET password_hash=? WHERE id=?");
    if (!$updateStmt)
        json_error("DB error", 500);
    $updateStmt->bind_param("si", $hash, $userId);
    if (!$updateStmt->execute()) {
        $updateStmt->close();
        json_error("Failed to update password", 500);
    }
    $updateStmt->close();

    // Delete used token
    $deleteStmt = $mysqli->prepare("DELETE FROM password_resets WHERE token=?");
    if ($deleteStmt) {
        $deleteStmt->bind_param("s", $token);
        $deleteStmt->execute();
        $deleteStmt->close();
    }

    json_ok(["message" => "Password updated successfully"]);
}

/* =======================
   USER SHIPPING GET (DEFAULT)
   GET /api.php?path=user_shipping_get
======================= */
if ($path === "user_shipping_get") {
    $userId = require_user();
    ensure_user_shipping_schema($mysqli);

    $stmt = $mysqli->prepare(
        "SELECT shipping_phone, shipping_address, shipping_city, shipping_state, shipping_pincode, email, name
         FROM users WHERE id=?"
    );
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row)
        json_error("User not found", 404);

    $hasAny = false;
    foreach (["shipping_phone", "shipping_address", "shipping_city", "shipping_state", "shipping_pincode"] as $k) {
        if (trim((string) ($row[$k] ?? "")) !== "") {
            $hasAny = true;
            break;
        }
    }

    json_ok([
        "shipping" => $hasAny ? [
            "email" => (string) ($row["email"] ?? ""),
            "phone" => (string) ($row["shipping_phone"] ?? ""),
            "address" => (string) ($row["shipping_address"] ?? ""),
            "city" => (string) ($row["shipping_city"] ?? ""),
            "state" => (string) ($row["shipping_state"] ?? ""),
            "pincode" => (string) ($row["shipping_pincode"] ?? ""),
        ] : null
    ]);
}

/* =======================
   USER SHIPPING UPDATE (DEFAULT)
   POST /api.php?path=user_shipping_update
======================= */
if ($path === "user_shipping_update") {
    require_post();
    $userId = require_user();
    ensure_user_shipping_schema($mysqli);
    $i = get_json_input();

    $phone = trim((string) ($i["phone"] ?? ""));
    $address = trim((string) ($i["address"] ?? ""));
    $city = trim((string) ($i["city"] ?? ""));
    $state = trim((string) ($i["state"] ?? ""));
    $pincode = trim((string) ($i["pincode"] ?? ""));

    if ($phone === "" || $address === "" || $city === "" || $state === "" || $pincode === "") {
        json_error("Missing fields", 400);
    }

    $stmt = $mysqli->prepare(
        "UPDATE users
         SET shipping_phone=?, shipping_address=?, shipping_city=?, shipping_state=?, shipping_pincode=?
         WHERE id=?"
    );
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("sssssi", $phone, $address, $city, $state, $pincode, $userId);
    if (!$stmt->execute()) {
        $stmt->close();
        json_error("Failed to save", 500);
    }
    $stmt->close();

    json_ok(["message" => "Saved"]);
}

/* =======================
   USER ORDERS GET
   GET /api.php?path=user_orders_get
======================= */
if ($path === "user_orders_get") {
    $userId = isset($_SESSION["user_id"]) ? (int) $_SESSION["user_id"] : null;
    $userEmail = null;
    $userName = null;

    // Fallback: allow resolving user by email if session is missing
    if ($userId === null) {
        $emailParam = trim((string) ($_GET["email"] ?? ""));
        if ($emailParam !== "") {
            $u0 = $mysqli->prepare("SELECT id,name,email FROM users WHERE email=? LIMIT 1");
            if ($u0) {
                $u0->bind_param("s", $emailParam);
                $u0->execute();
                $r0 = $u0->get_result()->fetch_assoc();
                $u0->close();
                if ($r0 && isset($r0["id"])) {
                    $userId = (int) $r0["id"];
                    $userName = trim((string) ($r0["name"] ?? ""));
                    $userEmail = trim((string) ($r0["email"] ?? ""));
                }
            }
        }
    }

    if ($userId === null) {
        json_error("Unauthorized", 401);
    }

    // Load user name/email (for matching legacy orders where user_id is NULL)
    if ($userName === null || $userEmail === null) {
        $u1 = $mysqli->prepare("SELECT name,email FROM users WHERE id=? LIMIT 1");
        if ($u1) {
            $u1->bind_param("i", $userId);
            $u1->execute();
            $r1 = $u1->get_result()->fetch_assoc();
            $u1->close();
            if ($r1) {
                $userName = trim((string) ($r1["name"] ?? ""));
                $userEmail = trim((string) ($r1["email"] ?? ""));
            }
        }
    }

    ensure_order_analytics_schema($mysqli);

    $createdCol = null;
    if (column_exists($mysqli, "orders", "created_at")) {
        $createdCol = "created_at";
    } elseif (column_exists($mysqli, "orders", "createdAt")) {
        $createdCol = "createdAt";
    }

    $cols = "id, customer_name, shipping_address, total_amount, status";
    if (column_exists($mysqli, "orders", "payment_method")) {
        $cols .= ", payment_method";
    } else {
        $cols .= ", NULL AS payment_method";
    }

    // Legacy columns (older schema)
    if (column_exists($mysqli, "orders", "artwork_title")) {
        $cols .= ", artwork_title";
    } else {
        $cols .= ", NULL AS artwork_title";
    }
    if (column_exists($mysqli, "orders", "artwork_id")) {
        $cols .= ", artwork_id";
    } else {
        $cols .= ", NULL AS artwork_id";
    }
    if (column_exists($mysqli, "orders", "amount")) {
        $cols .= ", amount";
    } else {
        $cols .= ", NULL AS amount";
    }

    if ($createdCol !== null) {
        $cols .= ", {$createdCol} AS created_at";
    } else {
        $cols .= ", NULL AS created_at";
    }

    $stmt = $mysqli->prepare(
        "SELECT {$cols}
         FROM orders
         WHERE user_id=?
            OR (user_id IS NULL AND (customer_name=? OR customer_name=?))
         ORDER BY id DESC
         LIMIT 50"
    );
    if (!$stmt)
        json_error("DB error", 500);
    $nameMatch = (string) ($userName ?? "");
    $emailMatch = (string) ($userEmail ?? "");
    $stmt->bind_param("iss", $userId, $nameMatch, $emailMatch);
    $stmt->execute();
    $res = $stmt->get_result();

    $orders = [];
    $itemStmt = $mysqli->prepare(
        "SELECT oi.artwork_id, oi.category, oi.quantity, oi.price,
                a.title AS artwork_title, a.image AS artwork_image
         FROM order_items oi
         LEFT JOIN artworks a ON a.id = oi.artwork_id
         WHERE oi.order_id=?
         ORDER BY oi.id ASC"
    );

    while ($row = $res->fetch_assoc()) {
        $orderId = (int) ($row["id"] ?? 0);
        $order = [
            "id" => $orderId,
            "customer_name" => (string) ($row["customer_name"] ?? ""),
            "shipping_address" => (string) ($row["shipping_address"] ?? ""),
            "total_amount" => (int) ($row["total_amount"] ?? 0),
            "status" => (string) ($row["status"] ?? ""),
            "payment_method" => (string) ($row["payment_method"] ?? ""),
            "artwork_title" => (string) ($row["artwork_title"] ?? ""),
            "artwork_id" => (int) ($row["artwork_id"] ?? 0),
            "amount" => (int) ($row["amount"] ?? 0),
            "created_at" => $row["created_at"],
            "items" => [],
        ];

        if ($itemStmt) {
            $itemStmt->bind_param("i", $orderId);
            if ($itemStmt->execute()) {
                $ir = $itemStmt->get_result();
                while ($it = $ir->fetch_assoc()) {
                    $order["items"][] = [
                        "artwork_id" => (int) ($it["artwork_id"] ?? 0),
                        "title" => (string) ($it["artwork_title"] ?? ""),
                        "image" => image_url($it["artwork_image"] ?? ""),
                        "category" => (string) ($it["category"] ?? ""),
                        "quantity" => (int) ($it["quantity"] ?? 1),
                        "price" => (int) ($it["price"] ?? 0),
                    ];
                }
            }
        }

        // Fallback for legacy orders: if order_items are missing, try to derive a single item
        if (count($order["items"]) === 0) {
            $legacyTitle = trim((string) ($row["artwork_title"] ?? ""));
            $legacyArtworkId = (int) ($row["artwork_id"] ?? 0);
            $legacyAmount = (int) ($row["amount"] ?? 0);

            $artId = $legacyArtworkId;
            $artTitle = $legacyTitle;
            $artImage = "";
            $artPrice = 0;

            if ($artId > 0) {
                $s1 = $mysqli->prepare("SELECT id,title,image,price FROM artworks WHERE id=? LIMIT 1");
                if ($s1) {
                    $s1->bind_param("i", $artId);
                    $s1->execute();
                    $ar = $s1->get_result()->fetch_assoc();
                    $s1->close();
                    if ($ar) {
                        $artTitle = $artTitle !== "" ? $artTitle : (string) ($ar["title"] ?? "");
                        $artImage = (string) ($ar["image"] ?? "");
                        $artPrice = (int) ($ar["price"] ?? 0);
                    }
                }
            } elseif ($artTitle !== "") {
                $s2 = $mysqli->prepare("SELECT id,title,image,price FROM artworks WHERE title=? LIMIT 1");
                if ($s2) {
                    $s2->bind_param("s", $artTitle);
                    $s2->execute();
                    $ar = $s2->get_result()->fetch_assoc();
                    $s2->close();
                    if ($ar) {
                        $artId = (int) ($ar["id"] ?? 0);
                        $artTitle = (string) ($ar["title"] ?? $artTitle);
                        $artImage = (string) ($ar["image"] ?? "");
                        $artPrice = (int) ($ar["price"] ?? 0);
                    }
                }
            }

            if ($artTitle !== "" || $artId > 0) {
                $fallbackPrice = $artPrice > 0 ? $artPrice : ($legacyAmount > 0 ? $legacyAmount : (int) ($row["total_amount"] ?? 0));
                $order["items"][] = [
                    "artwork_id" => $artId,
                    "title" => $artTitle !== "" ? $artTitle : "Artwork",
                    "image" => image_url($artImage),
                    "category" => "",
                    "quantity" => 1,
                    "price" => (int) $fallbackPrice,
                ];
            }
        }

        $orders[] = $order;
    }

    if ($itemStmt) {
        $itemStmt->close();
    }
    $stmt->close();

    json_ok(["orders" => $orders]);
}

/* =======================
   WISHLIST ADD
======================= */
if ($path === "wishlist_add") {
    require_post();
    $i = get_json_input();

    $stmt = $mysqli->prepare(
        "INSERT IGNORE INTO wishlist_items (user_id, artwork_id, created_at) VALUES (?,?,NOW())"
    );
    $stmt->bind_param("ii", $i["userId"], $i["artworkId"]);
    $stmt->execute();

    json_ok(["message" => "OK"]);
}

/* =======================
   WISHLIST REMOVE
======================= */
if ($path === "wishlist_remove") {
    require_post();
    $i = get_json_input();

    $stmt = $mysqli->prepare(
        "DELETE FROM wishlist_items WHERE user_id=? AND artwork_id=?"
    );
    $stmt->bind_param("ii", $i["userId"], $i["artworkId"]);
    $stmt->execute();

    json_ok(["message" => "OK"]);
}

/* =======================
   CART SET  ✅ FIXED
======================= */
if ($path === "cart_set") {
    require_post();
    $i = get_json_input();

    $userId = (int) $i["userId"];
    $artworkId = (int) $i["artworkId"];
    $qty = (int) $i["quantity"];

    if ($qty <= 0) {
        $stmt = $mysqli->prepare("DELETE FROM cart_items WHERE user_id=? AND artwork_id=?");
        $stmt->bind_param("ii", $userId, $artworkId);
        $stmt->execute();
        json_ok(["message" => "OK"]);
    }

    $stmt = $mysqli->prepare(
        "UPDATE cart_items SET quantity=? WHERE user_id=? AND artwork_id=?"
    );
    $stmt->bind_param("iii", $qty, $userId, $artworkId);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        $stmt2 = $mysqli->prepare(
            "INSERT INTO cart_items (user_id, artwork_id, quantity, created_at)
             VALUES (?,?,?,NOW())"
        );
        $stmt2->bind_param("iii", $userId, $artworkId, $qty);
        $stmt2->execute();
    }

    json_ok(["message" => "OK"]);
}

/* =======================
   CREATE ORDER (PUBLIC)
   POST /api.php?path=create_order
======================= */
if ($path === "create_order") {
    require_post();
    $i = get_json_input();

    ensure_order_analytics_schema($mysqli);

    $customerName = trim($i["customerName"] ?? "");
    $addressLine = trim($i["address"] ?? "");
    $city = trim($i["city"] ?? "");
    $state = trim($i["state"] ?? "");
    $pincode = trim($i["pincode"] ?? "");
    $email = trim((string) ($i["email"] ?? ""));
    $phone = trim((string) ($i["phone"] ?? ""));
    $items = $i["items"] ?? [];
    $totalAmount = (int) ($i["totalAmount"] ?? 0);
    $paymentMethod = trim((string) ($i["paymentMethod"] ?? ""));

    if ($paymentMethod === "") {
        $paymentMethod = "unknown";
    }

    if (!is_array($items) || count($items) === 0 || $totalAmount <= 0) {
        json_error("Missing or invalid order data");
    }

    // Link to logged-in user if available
    $userId = isset($_SESSION["user_id"]) ? (int) $_SESSION["user_id"] : null;

    // Fallback: if session is missing but email matches an existing user, attach order to that user
    if ($userId === null && $email !== "") {
        $u1 = $mysqli->prepare("SELECT id, name FROM users WHERE email=? LIMIT 1");
        if ($u1) {
            $u1->bind_param("s", $email);
            $u1->execute();
            $r1 = $u1->get_result()->fetch_assoc();
            $u1->close();
            if ($r1 && isset($r1["id"])) {
                $userId = (int) $r1["id"];
                if ($customerName === "") {
                    $customerName = trim((string) ($r1["name"] ?? ""));
                }
            }
        }
    }

    // If customerName not provided, derive from logged-in user or fallback
    if ($customerName === "") {
        if ($userId !== null) {
            $u0 = $mysqli->prepare("SELECT name FROM users WHERE id=?");
            if ($u0) {
                $u0->bind_param("i", $userId);
                $u0->execute();
                $r0 = $u0->get_result()->fetch_assoc();
                $u0->close();
                $customerName = trim((string) ($r0["name"] ?? ""));
            }
        }
        if ($customerName === "") {
            $customerName = $email !== "" ? $email : "Customer";
        }
    }

    // If user is logged in, persist this address as their default (Amazon-like behavior)
    if ($userId !== null) {
        ensure_user_shipping_schema($mysqli);
        if ($phone !== "" && $addressLine !== "" && $city !== "" && $state !== "" && $pincode !== "") {
            $u = $mysqli->prepare(
                "UPDATE users
                 SET shipping_phone=?, shipping_address=?, shipping_city=?, shipping_state=?, shipping_pincode=?
                 WHERE id=?"
            );
            if ($u) {
                $u->bind_param("sssssi", $phone, $addressLine, $city, $state, $pincode, $userId);
                @$u->execute();
                $u->close();
            }
        }
    }

    // Build full shipping address
    $shippingAddress = trim($addressLine . ", " . $city . ", " . $state . " - " . $pincode);

    // Insert into extended orders table with customer_name + shipping_address
    $stmt = $mysqli->prepare(
        "INSERT INTO orders (user_id, customer_name, shipping_address, total_amount, status, payment_method)
         VALUES (?, ?, ?, ?, 'pending', ?)"
    );
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("issis", $userId, $customerName, $shippingAddress, $totalAmount, $paymentMethod);

    if (!$stmt->execute()) {
        $stmt->close();
        json_error("Failed to create order", 500);
    }

    $orderId = (int) $stmt->insert_id;
    $stmt->close();

    // Persist order items for analytics (category + quantity + price)
    $ins = $mysqli->prepare("INSERT INTO order_items (order_id, artwork_id, category, quantity, price) VALUES (?,?,?,?,?)");
    if ($ins) {
        foreach ($items as $it) {
            if (!is_array($it))
                continue;
            $artworkId = (int) ($it["id"] ?? 0);
            $category = trim((string) ($it["category"] ?? ""));
            $qty = (int) ($it["quantity"] ?? 1);
            $price = (int) ($it["price"] ?? 0);
            if ($qty < 1)
                $qty = 1;

            // If category not sent, try to infer from artworks table
            if ($category === "" && $artworkId > 0) {
                $s = $mysqli->prepare("SELECT category FROM artworks WHERE id=?");
                if ($s) {
                    $s->bind_param("i", $artworkId);
                    $s->execute();
                    $r = $s->get_result()->fetch_assoc();
                    $s->close();
                    if ($r && isset($r["category"])) {
                        $category = (string) $r["category"];
                    }
                }
            }

            $ins->bind_param("iisii", $orderId, $artworkId, $category, $qty, $price);
            @$ins->execute();
        }
        $ins->close();
    }

    json_ok([
        "message" => "Order created",
        "order" => [
            "id" => $orderId,
            "customer" => $customerName,
            "artworkTitle" => $items[0]["name"] ?? "Artwork",
            "amount" => $totalAmount,
            "status" => "pending",
        ],
    ]);
}

/* =======================
   DASHBOARD STATS
   GET /api.php?path=stats
======================= */
if ($path === "stats") {
    require_admin();
    ensure_order_analytics_schema($mysqli);

    $createdCol = null;
    if (column_exists($mysqli, "orders", "created_at")) {
        $createdCol = "created_at";
    } elseif (column_exists($mysqli, "orders", "createdAt")) {
        $createdCol = "createdAt";
    }

    $hasPaymentMethod = column_exists($mysqli, "orders", "payment_method");

    // Monthly revenue + orders count (last 12 months)
    $monthly = [];
    $res = null;
    if ($createdCol !== null) {
        $res = $mysqli->query(
            "SELECT DATE_FORMAT({$createdCol}, '%b') AS monthLabel,
                    DATE_FORMAT({$createdCol}, '%Y-%m') AS ym,
                    COUNT(*) AS ordersCount,
                    SUM(CASE WHEN status <> 'cancelled' THEN total_amount ELSE 0 END) AS revenue
             FROM orders
             WHERE {$createdCol} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
             GROUP BY ym
             ORDER BY ym ASC"
        );
    }
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $monthly[] = [
                "month" => (string) ($row["monthLabel"] ?? ""),
                "total" => (int) ($row["revenue"] ?? 0),
                "orders" => (int) ($row["ordersCount"] ?? 0),
            ];
        }
    }

    // Top categories by revenue
    $topCategories = [];
    $res2 = $mysqli->query(
        "SELECT COALESCE(NULLIF(TRIM(oi.category), ''), 'Uncategorized') AS category,
                SUM(oi.quantity * oi.price) AS revenue,
                SUM(oi.quantity) AS qty
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.status <> 'cancelled'
         GROUP BY category
         ORDER BY revenue DESC
         LIMIT 8"
    );
    if ($res2) {
        while ($row = $res2->fetch_assoc()) {
            $topCategories[] = [
                "category" => (string) $row["category"],
                "revenue" => (int) ($row["revenue"] ?? 0),
                "qty" => (int) ($row["qty"] ?? 0),
            ];
        }
    }

    // Payment method split
    $paymentMethods = [];
    $res3 = null;
    if ($hasPaymentMethod) {
        $res3 = $mysqli->query(
            "SELECT COALESCE(NULLIF(TRIM(payment_method), ''), 'unknown') AS method,
                    COUNT(*) AS count
             FROM orders
             GROUP BY method
             ORDER BY count DESC"
        );
    } else {
        // If payment_method doesn't exist in schema, return an empty split
        $res3 = null;
    }
    if ($res3) {
        while ($row = $res3->fetch_assoc()) {
            $paymentMethods[] = [
                "method" => (string) $row["method"],
                "count" => (int) ($row["count"] ?? 0),
            ];
        }
    }

    // Top 5 popular artworks
    $topArtworks = [];
    $res4 = $mysqli->query(
        "SELECT id, title, category, popularity
         FROM artworks
         ORDER BY popularity DESC, id DESC
         LIMIT 5"
    );
    if ($res4) {
        while ($row = $res4->fetch_assoc()) {
            $topArtworks[] = [
                "id" => (int) ($row["id"] ?? 0),
                "title" => (string) ($row["title"] ?? ""),
                "category" => (string) ($row["category"] ?? ""),
                "popularity" => (int) ($row["popularity"] ?? 0),
            ];
        }
    }

    json_ok([
        "monthlySales" => $monthly,
        "topCategories" => $topCategories,
        "paymentMethods" => $paymentMethods,
        "topArtworks" => $topArtworks,
    ]);
}

/* =======================
   SHOP ARTWORKS
======================= */
if ($path === "shop_artworks") {
    $res = $mysqli->query("SELECT * FROM artworks ORDER BY id DESC");
    $items = [];

    while ($r = $res->fetch_assoc()) {
        $items[] = [
            "id" => (string) $r["id"],
            "name" => $r["title"],
            "price" => (float) $r["price"],
            "category" => $r["category"],
            "artist" => $r["artist"],
            "images" => [image_url($r["image"])],
            "inStock" => $r["stock_status"] === "in_stock"
        ];
    }

    json_ok(["items" => $items]);
}

/* =======================
   SHOP ARTWORK (SINGLE)
======================= */
if ($path === "shop_artwork") {
    $id = $_GET["id"] ?? "";

    if ($id === "") {
        json_error("Missing artwork ID", 400);
    }

    $stmt = $mysqli->prepare("SELECT * FROM artworks WHERE id = ?");
    if (!$stmt) {
        json_error("DB error", 500);
    }

    $stmt->bind_param("s", $id);
    $stmt->execute();
    $res = $stmt->get_result();
    $r = $res->fetch_assoc();

    if (!$r) {
        json_error("Artwork not found", 404);
    }

    $item = [
        "id" => (string) $r["id"],
        "name" => $r["title"],
        "price" => (float) $r["price"],
        "category" => $r["category"],
        "artist" => $r["artist"],
        "images" => [image_url($r["image"])],
        "inStock" => $r["stock_status"] === "in_stock",
        "description" => "An expressive abstract painting capturing the dynamic energy of ocean waves. Blues, teals, and white create a powerful yet calming visual experience.",
        "featured" => false,
        "new" => false
    ];

    json_ok(["item" => $item]);
}

/* =======================
   ADMIN ENQUIRIES LIST
   GET /api.php?path=enquiries
======================= */
if ($path === "enquiries") {
    $res = $mysqli->query(
        "SELECT id, first_name, last_name, email, phone, subject, message, created_at
         FROM contact_messages ORDER BY created_at DESC"
    );
    if (!$res)
        json_error("DB error", 500);

    $items = [];
    while ($row = $res->fetch_assoc()) {
        $items[] = [
            "id" => (int) $row["id"],
            "firstName" => $row["first_name"],
            "lastName" => $row["last_name"],
            "email" => $row["email"],
            "phone" => $row["phone"],
            "subject" => $row["subject"],
            "message" => $row["message"],
            "createdAt" => $row["created_at"],
        ];
    }

    json_ok(["items" => $items]);
}

/* =======================
   ADMIN ORDERS LIST
   GET /api.php?path=orders
======================= */
if ($path === "orders") {
    $res = $mysqli->query(
        "SELECT id, user_id, customer_name, shipping_address, total_amount, status, created_at AS createdAt
         FROM orders ORDER BY created_at DESC"
    );
    if (!$res)
        json_error("DB error", 500);

    $items = [];
    while ($row = $res->fetch_assoc()) {
        $id = (int) $row["id"];
        $userId = (int) $row["user_id"];
        $customerName = trim((string) ($row["customer_name"] ?? ""));
        $shippingAddress = trim((string) ($row["shipping_address"] ?? ""));

        $items[] = [
            "id" => $id,
            // Prefer real customer_name; fallback to old generated label
            "customer" => $customerName !== "" ? $customerName : ("Customer #" . ($userId ?: $id)),
            // Use shipping_address to show address in the "Artwork" column; fallback to generic label
            "artworkTitle" => $shippingAddress !== "" ? $shippingAddress : ("Order " . $id),
            "amount" => (int) $row["total_amount"],
            "status" => $row["status"],
            "createdAt" => $row["createdAt"],
        ];
    }

    json_ok(["items" => $items]);
}

/* =======================
   ADMIN ORDER DETAIL (for invoice)
   GET /api.php?path=order_detail&id=123
======================= */
if ($path === "order_detail") {
    require_admin();

    // Ensure analytics tables/columns exist before selecting invoice line-items
    ensure_order_analytics_schema($mysqli);

    $id = (int) ($_GET["id"] ?? 0);
    if ($id <= 0)
        json_error("Missing order id", 400);

    // Handle created_at vs createdAt column naming
    $createdCol = null;
    if (column_exists($mysqli, "orders", "created_at")) {
        $createdCol = "created_at";
    } elseif (column_exists($mysqli, "orders", "createdAt")) {
        $createdCol = "createdAt";
    }

    $hasPayment = column_exists($mysqli, "orders", "payment_method");

    $select = "SELECT id, user_id, customer_name, shipping_address, total_amount, status";
    if ($createdCol !== null)
        $select .= ", {$createdCol} AS createdAt";
    if ($hasPayment)
        $select .= ", payment_method";
    $select .= " FROM orders WHERE id=?";

    $stmt = $mysqli->prepare($select);
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $orderRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$orderRow)
        json_error("Order not found", 404);

    $customerName = trim((string) ($orderRow["customer_name"] ?? ""));
    if ($customerName === "") {
        $customerName = "Customer #" . (int) $orderRow["id"];
    }

    $order = [
        "id" => (int) $orderRow["id"],
        "customer" => $customerName,
        "shippingAddress" => (string) ($orderRow["shipping_address"] ?? ""),
        "amount" => (int) ($orderRow["total_amount"] ?? 0),
        "status" => (string) ($orderRow["status"] ?? ""),
        "createdAt" => (string) ($orderRow["createdAt"] ?? ""),
        "paymentMethod" => $hasPayment ? (string) ($orderRow["payment_method"] ?? "") : "",
    ];

    // Items from order_items; enrich with artwork title if possible (schema-safe)
    $items = [];
    $hasOiCategory = column_exists($mysqli, "order_items", "category");
    $hasOiQty = column_exists($mysqli, "order_items", "quantity");
    $hasOiPrice = column_exists($mysqli, "order_items", "price");

    $catExpr = $hasOiCategory ? "oi.category" : "''";
    $qtyExpr = $hasOiQty ? "oi.quantity" : "1";
    $priceExpr = $hasOiPrice ? "oi.price" : "0";

    $stmt2 = $mysqli->prepare(
        "SELECT oi.id, oi.artwork_id,
                {$catExpr} AS category,
                {$qtyExpr} AS quantity,
                {$priceExpr} AS price,
                a.title AS artworkTitle
         FROM order_items oi
         LEFT JOIN artworks a ON a.id = oi.artwork_id
         WHERE oi.order_id = ?
         ORDER BY oi.id ASC"
    );
    if ($stmt2) {
        $stmt2->bind_param("i", $id);
        $stmt2->execute();
        $res2 = $stmt2->get_result();
        while ($row = $res2->fetch_assoc()) {
            $qty = (int) ($row["quantity"] ?? 1);
            $price = (int) ($row["price"] ?? 0);
            $items[] = [
                "artworkId" => (int) ($row["artwork_id"] ?? 0),
                "title" => (string) ($row["artworkTitle"] ?? ""),
                "category" => (string) ($row["category"] ?? ""),
                "qty" => $qty,
                "price" => $price,
                "lineTotal" => $qty * $price,
            ];
        }
        $stmt2->close();
    }

    // Fallback: if no line-items exist, show a basic single row so invoice isn't blank
    if (count($items) === 0) {
        $amt = (int) ($order["amount"] ?? 0);
        $items[] = [
            "artworkId" => 0,
            "title" => "Artwork purchase",
            "category" => "",
            "qty" => 1,
            "price" => $amt,
            "lineTotal" => $amt,
        ];
    }

    $subTotal = 0;
    foreach ($items as $it) {
        $subTotal += (int) ($it["lineTotal"] ?? 0);
    }
    if ($subTotal <= 0) {
        $subTotal = (int) $order["amount"];
    }

    json_ok([
        "order" => $order,
        "items" => $items,
        "summary" => [
            "subTotal" => (int) $subTotal,
            "grandTotal" => (int) $order["amount"],
        ],
    ]);
}

/* =======================
   ADMIN CUSTOMERS LIST (Derived)
   GET /api.php?path=customers
======================= */
if ($path === "customers") {
    require_admin();

    $res = $mysqli->query(
        "SELECT id, user_id, customer_name, shipping_address, total_amount, status, created_at AS createdAt
         FROM orders
         WHERE status <> 'cancelled'
         ORDER BY created_at DESC"
    );
    if (!$res)
        json_error("DB error", 500);

    $byCustomer = [];
    while ($row = $res->fetch_assoc()) {
        $id = (int) $row["id"];
        $userId = (int) ($row["user_id"] ?? 0);
        $customerName = trim((string) ($row["customer_name"] ?? ""));
        $shippingAddress = trim((string) ($row["shipping_address"] ?? ""));
        $customerLabel = $customerName !== "" ? $customerName : ("Customer #" . $id);

        if (!isset($byCustomer[$customerLabel])) {
            $byCustomer[$customerLabel] = [
                "customer" => $customerLabel,
                "userId" => $userId ?: null,
                "email" => null,
                "phone" => null,
                "lastAddress" => $shippingAddress,
                "lastOrderAt" => (string) ($row["createdAt"] ?? ""),
                "totalOrders" => 0,
                "totalSpent" => 0,
            ];
        }

        $byCustomer[$customerLabel]["totalOrders"] += 1;
        $byCustomer[$customerLabel]["totalSpent"] += (int) ($row["total_amount"] ?? 0);
        if ($shippingAddress !== "" && $byCustomer[$customerLabel]["lastAddress"] === "") {
            $byCustomer[$customerLabel]["lastAddress"] = $shippingAddress;
        }
    }

    // Best-effort enrichment for logged-in users (email)
    $userStmt = $mysqli->prepare("SELECT email FROM users WHERE id=?");
    if ($userStmt) {
        foreach ($byCustomer as $key => $c) {
            if (!empty($c["userId"])) {
                $uid = (int) $c["userId"];
                $userStmt->bind_param("i", $uid);
                if ($userStmt->execute()) {
                    $u = $userStmt->get_result()->fetch_assoc();
                    if ($u && isset($u["email"])) {
                        $byCustomer[$key]["email"] = (string) $u["email"];
                    }
                }
            }
        }
        $userStmt->close();
    }

    $items = array_values($byCustomer);
    usort($items, function ($a, $b) {
        $da = (string) ($a["lastOrderAt"] ?? "");
        $db = (string) ($b["lastOrderAt"] ?? "");
        if ($da === $db)
            return 0;
        return $da < $db ? 1 : -1;
    });

    json_ok(["items" => $items]);
}

/* =======================
   ADMIN CUSTOMER DETAIL (Derived)
   GET /api.php?path=customer_detail&customer=...
======================= */
if ($path === "customer_detail") {
    require_admin();

    $customerParam = (string) ($_GET["customer"] ?? "");
    if ($customerParam === "")
        json_error("Missing customer", 400);

    $res = $mysqli->query(
        "SELECT id, user_id, customer_name, shipping_address, total_amount, status, created_at AS createdAt
         FROM orders
         ORDER BY created_at DESC"
    );
    if (!$res)
        json_error("DB error", 500);

    $customer = null;
    $orders = [];

    while ($row = $res->fetch_assoc()) {
        $id = (int) $row["id"];
        $userId = (int) ($row["user_id"] ?? 0);
        $customerName = trim((string) ($row["customer_name"] ?? ""));
        $shippingAddress = trim((string) ($row["shipping_address"] ?? ""));
        $customerLabel = $customerName !== "" ? $customerName : ("Customer #" . $id);

        if ($customerLabel !== $customerParam)
            continue;

        if ($customer === null) {
            $customer = [
                "customer" => $customerLabel,
                "userId" => $userId ?: null,
                "email" => null,
                "phone" => null,
                "lastAddress" => $shippingAddress,
                "lastOrderAt" => (string) ($row["createdAt"] ?? ""),
                "totalOrders" => 0,
                "totalSpent" => 0,
            ];
        }

        $orders[] = [
            "id" => $id,
            "customer" => $customerLabel,
            "artworkTitle" => $shippingAddress !== "" ? $shippingAddress : ("Order " . $id),
            "amount" => (int) $row["total_amount"],
            "status" => (string) $row["status"],
            "createdAt" => (string) $row["createdAt"],
        ];

        $customer["totalOrders"] += 1;
        if ((string) $row["status"] !== "cancelled") {
            $customer["totalSpent"] += (int) ($row["total_amount"] ?? 0);
        }
    }

    if ($customer === null) {
        json_error("Customer not found", 404);
    }

    // Enrich user email
    if (!empty($customer["userId"])) {
        $uid = (int) $customer["userId"];
        $stmt = $mysqli->prepare("SELECT email FROM users WHERE id=?");
        if ($stmt) {
            $stmt->bind_param("i", $uid);
            if ($stmt->execute()) {
                $u = $stmt->get_result()->fetch_assoc();
                if ($u && isset($u["email"])) {
                    $customer["email"] = (string) $u["email"];
                }
            }
            $stmt->close();
        }
    }

    json_ok(["customer" => $customer, "orders" => $orders]);
}

/* =======================
   ADMIN ARTWORKS LIST
======================= */
if ($path === "artworks") {
    // Return raw artworks for admin panel
    $res = $mysqli->query(
        "SELECT id, title, image AS imageUrl, price, category, artist, stock_status AS stockStatus, popularity
         FROM artworks ORDER BY id DESC"
    );
    if (!$res) {
        json_error("DB error", 500);
    }

    $items = [];
    while ($row = $res->fetch_assoc()) {
        // cast numeric fields
        $row["id"] = (int) $row["id"];
        $row["price"] = (float) $row["price"];
        $row["popularity"] = (int) ($row["popularity"] ?? 0);
        $items[] = $row;
    }

    json_ok(["items" => $items]);
}

/* =======================
   ADMIN ARTWORK SAVE
   POST multipart/form-data ?path=artwork_save
======================= */
if ($path === "artwork_save") {
    require_post();

    $id = (int) ($_POST["id"] ?? 0);
    $title = trim((string) ($_POST["title"] ?? ""));
    $price = (float) ($_POST["price"] ?? 0);
    $category = trim((string) ($_POST["category"] ?? ""));
    $artist = trim((string) ($_POST["artist"] ?? ""));
    $stockStatus = trim((string) ($_POST["stockStatus"] ?? "in_stock"));
    $popularity = (int) ($_POST["popularity"] ?? 0);

    if ($title === "") {
        json_error("Title is required");
    }

    $allowedStock = ["in_stock", "low_stock", "sold_out"];
    if (!in_array($stockStatus, $allowedStock, true)) {
        json_error("Invalid stock status");
    }

    $imagePath = null;
    $hasFile = isset($_FILES["image"]) && is_array($_FILES["image"]) &&
        (($_FILES["image"]["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE);

    if ($hasFile) {
        if (($_FILES["image"]["error"] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            json_error("Image upload failed", 400);
        }

        $tmp = $_FILES["image"]["tmp_name"];
        $original = (string) ($_FILES["image"]["name"] ?? "");
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
        $allowedExt = ["jpg", "jpeg", "png", "webp", "gif"];
        if (!in_array($ext, $allowedExt, true)) {
            json_error("Unsupported image type");
        }

        $uploadDir = __DIR__ . "/uploads/artworks";
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }
        if (!is_dir($uploadDir)) {
            json_error("Upload directory not writable", 500);
        }

        $filename = "artwork_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $ext;
        $dest = $uploadDir . "/" . $filename;
        if (!move_uploaded_file($tmp, $dest)) {
            json_error("Failed to save uploaded file", 500);
        }

        $imagePath = "uploads/artworks/" . $filename;
    }

    if ($id > 0) {
        // Update existing
        if ($imagePath !== null) {
            $stmt = $mysqli->prepare(
                "UPDATE artworks
                 SET title=?, price=?, popularity=?, category=?, artist=?, image=?, stock_status=?
                 WHERE id=?"
            );
            if (!$stmt)
                json_error("DB error", 500);
            $stmt->bind_param("sdissssi", $title, $price, $popularity, $category, $artist, $imagePath, $stockStatus, $id);
        } else {
            $stmt = $mysqli->prepare(
                "UPDATE artworks
                 SET title=?, price=?, popularity=?, category=?, artist=?, stock_status=?
                 WHERE id=?"
            );
            if (!$stmt)
                json_error("DB error", 500);
            $stmt->bind_param("sdisssi", $title, $price, $popularity, $category, $artist, $stockStatus, $id);
        }

        if (!$stmt->execute()) {
            $stmt->close();
            json_error("Failed to save artwork", 500);
        }
        $stmt->close();
        json_ok(["message" => "Saved", "id" => $id]);
    } else {
        $stmt = $mysqli->prepare(
            "INSERT INTO artworks (title, price, popularity, category, artist, image, stock_status)
             VALUES (?,?,?,?,?,?,?)"
        );
        if (!$stmt)
            json_error("DB error", 500);

        $stmt->bind_param("sdissss", $title, $price, $popularity, $category, $artist, $imagePath, $stockStatus);
        if (!$stmt->execute()) {
            $stmt->close();
            json_error("Failed to create artwork", 500);
        }
        $newId = (int) $stmt->insert_id;
        $stmt->close();

        json_ok(["message" => "Created", "id" => $newId]);
    }
}

/* =======================
   ADMIN ARTWORK DELETE
   POST JSON {id}
======================= */
if ($path === "artwork_delete") {
    require_post();
    $input = get_json_input();
    $id = (int) ($input["id"] ?? 0);
    if ($id <= 0) {
        json_error("Missing id", 400);
    }

    $stmt = $mysqli->prepare("DELETE FROM artworks WHERE id = ?");
    if (!$stmt)
        json_error("DB error", 500);
    $stmt->bind_param("i", $id);
    if (!$stmt->execute()) {
        $stmt->close();
        json_error("Failed to delete artwork", 500);
    }
    $stmt->close();

    json_ok(["message" => "Deleted", "id" => $id]);
}

/* =======================
   DEFAULT
======================= */
json_ok(["message" => "API running"]);

