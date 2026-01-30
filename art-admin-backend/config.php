<?php
 // MySQL connection (WAMP default)
 // Update these values to match your phpMyAdmin / MySQL setup.
 $DB_HOST = "localhost";
 $DB_USER = "root";
 $DB_PASS = "";
 $DB_NAME = "art_ecommerce";
 
 $mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
 if ($mysqli->connect_errno) {
     http_response_code(500);
     echo json_encode(["error" => "Database connection failed", "details" => $mysqli->connect_error]);
     exit;
 }
 
 $mysqli->set_charset("utf8mb4");
 ?>
