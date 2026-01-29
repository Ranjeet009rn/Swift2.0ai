<?php
include_once __DIR__ . '/jwt.php';

function validateAuth($db)
{
    $jwtHandler = new JWTHandler();

    // Get headers
    $headers = null;
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    } else {
        $headers = $_SERVER;
    }

    // Try different casing for Authorization header
    $authHeader = '';
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    $arr = explode(" ", $authHeader);
    $jwt = $arr[1] ?? '';

    // FALLBACK: If header failed, check URL parameters (fix for WAMP/Localhost)
    if (empty($jwt) && isset($_GET['token'])) {
        $jwt = $_GET['token'];
    }

    if (!$jwt) {
        http_response_code(401);
        echo json_encode(array("message" => "Access denied. No token provided."));
        exit();
    }

    $decoded = $jwtHandler->validate($jwt);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(array("message" => "Access denied. Invalid token."));
        exit();
    }

    return $decoded->data;
}
?>