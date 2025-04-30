<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

header('Content-Type: application/json');

// Get JSON data from request
$input = json_decode(file_get_contents('php://input'), true);
$response = ['success' => false, 'message' => ''];

if (!isset($input['model_name']) || empty($input['model_name']) || 
    !isset($input['main_model']) || empty($input['main_model'])) {
    $response['message'] = 'Model name and main model are required';
    echo json_encode($response);
    exit;
}

$model_name = $input['model_name'];
$main_model = $input['main_model'];

// Insert new model
$result = DataBase::insert('wp_kukudushi_models', [
    'model_name' => $model_name,
    'main_model' => $main_model
]);

if ($result) {
    $response['success'] = true;
    $response['message'] = 'Model added successfully';
    $response['model_id'] = $result;
} else {
    $response['message'] = 'Failed to add model';
}

echo json_encode($response);