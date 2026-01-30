<?php
// This custom upload script is aligned with api.php's artwork_save logic
// so that new artworks appear correctly in both the admin panel and shop.

include '../config.php'; // provides $mysqli

// Basic input values from a simple form
$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$price = isset($_POST['price']) ? (float)$_POST['price'] : 0;
$desc  = isset($_POST['description']) ? trim($_POST['description']) : '';

// Optional fields with sensible defaults
$category   = isset($_POST['category']) ? trim($_POST['category']) : '';
$artist     = isset($_POST['artist']) ? trim($_POST['artist']) : 'Admin';
$stockStatus = 'in_stock';
$popularity = 0;

if ($title === '') {
  http_response_code(400);
  echo json_encode(["error" => "Title is required"]);
  exit;
}

// Handle image upload similar to artwork_save in api.php
if (!isset($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
  http_response_code(400);
  echo json_encode(["error" => "Image is required"]);
  exit;
}

if (($_FILES['image']['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(["error" => "Image upload failed", "code" => $_FILES['image']['error']]);
  exit;
}

$tmp      = $_FILES['image']['tmp_name'];
$original = (string)($_FILES['image']['name'] ?? '');
$ext      = strtolower(pathinfo($original, PATHINFO_EXTENSION));
$allowed  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

if (!in_array($ext, $allowed, true)) {
  http_response_code(400);
  echo json_encode(["error" => "Unsupported image type"]);
  exit;
}

$uploadDir = __DIR__ . '/../uploads/artworks';
if (!is_dir($uploadDir)) {
  @mkdir($uploadDir, 0777, true);
}
if (!is_dir($uploadDir)) {
  http_response_code(500);
  echo json_encode(["error" => "Upload directory not writable"]);
  exit;
}

$filename = 'artwork_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$dest     = $uploadDir . '/' . $filename;

if (!move_uploaded_file($tmp, $dest)) {
  http_response_code(500);
  echo json_encode(["error" => "Failed to save uploaded file"]);
  exit;
}

// This relative path matches what api.php expects in image column
$imageUrl = 'uploads/artworks/' . $filename;

$stmt = $mysqli->prepare(
  "INSERT INTO artworks (title, price, popularity, category, artist, image, stock_status) VALUES (?, ?, ?, ?, ?, ?, ?)"
);

if (!$stmt) {
  http_response_code(500);
  echo json_encode(["error" => "Database error", "details" => $mysqli->error]);
  exit;
}

$stmt->bind_param('sdissss', $title, $price, $popularity, $category, $artist, $imageUrl, $stockStatus);

if (!$stmt->execute()) {
  $err = $stmt->error;
  $stmt->close();
  http_response_code(500);
  echo json_encode(["error" => "Failed to save artwork", "details" => $err]);
  exit;
}

$newId = (int)$stmt->insert_id;
$stmt->close();

echo json_encode(["success" => true, "id" => $newId, "image_url" => $imageUrl]);
