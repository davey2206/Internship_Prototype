<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Content-Type: application/json');

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

// Include necessary files
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);

header('Content-Type: application/json');

$response = [
    'exists' => false,
    'points' => 0,
    'message' => '',
    'timestamp' => time() // Add timestamp for debugging
];

if (isset($_GET['uid'])) {
    $uid = htmlspecialchars($_GET['uid'], ENT_QUOTES, 'UTF-8');
    
    // Log the request for debugging
    error_log("Checking if Kukudushi exists: UID=" . $uid);
    
    // Get Kukudushi manager
    $kukudushi_manager = Kukudushi_Manager::Instance();
    $kukudushi = $kukudushi_manager->get_kukudushi($uid);
    
    // More detailed logging
    error_log("get_kukudushi result: " . ($kukudushi ? "Object returned" : "Null"));
    if ($kukudushi) {
        error_log("Kukudushi exists property: " . ($kukudushi->exists ? "True" : "False"));
    }
    
    if ($kukudushi && $kukudushi->exists) {
        $response['exists'] = true;
        $response['points'] = $kukudushi->points ?? 0;
        $response['message'] = 'Kukudushi found in database';
        error_log("Kukudushi found in database: UID=" . $uid);
    } else {
        $response['message'] = 'Kukudushi not found in database';
        error_log("Kukudushi NOT found in database: UID=" . $uid);
    }
} else {
    $response['message'] = 'No UID provided';
    error_log("check_kukudushi_exists.php called without UID parameter");
}

echo json_encode($response);