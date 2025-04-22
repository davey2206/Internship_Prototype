<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

// Include necessary files
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_scan);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_points);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_notification);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_kukudushi_main_type);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_kukudushi_type);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::misc_popup_interface);

header('Content-Type: application/json');

global $animal_manager;

$kukudushi_id = "";
$settings = Settings_Manager::Instance();
$kukudushi_manager = Kukudushi_Manager::Instance();
$animal_manager = Animal_Manager::Instance();
$location_manager = Location_Manager::Instance();
$response_data = null;

$kukudushi = null;
$logger = new Logger();

// Get Kukudushi instance by UID or ID
if (!empty($_GET['uid'])) {
    $kukudushi_id = htmlspecialchars($_GET['uid'], ENT_QUOTES, 'UTF-8');
    $kukudushi = $kukudushi_manager->get_kukudushi($kukudushi_id);
} else if (!empty($_GET['id'])) {
    $kukudushi_id = htmlspecialchars($_GET['id'], ENT_QUOTES, 'UTF-8');
    $kukudushi = $kukudushi_manager->get_kukudushi($kukudushi_id);
}

// Process response data
if (!$kukudushi->exists || $kukudushi->temporary_id_expired) {
    $response_data = [
        'kukudushi' => $kukudushi,
        'animals' => [],
        'points_data' => [
            'original_points_amount' => 0,
            'points_awarded' => 0,
        ],
        'notifications_data' => [],
    ];
} else {
    // Set user guid JS if needed
    $set_user_guid_js = $kukudushi_manager->scan_manager->user_manager->setUserGuid_js;
    
    // Register scan and points
    $kukudushi_manager->scan_manager->registerScan($kukudushi, 0, "Animal Tracker");
    $original_points_amount = $kukudushi_manager->points_manager->getTotalPoints($kukudushi);
    $kukudushi_manager->points_manager->register_points($kukudushi);
    $points_awarded = $kukudushi_manager->points_manager->points_awarded->amount ?? 0;

    // Get notifications
    $notifications = $kukudushi_manager->notification_manager->getAllRemainingNotifications($kukudushi->id);

    // Process and enrich animal data
    $ownedAnimalsMetadata = $kukudushi->getMetadataFromType("Animal Tracker");
    $enriched_active_animals = [];
    $default_animal_id = -1;

    // Set default animal ID
    if (!empty($ownedAnimalsMetadata)) {
        $default_animal_id = $ownedAnimalsMetadata[0]->getValue(MetaData_Property::Animal_id);
    }

    // Enrich owned animals
    foreach ($ownedAnimalsMetadata as $metadata) {
        $animal_id = $metadata->getValue(MetaData_Property::Animal_id);
        $animal = $animal_manager->getAnimalById($animal_id);
        
        if ($animal) {
            $animal->is_owned = true;
            $animal->locations = $location_manager->getLocations($animal);
            $animal->fun_fact = $animal_manager->getRandomFunFacts($animal->species_id);
            $animal->is_default = ($animal->id == $default_animal_id);
            $enriched_active_animals[] = $animal;
        }
    }

    // Fetch all active animals and add non-owned ones
    $allActiveAnimals = $animal_manager->getAllActiveAnimals();
    $enriched_active_animal_ids = array_column($enriched_active_animals, 'id');

    foreach ($allActiveAnimals as $active_animal) {
        if (!in_array($active_animal->id, $enriched_active_animal_ids)) {
            $active_animal->is_owned = false;
            $active_animal->locations = [$location_manager->getCurrentLocation($active_animal, $active_animal->track_step > 0)];
            $active_animal->is_default = false;
            $enriched_active_animals[] = $active_animal;
        }
    }

    $response_data = [
        'kukudushi' => $kukudushi,
        'set_user_guid_js' => $set_user_guid_js,
        'animals' => $enriched_active_animals,
        'points_data' => [
            'original_points_amount' => $original_points_amount,
            'points_awarded' => $points_awarded,
        ],
        'notifications_data' => $notifications,
    ];
}

// Send JSON response
echo json_encode($response_data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);