<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_location);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

function refresh_locations_turtle($animal)
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
            $json = getPageContentsWithProxy("https://stc.mapotic.com/api/v1/poi/" . $animal->ext_data_id . "/move/?page_size=2000");
            $data = json_decode($json, true);

            $retrysLeft = $retrysLeft - 1;
        }

        $jsonPositions = $data["results"];


        for ($a = 0; $a <= count($jsonPositions) - 1; $a++) 
        {
            $JsonPosition = $jsonPositions[$a];
            $new_position = new Location();
            $new_position->id = $JsonPosition["id"];
            $new_position->dt_move = $JsonPosition["dt_move"];

            #alter positions slightly
            $randomNumber1 = rand(-3, 3);
            $randomNumber2 = rand(-3, 3);
            $new_position->lat = (floatval($JsonPosition["data"]["Lat"]) * 1000000 + $randomNumber1) / 1000000;
            $new_position->lng = (floatval($JsonPosition["data"]["Lng"]) * 1000000 + $randomNumber2) / 1000000;

            $new_position->isCurrent = $JsonPosition["data"]["Icon"] == "current" ? true : false;


            #add position to array
            $positions[] = $new_position;
        }

        for ($a = 0; $a <= count($positions) - 1; $a++) 
        {
            $position_data = $positions[$a];
            $current = $position_data->isCurrent ? 1 : 0;
            $dt_format = date_parse($position_data->dt_move);
            $dt_string = date('Y-m-d H:i:s', mktime($dt_format['hour'], $dt_format['minute'], $dt_format['second'], $dt_format['month'], $dt_format['day'], $dt_format['year']));
            $timestamp = strtotime($dt_string);

            $location = new Location();
            $location->ext_id = $animal->id;
            $location->ext_loc_id = $timestamp;
            $location->dt_move = $dt_string;
            $location->lat = $position_data->lat;
            $location->lng = $position_data->lng;
            $location->hash = $animal->id ."-". $position_data->id;
            $location_manager->save_new_location($location);
        }

        //Update Turtle's last_refresh
        $animal_manager->setLastRefreshToNow($animal->id);
    } 
    catch (Exception $e) 
    {
        $message = 'Het ophalen van de locaties is niet goed gegaan.. \nHet gaat om de turtle met de naam: "' . $animal->name . '", met turtle_id: "' . $animal->id . '". \nDe foutmelding is: "' . $e->getMessage() . '"';
        mail('n1ck1994@live.nl', 'Ophalen van turtle locaties mislukt..', $message);
    }
}
?>