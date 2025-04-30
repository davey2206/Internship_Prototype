<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

header('Content-Type: application/json');

// Get JSON data from request
$input = json_decode(file_get_contents('php://input'), true);
$response = ['success' => false, 'message' => ''];

if (!isset($input['id'])) {
    $response['message'] = 'Maestro ID is required';
    echo json_encode($response);
    exit;
}

$id = $input['id'];
$is_active = isset($input['is_active']) ? (bool)$input['is_active'] : false;

// Update maestro active status
$result = DataBase::update(
    'wp_kukudushi_maestros',
    ['is_active' => $is_active ? 1 : 0],
    ['id' => $id]
);

if ($result) {
    $response['success'] = true;
    $response['message'] = 'Maestro status updated successfully';
} else {
    $response['message'] = 'Failed to update maestro status';
}

echo json_encode($response);