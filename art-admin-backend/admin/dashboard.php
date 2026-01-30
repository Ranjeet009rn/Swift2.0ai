<?php
include '../config.php';

$revenue = $conn->query("
  SELECT SUM(total_amount) as total 
  FROM orders WHERE status='delivered'
")->fetch_assoc();

$monthly = $conn->query("
  SELECT MONTH(created_at) m, SUM(total_amount) t 
  FROM orders GROUP BY m
");

$chart = [];
while($r = $monthly->fetch_assoc()){
  $chart[] = $r;
}

echo json_encode([
  "revenue" => $revenue['total'] ?? 0,
  "chart" => $chart
]);
