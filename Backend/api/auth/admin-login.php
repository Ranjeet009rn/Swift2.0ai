<?php
include_once '../../config/database.php';
include_once '../../models/Admin.php';
include_once '../../utils/cors.php';
include_once '../../utils/jwt.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$admin = new Admin($db);
$jwtHandler = new JWTHandler();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $admin->email = $data->email;

    if ($admin->emailExists()) {
        if ($data->password === $admin->password) {
            $token_payload = array(
                "iss" => "http://localhost/mlm",
                "aud" => "http://localhost/mlm",
                "iat" => time(),
                "nbf" => time(),
                "exp" => time() + 86400, // 24 hours
                "data" => array(
                    "id" => $admin->id,
                    "username" => $admin->username,
                    "email" => $admin->email,
                    "role" => $admin->role
                )
            );

            $jwt = $jwtHandler->generate($token_payload);

            http_response_code(200);
            echo json_encode(
                array(
                    "message" => "Admin login successful.",
                    "token" => $jwt,
                    "user" => array(
                        "id" => $admin->id,
                        "username" => $admin->username,
                        "email" => $admin->email,
                        "role" => $admin->role
                    )
                )
            );
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Login failed. Wrong password."));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Login failed. Admin not found."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Data is incomplete."));
}
?>