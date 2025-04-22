<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

// Include necessary files
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);

header('Content-Type: application/json');

$kukudushi_manager = Kukudushi_Manager::Instance();

// Get all active models
$models = $kukudushi_manager->getAllModels();;

// Format data for frontend
$formatted_models = array_map(function($model) {
    return [
        'model_id' => $model->model_id,
        'model_name' => $model->model_name
    ];
}, $models);

echo json_encode($formatted_models);