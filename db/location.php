<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Location_DB
{
    public function getAnimalLocations($animal, $track_step = 0)
    {
        if ($animal == null)
        {
            return null;
        }

        // Initialize the base query
        $sql = "";
        $queryParams = [];

        if ($track_step <= 0)
        {
            $sql .= "SELECT * FROM wp_kukudushi_animals_locations WHERE ext_id = %d AND dt_move <= NOW() ORDER BY ext_loc_id DESC, id DESC";
            $queryParams = [$animal->id];
        }
        if ($track_step > 0)
        {
            $sql .= "SELECT * FROM ( SELECT * FROM wp_kukudushi_animals_locations WHERE ext_id = %d AND dt_move <= NOW() ORDER BY ext_loc_id ASC, id DESC LIMIT %d) AS sub ORDER BY ext_loc_id DESC, id ASC;";
            $queryParams = [$animal->id, $track_step];
        }

        // Execute the query using the DataBase class with parameterized inputs
        $animalPositions = DataBase::select($sql, $queryParams);

        if (!empty($animalPositions)) 
        {
            return $animalPositions;
        }

        return null;
    }

    public function getAnimalLocationById($location_id)
    {
        if (empty($location_id)) 
        {
            return null;
        }

        $sql = "SELECT * FROM wp_kukudushi_animals_locations WHERE id = %d;";
        $queryParams['id'] = $location_id;

        $animal_location = DataBase::select($sql, array_values($queryParams));

        if (!empty($animal_location))
        {
            return $animal_location[0];
        }

        return null;
    }

    public function getAnimalReleaseLocation($animal)
    {
        if (empty($animal->id)) 
        {
            return null;
        }

        $sql = "SELECT * FROM wp_kukudushi_animals_locations WHERE ext_id = %d ORDER BY ext_loc_id ASC LIMIT 1; ";
        $queryParams = ['animal_id' => $animal->id];

        $animalPositions = DataBase::select($sql, array_values($queryParams));

        if (!empty($animalPositions))
        {
            return $animalPositions[0];
        }

        return null;
    }
    
    public function getAnimalCurrentLocation($animal)
    {
        if (empty($animal->id)) 
        {
            return null;
        }

        $sql = "SELECT * FROM wp_kukudushi_animals_locations WHERE ext_id = %d AND dt_move <= NOW() ORDER BY dt_move DESC LIMIT 1; ";
        $queryParams = ['animal_id' => $animal->id];

        $animalPositions = DataBase::select($sql, array_values($queryParams));

        if (!empty($animalPositions))
        {
            return $animalPositions[0];
        }

        return null;
    }

    public function getAnimalCurrentLocationCustomTrack($animal)
    {
        if ($animal == null)
        {
            return null;
        }
        
        $sql = "SELECT * FROM wp_kukudushi_animals_locations WHERE ext_id = %d AND dt_move <= NOW() ORDER BY ext_loc_id ASC, id DESC LIMIT %d;";
        $result = DataBase::select($sql, [$animal->id, $animal->track_step]);

        if (!empty($result))
        {
            //Get current location
            $animal_current_location = $result[count($result) - 1];
            return $animal_current_location;
        }
        
        // No results
        return null;
    }

    public function SetAnimalTrackStep($animal_id, $track_step)
    {
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));

        $animalsTable = "wp_kukudushi_animals";

        $success = DataBase::update(
            $animalsTable,
            ['track_step' => $track_step, 'last_refresh' => $dateTimeNow->format('Y-m-d H:i:s')],
            ['id' => intval($animal_id)],
            ['%d'],
            ['%d']
        );
        
        return $success;
    }


    public function setNextLocationOnTrack($animal)
    {
        if ($animal == null)
        {
            return false;
        }

        $new_location_count = $animal->track_step + 1;
        
        $sql = "SELECT * FROM wp_kukudushi_animals_locations WHERE ext_id = %d AND dt_move <= NOW() ORDER BY ext_loc_id ASC, id DESC LIMIT %d;";
        $result = DataBase::select($sql, [$animal->id, $new_location_count]);
        
        //check result, if result count is not the same as new location count then the last step has been reached
        if (!empty($result) && (count($result) == $new_location_count))
        {
            //Get new location
            $animal_new_location = $result[count($result) - 1];
            
            $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));

            // Update the animal's location with the new date
            DataBase::update(
                'wp_kukudushi_animals_locations',
                ['dt_move' => $dateTimeNow->format('Y-m-d H:i:s')], // Use WordPress current_time function for proper time formatting
                ['id' => $animal_new_location->id]
            );

            // Update the animal's last refresh and track step
            return $this->SetAnimalTrackStep($animal->id, $new_location_count);
            //true
        }
        
        // Last position reached
        return false;
    }

    public function restartAnimalTrack($animal_id, $starting_steps_count, $steps_interval = 1)
    {
        $animalsTable = "wp_kukudushi_animals";
        $locationsTable = "wp_kukudushi_animals_locations";
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));

        $starting_track_potitions = DataBase::select(
            "SELECT * FROM `$locationsTable` WHERE `ext_id` = %d ORDER BY `ext_loc_id` ASC, id DESC LIMIT %d",
            [intval($animal_id), intval($starting_steps_count)]
        );

        if (!empty($starting_track_potitions)) 
        {
            //try to get the 5th position on the track
            //$position_five = $starting_track_potitions[count($starting_track_potitions) - 1];

            $positions = array_reverse($starting_track_potitions);
            $location_datetime = $dateTimeNow;
            foreach ($positions as $pos)
            {

                DataBase::update(
                    $locationsTable,
                    ['dt_move' => $location_datetime->format('Y-m-d')],
                    ['id' => intval($pos->id)]
                );

                $location_datetime->sub(new DateInterval("P". strval($steps_interval) ."D"));
            }

            //return $this->SetAnimalTrackStep($animal_id, 5);
            return true;
        }
            
        return false;
    }

    public function save_new_location($location_object)
    {
        // Table name
        $table_name = 'wp_kukudushi_animals_locations';

        // Prepare the data for insertion
        // Assuming $location_object is an associative array with keys matching the table column names
        // No need to include 'id' and 'dt_added' as they are managed by the database (AUTO_INCREMENT and current_timestamp())
        $data = [
            'ext_id' => $location_object->ext_id,
            'ext_loc_id' => $location_object->ext_loc_id,
            'dt_move' => $location_object->dt_move,
            'lat' => $location_object->lat,
            'lng' => $location_object->lng,
            'hash' => $location_object->hash
        ];

        // Insert the data into the database
        $result = DataBase::insert($table_name, $data);

        // Return the result of the insert operation
        return $result;
            
    }

}
?>