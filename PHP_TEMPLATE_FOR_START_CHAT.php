<?php
// PHP Template for "Start Chat" Button
// Use this in your astrologer listing page

// Assume user is logged in and session data is available
session_start();

// Get user data from session (set these after login_api.php success)
$userToken = $_SESSION['api_token'] ?? '';
$userSno = $_SESSION['user_sno'] ?? '';
$userRole = $_SESSION['role'] ?? '';

// Your astrologer data (from database query)
$astrologers = [
    ['sno' => 55, 'name' => 'Gagandeep Goyal', 'email' => 'gagandeepgoyal36@gmail.com'],
    // Add more astrologers from your database
];

// Next.js chat app URL (change this to your deployed URL)
$chatAppUrl = 'http://localhost:3000'; // or your production URL

?>

<!DOCTYPE html>
<html>
<head>
    <title>Astrologer List</title>
    <style>
        .astrologer-card {
            border: 1px solid #ddd;
            padding: 20px;
            margin: 10px;
            border-radius: 8px;
            display: inline-block;
            width: 300px;
        }
        .btn {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
        }
        .btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <h1>Available Astrologers</h1>
    
    <?php if (empty($userToken)): ?>
        <p>Please login first to start chatting.</p>
        <a href="login.php">Login</a>
    <?php else: ?>
        
        <?php foreach ($astrologers as $astro): ?>
            <div class="astrologer-card">
                <h3><?= htmlspecialchars($astro['name']) ?></h3>
                <p>Email: <?= htmlspecialchars($astro['email']) ?></p>
                
                <?php
                // Generate chat URL with all required parameters
                $chatUrl = $chatAppUrl . '/chatbox' 
                    . '?uniqueId=' . urlencode($userToken)
                    . '&userId=' . urlencode($userSno)
                    . '&astrologerId=' . urlencode($astro['sno'])
                    . '&name=' . urlencode($astro['name']);
                ?>
                
                <a href="<?= $chatUrl ?>" class="btn" target="_blank">
                    Start Chat with <?= htmlspecialchars($astro['name']) ?>
                </a>
                
                <!-- Debug info (remove in production) -->
                <details style="margin-top: 10px; font-size: 12px;">
                    <summary>Debug URL</summary>
                    <code><?= htmlspecialchars($chatUrl) ?></code>
                </details>
            </div>
        <?php endforeach; ?>
        
    <?php endif; ?>
    
    <hr>
    <h3>Session Debug Info:</h3>
    <pre><?= print_r($_SESSION, true) ?></pre>
</body>
</html>

<?php
// After successful login in login_api.php, set these session variables:
/*
session_start();
$_SESSION['api_token'] = $token;  // from login_api.php response
$_SESSION['user_sno'] = $row['sno'];  // user's sno from database
$_SESSION['role'] = $role;  // 'user' or 'astrologer'
$_SESSION['email'] = $email;
*/
?>
