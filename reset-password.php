<?php
// Simple password reset page: http://localhost/art-e-commerce-website/reset-password.php?token=...

require_once __DIR__ . '/art-admin-backend/config.php';

$token = isset($_GET['token']) ? trim($_GET['token']) : '';
$message = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = isset($_POST['token']) ? trim($_POST['token']) : '';
    $password = isset($_POST['password']) ? (string)$_POST['password'] : '';
    $confirm = isset($_POST['password_confirm']) ? (string)$_POST['password_confirm'] : '';

    if ($token === '' || $password === '' || $confirm === '') {
        $message = 'All fields are required.';
    } elseif ($password !== $confirm) {
        $message = 'Passwords do not match.';
    } elseif (strlen($password) < 6) {
        $message = 'Password must be at least 6 characters.';
    } else {
        // Find valid reset token (not expired)
        $stmt = $mysqli->prepare(
            'SELECT pr.id, pr.user_id FROM password_resets pr WHERE pr.token = ? AND pr.expires_at > NOW() LIMIT 1'
        );
        if ($stmt) {
            $stmt->bind_param('s', $token);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res ? $res->fetch_assoc() : null;
            $stmt->close();

            if ($row) {
                $userId = (int)$row['user_id'];
                $hash = password_hash($password, PASSWORD_BCRYPT);
                if ($hash === false) {
                    $message = 'Failed to hash password.';
                } else {
                    // Update user password
                    $stmt2 = $mysqli->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
                    if ($stmt2) {
                        $stmt2->bind_param('si', $hash, $userId);
                        if ($stmt2->execute()) {
                            $success = true;
                            $message = 'Your password has been reset. You can now log in with your new password.';
                        } else {
                            $message = 'Failed to update password.';
                        }
                        $stmt2->close();
                    } else {
                        $message = 'Database error.';
                    }

                    // Delete this reset token
                    $del = $mysqli->prepare('DELETE FROM password_resets WHERE id = ?');
                    if ($del) {
                        $del->bind_param('i', $row['id']);
                        $del->execute();
                        $del->close();
                    }
                }
            } else {
                $message = 'This reset link is invalid or has expired.';
            }
        } else {
            $message = 'Database error.';
        }
    }
}

?><!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Reset Password</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; margin:0; padding:40px; display:flex; justify-content:center; }
      .card { background:#fff; max-width:420px; width:100%; padding:24px 28px; border-radius:12px; box-shadow:0 10px 30px rgba(15,23,42,0.12); }
      h1 { margin-top:0; font-size:22px; margin-bottom:12px; }
      label { display:block; font-size:13px; margin-bottom:4px; color:#374151; }
      input { width:100%; padding:8px 10px; border-radius:6px; border:1px solid #d1d5db; font-size:14px; }
      input:focus { outline:none; border-color:#f59e0b; box-shadow:0 0 0 1px #f59e0b33; }
      .field { margin-bottom:14px; }
      .btn { display:inline-block; width:100%; padding:10px 12px; border-radius:999px; border:none; background:#b45309; color:white; font-size:14px; cursor:pointer; }
      .btn:disabled { opacity:0.7; cursor:default; }
      .msg { margin-bottom:12px; font-size:13px; }
      .msg.error { color:#b91c1c; }
      .msg.success { color:#166534; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Reset your password</h1>
      <p style="font-size:13px; color:#4b5563; margin-bottom:16px;">Enter a new password for your account.</p>

      <?php if ($message !== ''): ?>
        <div class="msg <?php echo $success ? 'success' : 'error'; ?>"><?php echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></div>
      <?php endif; ?>

      <?php if (!$success): ?>
        <form method="post">
          <input type="hidden" name="token" value="<?php echo htmlspecialchars($token, ENT_QUOTES, 'UTF-8'); ?>" />
          <div class="field">
            <label for="password">New password</label>
            <input type="password" id="password" name="password" required minlength="6" />
          </div>
          <div class="field">
            <label for="password_confirm">Confirm password</label>
            <input type="password" id="password_confirm" name="password_confirm" required minlength="6" />
          </div>
          <button type="submit" class="btn">Set new password</button>
        </form>
      <?php endif; ?>
    </div>
  </body>
</html>