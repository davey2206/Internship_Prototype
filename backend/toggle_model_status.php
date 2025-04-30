<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

header('Content-Type: application/json');

// Get JSON data from request
$input = json_decode(file_get_contents('php://input'), true);
$response = ['success' => false, 'message' => ''];

if (!isset($input['model_id'])) {
    $response['message'] = 'Model ID is required';
    echo json_encode($response);
    exit;
}

$model_id = $input['model_id'];
$is_active = isset($input['is_active']) ? (bool)$input['is_active'] : false;

// Update model active status
$result = DataBase::update(
    'wp_kukudushi_models',
    ['is_active' => $is_active ? 1 : 0],
    ['model_id' => $model_id]
);

if ($result) {
    $response['success'] = true;
    $response['message'] = 'Model status updated successfully';
} else {
    $response['message'] = 'Failed to update model status';
}

echo json_encode($response);