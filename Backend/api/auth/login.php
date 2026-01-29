<?php
include_once '../../config/database.php';
include_once '../../models/User.php';
include_once '../../utils/cors.php';
include_once '../../utils/jwt.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$user = new User($db);
$jwtHandler = new JWTHandler();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $user->email = $data->email; // in older frontend it might be 'username' but usually email
    // Check if frontend sends username or email
    // If username, we need to adapt. Assuming email for now.

    if ($user->emailExists()) {
        if ($data->password === $user->password) {
            $token_payload = array(
                "iss" => "http://localhost/mlm",
                "aud" => "http://localhost/mlm",
                "iat" => time(),
                "nbf" => time(),
                "exp" => time() + 86400,
                "data" => array(
                    "id" => $user->id,
                    "name" => $user->name,
                    "email" => $user->email,
                    "role" => $user->role
                )
            );

            $jwt = $jwtHandler->generate($token_payload);

            http_response_code(200);
            echo json_encode(
                array(
                    "success" => true,
                    "message" => "Login successful.",
                    "data" => array(
                        "token" => $jwt,
                        "user" => array(
                            "id" => $user->id,
                            "user_id" => $user->user_id, // Added this field
                            "name" => $user->name,
                            "email" => $user->email,
                            "role" => $user->role,
                            "referral_code" => $user->referral_code,
                            "profile_image" => $user->profile_image,
                            "cover_image" => $user->cover_image
                        )
                    )
                )
            );
        } else {
            http_response_code(401);
            echo json_encode(array("success" => false, "message" => "Invalid password."));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("success" => false, "message" => "User not found."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete login data."));
}
?>