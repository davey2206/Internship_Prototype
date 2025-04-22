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
$new_locations_data = null;
$animal_manager = Animal_Manager::Instance();
$location_manager = Location_Manager::Instance();

/* Animal id */
if (empty($_POST["animal_id"]) || intval($_POST["animal_id"]) < 1) 
{
    $errorMSG .= "No animal selected. ";
} 
else 
{
    $animal_id = intval($_POST["animal_id"]);
}

/* Locations data */
if (empty($_POST["new_locations_data"])) 
{
    $errorMSG .= "No new locations data received. ";
} 
else 
{
    $new_locations_data = $_POST["new_locations_data"];
}

// Check for error message
if (empty($errorMSG)) 
{
    foreach ($new_locations_data as $data) 
    {
        $latitude = $data[0][0];
        $longitude = $data[0][1];
        
        $dt_move = $data[1];
        $ext_loc_id = strtotime($dt_move);

        $hash = hash("sha256", $dt_move . $latitude . $longitude);

        $location = new Location();
        $location->ext_loc_id = $ext_loc_id;
        $location->ext_id = $animal_id;
        $location->dt_move = $dt_move;
        $location->lat = $latitude;
        $location->lng = $longitude;
        $location->hash = $hash;
        
        $inserted_id = $location_manager->save_new_location($location);
        
        if ($inserted_id === false) 
        {
            $errorMSG = "Failed to insert data for animal location.";
            break;
        }
    }

    if (empty($errorMSG)) 
    {
        $animal = $animal_manager->getAnimalById($animal_id);
        $animal_positions = $location_manager->getLocations($animal, true);

        if (!empty($animal_positions)) 
        {
            $msg = "Saved changes, and loading updated animal track...";
            echo json_encode(['code' => 200, 'message' => $msg, 'animal' => $animal, 'animal_positions' => $animal_positions]);
            exit;
        } 
        else 
        {
            $errorMSG = "Something went wrong retrieving updated locations!";
        }
    } 
} 

// If there was an error, echo it at the end
if (!empty($errorMSG)) 
{
    echo json_encode(['code' => 404, 'message' => $errorMSG]);
}
?>
