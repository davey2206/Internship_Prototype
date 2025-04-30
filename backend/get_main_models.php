<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

// Include necessary files
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);

header('Content-Type: application/json');

$kukudushi_manager = Kukudushi_Manager::Instance();

// Get all main models
$main_models = $kukudushi_manager->getAllMainModels();

// Format data for frontend
$formatted_main_models = array_map(function($model) {
    return [
        'id' => $model->id,
        'model_name' => $model->model_name
    ];
}, $main_models);

echo json_encode($formatted_main_models);