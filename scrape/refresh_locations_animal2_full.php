<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_location);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

refresh_locations_animal2_all();
function refresh_locations_animal2_all()
{
    $animal_manager = Animal_Manager::Instance();
    $animalsArray = $animal_manager->getAnimalsFromOriginType(3);

    $animalsArray = DataBase::select("SELECT * FROM wp_kukudushi_animals WHERE origin_type = 3;");

    $loops = 0;
    $startloops = 0;
    $maxloops = 99999;

    foreach ($animalsArray as $animalItem)
    {
        if ($loops <= $maxloops && $loops >= $startloops)
        {
            refresh_locations_animal2($animalItem);
        }

        $loops = $loops + 1;
    }
}

function refresh_locations_animal2($animal)
{
    try {
        $json = null;
        $data = null;
        $retrysLeft = 10;
        $failed = false;
        $positions = array();

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
            $new_position = new Location();
            $new_position->id = $JsonPosition["id"];
            $new_position->dt_move = $JsonPosition["dt_move"];

            #alter positions slightly
            $randomNumber1 = rand(-3, 3);
            $randomNumber2 = rand(-3, 3);
            $new_position->lat = (floatval($JsonPosition["point"]["coordinates"]["1"]) * 1000000 + $randomNumber1) / 1000000;
            $new_position->lng = (floatval($JsonPosition["point"]["coordinates"]["0"]) * 1000000 + $randomNumber2) / 1000000;

            $new_position->isCurrent = ($a == 0 ? true : false);


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

            $location_manager = Location_Manager::Instance();

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
        $animal_manager = Animal_Manager::Instance();
        $animal_manager->setLastRefreshToNow($animal->id);

    } 
    catch (Exception $e) 
    {
        $message = 'Het ophalen van de locaties is niet goed gegaan.. \nHet gaat om de turtle met de naam: "' . $animal->name . '", met turtle_id: "' . $animal->id . '". \nDe foutmelding is: "' . $e->getMessage() . '"';
        mail('n1ck1994@live.nl', 'Ophalen van turtle locaties mislukt..', $message);
    }
}
?>