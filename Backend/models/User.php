<?php
class User
{
    private $conn;
    private $table_name = "users";

    // User Properties
    public $id;
    public $user_id;
    public $email;
    public $password;
    public $role;

    // Hierarchical Properties (User Tree)
    public $name;
    public $referral_code;
    public $sponsor_id;
    public $sponsor_code; // Input only
    public $profile_image;
    public $cover_image;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function create()
    {
        try {
            $this->conn->beginTransaction();

            // 1. Insert into Users (Auth)
            $query = "INSERT INTO " . $this->table_name . " (user_id, email, password, role) VALUES (:user_id, :email, :password, :role)";
            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(":user_id", $this->user_id);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":password", $this->password);
            $stmt->bindParam(":role", $this->role);

            if (!$stmt->execute()) {
                throw new Exception("Auth creation failed");
            }
            $this->id = $this->conn->lastInsertId();

            // 2. Insert into Specific Hierarchy based on Role
            if ($this->role == 'user') {
                $h_query = "INSERT INTO hierarchical_users (user_identity_id, name, referral_code, sponsor_id) VALUES (:uid, :name, :ref_code, :spon_id)";
                $h_stmt = $this->conn->prepare($h_query);
                $h_stmt->bindParam(":uid", $this->id);
                $h_stmt->bindParam(":name", $this->name);
                $h_stmt->bindParam(":ref_code", $this->referral_code);

                // Resolve Sponsor ID from Code if exists
                $actual_sponsor_id = null;
                if (!empty($this->sponsor_code)) {
                    $gid = $this->getUserIdByReferralCode($this->sponsor_code);
                    if ($gid) {
                        // We need the ID from hierarchical_users table for the parent link? 
                        // The schema says sponsor_id references hierarchical_users(id).
                        // So we need that ID.
                        $actual_sponsor_id = $gid;
                    }
                }
                $h_stmt->bindParam(":spon_id", $actual_sponsor_id);

                if (!$h_stmt->execute()) {
                    throw new Exception("Hierarchy creation failed");
                }

                // Create Wallet
                $w_query = "INSERT INTO wallets (user_identity_id) VALUES (:uid)";
                $w_stmt = $this->conn->prepare($w_query);
                $w_stmt->bindParam(":uid", $this->id);
                $w_stmt->execute();
            }

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    public function emailExists()
    {
        // Only checks auth table
        $query = "SELECT id, user_id, password, role FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->user_id = $row['user_id'];
            $this->password = $row['password'];
            $this->role = $row['role'];

            // Fetch detail from hierarchy based on role
            // Fetch detail from hierarchy based on role
            if ($this->role == 'user') {
                $q2 = "SELECT name, referral_code, user_identity_id, profile_image, cover_image FROM hierarchical_users WHERE user_identity_id = ?";
                $s2 = $this->conn->prepare($q2);
                $s2->bindParam(1, $this->id);
                $s2->execute();
                if ($r2 = $s2->fetch(PDO::FETCH_ASSOC)) {
                    $this->name = $r2['name'];
                    $this->referral_code = $r2['referral_code'];
                    $this->user_id = $r2['user_identity_id'];
                    $this->profile_image = $r2['profile_image'];
                    $this->cover_image = $r2['cover_image'];
                }
            } elseif ($this->role == 'franchise') {
                // Fetch franchise details
                $q2 = "SELECT franchise_name, franchise_code FROM hierarchical_franchise WHERE user_identity_id = ?";
                $s2 = $this->conn->prepare($q2);
                $s2->bindParam(1, $this->id);
                $s2->execute();
                if ($r2 = $s2->fetch(PDO::FETCH_ASSOC)) {
                    $this->name = $r2['franchise_name'];
                    $this->referral_code = $r2['franchise_code'];
                }
            } elseif ($this->role == 'admin') {
                // Admin uses user_id as name and ID
                $this->name = $this->user_id ?: 'Admin';
                $this->referral_code = $this->user_id ?: 'ADMIN';
            }
            return true;
        }
        return false;
    }

    public function getUserIdByReferralCode($code)
    {
        $query = "SELECT id FROM hierarchical_users WHERE referral_code = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $code);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['id'];
        }
        return null;
    }

    public function generateUserId()
    {
        return 'USR-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
    }

    public function generateReferralCode()
    {
        return strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
    }
}
?>