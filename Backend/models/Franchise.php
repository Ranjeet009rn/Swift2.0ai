<?php
class Franchise
{
    private $conn;
    private $table_name = "hierarchical_franchise";

    public $id;
    public $user_identity_id;
    public $franchise_name;
    public $franchise_code;
    public $franchise_type;
    public $stock_value;
    public $wallet_balance;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function getDetails($userId)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_identity_id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>