<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_dashboard_shop);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_metadata);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

header('Content-Type: application/json');

$logger = new Logger();
$kukudushi = null;
$settings = Settings_Manager::Instance();
$kukudushi_manager = Kukudushi_Manager::Instance();
$animal_manager = Animal_Manager::Instance();
$location_manager = Location_Manager::Instance();

// Get Kukudushi from uid or id
if (!empty($_GET['uid'])) {
    $kukudushi_id = htmlspecialchars($_GET['uid'], ENT_QUOTES, 'UTF-8');
    $kukudushi = $kukudushi_manager->get_kukudushi($kukudushi_id);
} else if (!empty($_GET['id'])) {
    $kukudushi_id = htmlspecialchars($_GET['id'], ENT_QUOTES, 'UTF-8');
    $kukudushi = $kukudushi_manager->get_kukudushi($kukudushi_id);
}

// Check if $kukudushi is an instance of Kukudushi and not null
if ($kukudushi && $kukudushi instanceof Kukudushi) {
    $kukudushi->exists = true; // Example of setting a custom property
}

$buy_animal_id = isset($_GET['buy_animal_id']) ? $_GET['buy_animal_id'] : -1;

$shop = new Dashboard_Shop_Manager($kukudushi);

$bought_animal = null;
$message = "The animal you're trying to buy does not exist!";
if ($buy_animal_id > 0)
{
    [$bought_metadata, $remaining_points, $message] = $shop->buyAnimal($buy_animal_id);

    if ($bought_metadata != null)
    {
        $bought_animal = $animal_manager->getAnimalById($buy_animal_id);
        $bought_animal->is_owned = true;
        $bought_animal->locations = $location_manager->getLocations($bought_animal);
        $bought_animal->fun_fact = $animal_manager->getRandomFunFacts($bought_animal->species_id);
        $bought_animal->is_default = false;
    }
}

$data = [
    'bought_animal' => $bought_animal,
    'remaining_points' => $remaining_points,
    'message' => $message
];

// Debugging: Check if the data is properly formatted
error_log(json_encode($data));

echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);