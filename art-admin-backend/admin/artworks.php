<?php
include '../config.php';
$res = $conn->query("SELECT * FROM artworks ORDER BY id DESC");
$data = [];
while($row = $res->fetch_assoc()){
  $data[] = $row;
}
echo json_encode($data);
