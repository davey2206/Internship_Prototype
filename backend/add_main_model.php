<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

header('Content-Type: application/json');

// Get JSON data from request
$input = json_decode(file_get_contents('php://input'), true);
$response = ['success' => false, 'message' => ''];

if (!isset($input['model_name']) || empty($input['model_name'])) {
    $response['message'] = 'Model name is required';
    echo json_encode($response);
    exit;
}

$model_name = $input['model_name'];

// Insert new main model
$result = DataBase::insert('wp_kukudushi_models_main', [
    'model_name' => $model_name
]);

if ($result) {
    $response['success'] = true;
    $response['message'] = 'Main model added successfully';
    $response['id'] = $result;
} else {
    $response['message'] = 'Failed to add main model';
}

echo json_encode($response);