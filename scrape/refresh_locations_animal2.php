<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_location);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

function refresh_locations_animal2($animal)
{
    try 
    {
        $json = null;
        $data = null;
        $retrysLeft = 10;
        $failed = false;
        $positions = array();
        $animal_manager = Animal_Manager::Instance();
        $location_manager = Location_Manager::Instance();

        while (!isset($json) || empty($json) || !isset($data) || empty($data)) 
        {
            if ($retrysLeft <= 0) 
            {
                $failed = true;
                break;
            }
            $json = getPageContentsWithProxy("https://fahlo.mapotic.com/api/v1/poi/" . $animal->ext_data_id . "/move/?page_size=2000");
            $data = json_decode($json, true);

            $retrysLeft = $retrysLeft - 1;
        }

        $jsonPositions = $data["results"];
        

        for ($a = 0; $a <= count($jsonPositions) - 1; $a++) 
        {
            $JsonPosition = $jsonPositions[$a];
            $dt_format = date_parse($JsonPosition["dt_move"]);
            $dt_string = date('Y-m-d H:i:s', mktime($dt_format['hour'], $dt_format['minute'], $dt_format['second'], $dt_format['month'], $dt_format['day'], $dt_format['year']));
            $timestamp = strtotime($dt_string);
            
            $new_position = new Location();
            $new_position->hash = $animal->id ."-". $JsonPosition["id"];
            $new_position->ext_id = $animal->id;
            $new_position->ext_loc_id = $timestamp;
            $new_position->dt_move = $dt_string;

            #alter positions slightly
            $randomNumber1 = rand(-3, 3);
            $randomNumber2 = rand(-3, 3);
            $new_position->lat = (floatval($JsonPosition["point"]["coordinates"]["1"]) * 1000000 + $randomNumber1) / 1000000;
            $new_position->lng = (floatval($JsonPosition["point"]["coordinates"]["0"]) * 1000000 + $randomNumber2) / 1000000;
            $new_position->isCurrent = ($a == 0 ? true : false);

            $location_manager->save_new_location($new_position);
        }

        $animal_manager->setLastRefreshToNow($animal->id);

    } 
    catch (Exception $e) 
    {
        $message = 'Het ophalen van de locaties is niet goed gegaan.. \nHet gaat om de turtle met de naam: "' . $animal->name . '", met turtle_id: "' . $animal->id . '". \nDe foutmelding is: "' . $e->getMessage() . '"';
        mail('n1ck1994@live.nl', 'Ophalen van turtle locaties mislukt..', $message);
    }
}
?>