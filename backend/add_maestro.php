<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

header('Content-Type: application/json');

// Get JSON data from request
$input = json_decode(file_get_contents('php://input'), true);
$response = ['success' => false, 'message' => ''];

if (!isset($input['name']) || empty($input['name'])) {
    $response['message'] = 'Maestro name is required';
    echo json_encode($response);
    exit;
}

$name = $input['name'];

// Insert new maestro
$result = DataBase::insert('wp_kukudushi_maestros', [
    'name' => $name
]);

if ($result) {
    $response['success'] = true;
    $response['message'] = 'Maestro added successfully';
    $response['id'] = $result;
} else {
    $response['message'] = 'Failed to add maestro';
}

echo json_encode($response);