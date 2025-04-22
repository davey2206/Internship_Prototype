<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

$errorMSG = "";
$animal_id = 0;
$animal_positions = null;
$animal_manager = Animal_Manager::Instance();
$location_manager = Location_Manager::Instance();

/* KUKUDUSHI */
if (empty($_POST["animal_id"]) || intval($_POST["animal_id"]) < 1)
{
    $errorMSG += "No animal selected";
}
else
{
    $animal_id = intval($_POST["animal_id"]);
}

// Check form message
if ($animal_id > 0 && empty($errorMSG))
{

    $animal = $animal_manager->getAnimalById($animal_id);
    $animal_positions = $location_manager->getLocations($animal, true);

    if (!empty($animal_positions))
    {
        $msg = "Loading new animal track...";
        echo json_encode(['code' => 200, 'message' => $msg, 'animal' => $animal, 'animal_positions' => $animal_positions]);
        exit;
    }
    else
    {
        $errorMSG = "No locations found for this animal!";
    }
}

echo json_encode(['code' => 404, 'message' => $errorMSG]);

?>