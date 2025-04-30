<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

header('Content-Type: application/json');

// Get all maestros from database - include is_active field
$maestros = DataBase::select("SELECT id, name, is_active FROM wp_kukudushi_maestros ORDER BY name");

// Convert is_active to boolean for frontend
foreach ($maestros as &$maestro) {
    $maestro->is_active = (bool)$maestro->is_active;
}

echo json_encode($maestros);