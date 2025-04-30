<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_scan);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_points);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_notification);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_kukudushi_main_type);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_kukudushi_type);

header('Content-Type: application/json');

// Suppress any potential errors or warnings
error_reporting(0);
ini_set('display_errors', 0);

$settings = Settings_Manager::Instance();
$kukudushi_manager = Kukudushi_Manager::Instance();

$kukudushi = null;
$query_vars = "";
$logger = new Logger();

if (isset($_GET['dashboard'])) {
    $query_vars .= "&dashboard";
    if (!empty($_GET['payment_status'])) {
        $sanitized_payment_status = htmlspecialchars($_GET['payment_status'], ENT_QUOTES, 'UTF-8');
        $query_vars .= "&payment_status=" . urlencode($sanitized_payment_status);
    }		
} else if (isset($_GET['meta_id']) && !empty($_GET['meta_id'])) {
    $sanitized_meta_id = htmlspecialchars($_GET['meta_id'], ENT_QUOTES, 'UTF-8');
    $query_vars .= "&meta_id=" . urlencode($sanitized_meta_id);
}

// Get Kukudushi from uid
if (!empty($_GET['uid'])) {
    $kukudushi_id = htmlspecialchars($_GET['uid'], ENT_QUOTES, 'UTF-8');
    $kukudushi = $kukudushi_manager->get_kukudushi($kukudushi_id);
} else if (!empty($_GET['id'])) {
    $kukudushi_id = htmlspecialchars($_GET['id'], ENT_QUOTES, 'UTF-8');
    $kukudushi = $kukudushi_manager->get_kukudushi($kukudushi_id);
}

// Check if $kukudushi is an instance of Kukudushi and not null
if ($kukudushi && $kukudushi instanceof Kukudushi) {
    $kukudushi->exists = true; // Example of setting a custom property
}

$data = [
    'kukudushi' => $kukudushi,
    'set_user_guid_js' => $kukudushi_manager->scan_manager->user_manager->setUserGuid_js,
    'query_vars' => $query_vars
];

// Debugging: Check if the data is properly formatted
error_log(json_encode($data));

echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
?>
