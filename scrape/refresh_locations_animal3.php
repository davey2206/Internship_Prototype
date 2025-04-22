<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_location);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

function refresh_locations_animal3($animal)
{
    try {
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
            $json = getPageContentsWithProxy("https://www.mapotic.com/api/v1/maps/3413/pois/". $animal->ext_data_id ."/motion/with-meta/?h=0");
            $data = json_decode($json, true);

            $retrysLeft = $retrysLeft - 1;
        }

        $jsonPositions = $data["motion"];
		
		for ($a = 0; $a <= count($jsonPositions)-1; $a++)
		{		
			$jsonPosition = $jsonPositions[$a];
			
			$dt_move = $jsonPosition["dt_move"];
			
			$import_id = $jsonPosition["import_id"];
			$explode_id = explode(":", $import_id);
			$pos_id = $explode_id[1];
			
			$point = $jsonPosition["point"];
			$coordinates = $point["coordinates"];
			$lon = $coordinates[0];
			$lat = $coordinates[1];
			
			$new_position = new Location();
			$new_position->id = $pos_id;
			$new_position->dt_move = $dt_move;
			
			#alter positions slightly
			$randomNumber1 = rand(-3,3);
			$randomNumber2 = rand(-3,3);
			$new_position->lat = (floatval($lat) * 1000000 + $randomNumber1) / 1000000;
			$new_position->lng = (floatval($lon) * 1000000 + $randomNumber2) / 1000000;		
			
			$new_position->isCurrent = ($a == count($jsonPositions)-1 ? true : false);
			$dateTimeNow = new DateTime(); //defaults to the current date/time
			$dateTwoWeeksAgo = $dateTimeNow->modify("-2 week")->format("Y-m-d");
			$positionDateTime = $new_position->dt_move;
			
			if (strtotime($positionDateTime) > strtotime($dateTwoWeeksAgo))
			{
				$animal->is_active = true;
			}
			
			#add position to array
			$positions[] = $new_position;
			
		}

        for ($a = 0; $a <= count($positions) - 1; $a++) {
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