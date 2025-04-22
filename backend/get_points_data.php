<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_points);

header('Content-Type: application/json');

$logger = new Logger();
$kukudushi = null;
$settings = Settings_Manager::Instance();
$kukudushi_manager = Kukudushi_Manager::Instance();
$points_manager = Points_Manager::Instance();

// Get Kukudushi from uid or id
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

$points_data = $points_manager->getAllPointsData($kukudushi);

$data = [
    'points_data' => $points_data,
];

// Debugging: Check if the data is properly formatted
error_log(json_encode($data));

echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);