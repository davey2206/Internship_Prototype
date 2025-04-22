<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

// Include necessary files
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_metadata);

header('Content-Type: application/json');

$settings = Settings_Manager::Instance();
$animal_manager = Animal_Manager::Instance();
$metadata_manager = MetaData_Manager::Instance();

// Get kukudushi ID from request
$kukudushi_id = null;
if (!empty($_GET['kukudushi_id'])) {
    $kukudushi_id = htmlspecialchars($_GET['kukudushi_id'], ENT_QUOTES, 'UTF-8');
}

// Get all active animals
$animals = $animal_manager->getAllActiveAnimals();

// If we have a kukudushi_id, also get any inactive animals that have metadata
if ($kukudushi_id) {
    $metadata = $metadata_manager->getAllMetaData($kukudushi_id);
    foreach ($metadata as $meta) {
        if (preg_match('/animal_id=(\d+)/', $meta->metadata, $matches)) {
            $animal_id = $matches[1];
            // Check if this animal is already in our list
            $exists = false;
            foreach ($animals as $animal) {
                if ($animal->id == $animal_id) {
                    $exists = true;
                    break;
                }
            }
            // If not in list, get the animal and add it
            if (!$exists) {
                $inactiveAnimal = $animal_manager->getAnimalById($animal_id);
                if ($inactiveAnimal) {
                    $animals[] = $inactiveAnimal;
                }
            }
        }
    }
}

// Format data for frontend
$formatted_animals = array_map(function($animal) {
    return [
        'id' => $animal->id,
        'name' => $animal->name,
        'species' => $animal->species,
        'main_species' => $animal->main_species,
        'is_active' => $animal->is_active
    ];
}, $animals);

echo json_encode($formatted_animals);