<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

header('Content-Type: application/json');

// Get JSON data from request
$input = json_decode(file_get_contents('php://input'), true);
$response = ['success' => false, 'message' => ''];

if (!isset($input['id']) || !isset($input['model_name']) || empty($input['model_name'])) {
    $response['message'] = 'ID and model name are required';
    echo json_encode($response);
    exit;
}

$id = $input['id'];
$model_name = $input['model_name'];

// Update main model
$result = DataBase::update(
    'wp_kukudushi_models_main',
    ['model_name' => $model_name],
    ['id' => $id]
);

if ($result) {
    $response['success'] = true;
    $response['message'] = 'Main model updated successfully';
} else {
    $response['message'] = 'Failed to update main model';
}

echo json_encode($response);