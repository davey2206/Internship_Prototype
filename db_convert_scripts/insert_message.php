<?php
require_once(dirname(__FILE__, 2) . "/kukudushi_settings.php");

$settings = Settings_Manager::Instance();
$user_manager = User_Manager::Instance();
[$setUserGuid_js, $user] = $user_manager->get_current_user();
$current_user = $user;

// Check if admin
if (!$current_user->is_admin())
{
    echo '<script>alert("Please login as an administrator!")</script>';
    sleep(2);
    echo '<script type="text/javascript">window.location.href="' . $settings->_kukudushi_base_url . '";</script>';
    exit;
}

// Prepare the data for the update
$data = [
    'message' => '<b>🌟 Big News: Our New Webshop is Live! 🌟</b>

As a thank you for your loyalty, enjoy an exclusive <b>15% OFF</b> your next purchase with us. Use <b>WECARE2024</b> at checkout. 🛒

Discover more unique finds and favorites now! But hurry, it\'s a limited-time treat ➡️ <a href="https://kukudushi.com/shop-pro/" target="_blank">Shop & Save</a>

<b>Don\'t Miss Out!</b>'
];

$where = ['id' => 1642]; // Assuming you can only update one ID at a time with your class, or adjust accordingly

// Use the DataBase class to update the database
$result = DataBase::updateWithRaw('wp_kukudushi_notifications', $data, $where);

if ($result) 
{
    echo "Done";
} 
else 
{
    echo "Update failed";
}

?>
