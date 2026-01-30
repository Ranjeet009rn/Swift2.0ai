<?php
require './vendor/phpmailer/phpmailer/src/PHPMailer.php';
require './vendor/phpmailer/phpmailer/src/SMTP.php';
require './vendor/phpmailer/phpmailer/src/Exception.php';
include 'db.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';

if (empty($email)) {
    echo json_encode(["success" => false, "message" => "Email is required."]);
    exit;
}

// Generate token
$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

// Save token to DB
$stmt = $conn->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE token = ?, expires_at = ?");
$stmt->bind_param("sssss", $email, $token, $expires, $token, $expires);
$stmt->execute();

// Email link
$resetLink = $resetLink = "http://localhost:3000/reset-password?token=$token";


// Send mail
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.hostinger.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'support@saisamarthgardening.in';
    $mail->Password = 'Ranjeet@1810';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;

    $mail->setFrom('support@saisamarthgardening.in', 'Sai Samarth Gardening');
    $mail->addAddress($email);

    $mail->isHTML(true);
    $mail->Subject = 'Reset Your Password';
    $mail->Body = "
        <h3>Reset Your Password</h3>
        <p>Click the link below to reset your password:</p>
        <a href='$resetLink'>$resetLink</a>
        <p>This link is valid for 1 hour.</p>
    ";

    $mail->send();
    echo json_encode(["success" => true, "message" => "Reset link sent to your email."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Mail failed: {$mail->ErrorInfo}"]);
}
