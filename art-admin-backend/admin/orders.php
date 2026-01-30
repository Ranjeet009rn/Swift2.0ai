<?php
include '../config.php';

if ($_GET['action'] === 'list') {
  $res = $conn->query("
    SELECT orders.*, users.name 
    FROM orders 
    JOIN users ON users.id = orders.user_id
  ");
  echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

if ($_POST['action'] === 'status') {
  $id = $_POST['id'];
  $status = $_POST['status'];
  $conn->query("UPDATE orders SET status='$status' WHERE id=$id");
}
