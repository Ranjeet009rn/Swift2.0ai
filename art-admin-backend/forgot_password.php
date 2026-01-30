<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - Poorva's Art</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 450px;
            width: 100%;
            animation: slideUp 0.5s ease;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
            text-align: center;
        }

        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
            line-height: 1.5;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }

        input[type="email"] {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.3s ease;
            outline: none;
        }

        input[type="email"]:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .btn:active {
            transform: translateY(0);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .message {
            padding: 14px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
        }

        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }

        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }

        .reset-link-box {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
            display: none;
        }

        .reset-link-box.show {
            display: block;
        }

        .reset-link-box h3 {
            color: #667eea;
            font-size: 16px;
            margin-bottom: 10px;
        }

        .reset-link-box p {
            color: #666;
            font-size: 13px;
            margin-bottom: 10px;
        }

        .reset-link {
            background: white;
            padding: 12px;
            border-radius: 6px;
            word-break: break-all;
            font-size: 13px;
            color: #667eea;
            border: 1px solid #e0e0e0;
            margin-bottom: 10px;
        }

        .copy-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .copy-btn:hover {
            background: #5568d3;
        }

        .back-link {
            text-align: center;
            margin-top: 20px;
        }

        .back-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .back-link a:hover {
            color: #764ba2;
            text-decoration: underline;
        }

        .icon {
            text-align: center;
            font-size: 48px;
            margin-bottom: 20px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="icon">🔐</div>
        <h1>Forgot Password?</h1>
        <p class="subtitle">No worries! Enter your email address and we'll send you a link to reset your password.</p>

        <div id="messageBox" class="message"></div>

        <form id="forgotPasswordForm">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" placeholder="Enter your registered email" required>
            </div>

            <button type="submit" class="btn" id="submitBtn">Send Reset Link</button>
        </form>

        <div id="resetLinkBox" class="reset-link-box">
            <h3>✅ Reset Link Generated!</h3>
            <p>Copy the link below and paste it in your browser:</p>
            <div class="reset-link" id="resetLinkText"></div>
            <button class="copy-btn" onclick="copyResetLink()">📋 Copy Link</button>
            <p style="margin-top: 10px; color: #dc3545; font-weight: 600;">⏰ Link expires in 30 minutes</p>
        </div>

        <div class="back-link">
            <a href="http://localhost:3000/login">← Back to Login</a>
        </div>
    </div>

    <script>
        const form = document.getElementById('forgotPasswordForm');
        const messageBox = document.getElementById('messageBox');
        const submitBtn = document.getElementById('submitBtn');
        const resetLinkBox = document.getElementById('resetLinkBox');
        const resetLinkText = document.getElementById('resetLinkText');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();

            if (!email) {
                showMessage('Please enter your email address', 'error');
                return;
            }

            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            messageBox.style.display = 'none';
            resetLinkBox.classList.remove('show');

            try {
                const response = await fetch('http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=forgot_password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(data.message, 'success');

                    // Show reset link (for development)
                    if (data.resetLink) {
                        resetLinkText.textContent = data.resetLink;
                        resetLinkBox.classList.add('show');
                    }

                    // Clear form
                    form.reset();
                } else {
                    showMessage(data.error || 'Failed to send reset link', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
                console.error('Error:', error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Reset Link';
            }
        });

        function showMessage(message, type) {
            messageBox.textContent = message;
            messageBox.className = 'message ' + type;
        }

        function copyResetLink() {
            const link = resetLinkText.textContent;
            navigator.clipboard.writeText(link).then(() => {
                alert('✅ Link copied to clipboard!');
            }).catch(() => {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = link;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('✅ Link copied to clipboard!');
            });
        }
    </script>
</body>

</html>