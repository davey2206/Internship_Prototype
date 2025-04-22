<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_location);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_location);


class Location_Manager
{
    private static $instance = null;
    public $location_db;
    public $settings;
    public $firstDailyScan;

    private function __construct()
    {
        $this->settings = Settings_Manager::Instance();
        $this->location_db = new Location_DB();
        $this->firstDailyScan = false;
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new Location_Manager();
        }
        return self::$instance;
    }

    function getLocations($animal, $force_full_track = false)
    {
        $animal_locations = [];
        $result = null;

        $track_step = $animal->track_step;
        if ($force_full_track)
        {
            $track_step = 0;
        }

        $result = $this->location_db->getAnimalLocations($animal, $track_step);

        if ($result == NULL)
        {
            return [];
        }

        foreach ($result as $location)
        {
            $animal_locations[] = $this->getLocationObject($location);
        }

        return $animal_locations;
    }

    function getReleaseLocation($animal)
    {
        return $this->getLocationObject($this->location_db->getAnimalReleaseLocation($animal));
    }
    
    function getCurrentLocation($animal, $custom_track = false)
    {
        if ($custom_track)
        {
            return $this->getLocationObject($this->location_db->getAnimalCurrentLocationCustomTrack($animal));
        }

        return $this->getLocationObject($this->location_db->getAnimalCurrentLocation($animal));
    }

    function SetNextLocationOnTrack($animal)
    {
        return $this->location_db->setNextLocationOnTrack($animal);
    }

    public function restartAnimalTrack($animal_id, $starting_steps_count, $steps_interval = 1)
    {
        return $this->location_db->restartAnimalTrack($animal_id, $starting_steps_count, $steps_interval);
    }
    
    function getLocationObject($location)
    {
        if ($location == NULL)
        {
            return NULL;
        }

        $location_obj = new Location();
        $location_obj->id = $location->id;
        $location_obj->ext_loc_id = $location->ext_loc_id;
        $location_obj->ext_id = $location->ext_id;
        $location_obj->dt_move = $location->dt_move;
        $location_obj->lat = $location->lat;
        $location_obj->lng = $location->lng;
        $location_obj->hash = $location->hash;
        $location_obj->dt_added = $location->dt_added;

        return $location_obj;
    }

    function save_new_location($location)
    {
        return $this->location_db->save_new_location($location);
    }
}

?>