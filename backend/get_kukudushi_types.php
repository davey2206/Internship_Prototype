<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

// Include necessary files
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);

header('Content-Type: application/json');

$kukudushi_manager = Kukudushi_Manager::Instance();

// Get all types from the database
$types = $kukudushi_manager->getAllTypes();

// Format data for frontend
$formatted_types = array_map(function($type) {
    return [
        'type_id' => $type->type_id,
        'type_name' => $type->type_name
    ];
}, $types);

echo json_encode($formatted_types);