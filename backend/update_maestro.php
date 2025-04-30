<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

header('Content-Type: application/json');

// Get JSON data from request
$input = json_decode(file_get_contents('php://input'), true);
$response = ['success' => false, 'message' => ''];

if (!isset($input['id']) || !isset($input['name']) || empty($input['name'])) {
    $response['message'] = 'ID and name are required';
    echo json_encode($response);
    exit;
}

$id = $input['id'];
$name = $input['name'];

// Update maestro
$result = DataBase::update(
    'wp_kukudushi_maestros',
    ['name' => $name],
    ['id' => $id]
);

if ($result) {
    $response['success'] = true;
    $response['message'] = 'Maestro updated successfully';
} else {
    $response['message'] = 'Failed to update maestro';
}

echo json_encode($response);