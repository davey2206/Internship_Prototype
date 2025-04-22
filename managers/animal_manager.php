<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_animals);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_animal);

class Animal_Manager
{
    private static $instance = null;
    public $animal_db;

    private function __construct() 
    {
        $this->animal_db = new Animals_DB();
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new Animal_Manager();
        }
        return self::$instance;
    }

    public function getAnimalById($animal_id)
    {
        if (!empty($animal_id))
        {
            $animal_result = $this->animal_db->getAnimalById($animal_id);
            return $this->getAnimalObject($animal_result);;
        }
    }

    public function getAllActiveAnimals()
    {
        return $this->animal_db->getAllActiveAnimals();
    }

    public function setLastRefreshToNow($animal_id)
    {
        $this->animal_db->setAnimalLastRefresh($animal_id);
    }

    public function setExtActive($animal_id, $active = false)
    {
        $this->animal_db->setAnimalExtActive($animal_id, $active);
    }

    public function setActive($animal_id, $active = false)
    {
        $this->animal_db->setAnimalActive($animal_id, $active);
    }

    public function restartAnimalTrack($animal_id, $starting_steps_count, $steps_interval = 1)
    {
        return $this->animal_db->restartAnimalTrack($animal_id, $starting_steps_count, $steps_interval);
    }
    
    /*
    function save_animal_information($animal_id, $name, $species, $description, $active)
    {
        return $this->animal_db->save_animal_information($animal_id, $name, $species, $description, $active);
    }
    */

    public function save_animal_information($animal)
    {
        return $this->animal_db->save_animal_information($animal);
    }

    public function getAnimalsFromOriginType($origin_type)
    {
        return $this->animal_db->getAnimalsFromOriginType($origin_type);
    }

    private function getAnimalFunFacts($species_id)
    {
        return $this->animal_db->getAnimalFunFacts($species_id);
    }

    public function getRandomFunFacts($species_id)
    {
        $all_fun_facts = $this->getAnimalFunFacts($species_id);
        $max_count = count($all_fun_facts) - 1;
        $random_select = rand(0, $max_count);

        $random_did_you_know = $all_fun_facts[$random_select];
        return $random_did_you_know->text;
    }

    public function getAllActiveAndAssociatedAnimals($kukudushi_id)
    {
        return $this->animal_db->getAllActiveAndAssociatedAnimals($kukudushi_id);
    }

    public function getAllAnimals($only_active = false, $sort_species = false)
    {
        $all_animals = [];
        $result = $this->animal_db->getAllAnimals($only_active, $sort_species);

        foreach ($result as $animal_instance)
        {
            $all_animals[] = $this->getAnimalObject($animal_instance);
        }

        return $all_animals;
    }

    public function getAllAnimalsForAdminViewer($only_active = false)
    {
        $all_animals = [];
        $result = $this->animal_db->getAllAnimalsForAdminViewer($only_active);

        foreach ($result as $animal_instance)
        {
            $all_animals[] = $this->getAnimalObject($animal_instance);
        }

        return $all_animals;
    }

    private function getAnimalObject($animal_result)
    {
        if (!empty($animal_result))
        {
            $animal = new Animal();
            $animal->id = $animal_result->id;
            $animal->origin_type = $animal_result->origin_type;
            $animal->ext_site = $animal_result->ext_site;
            $animal->ext_id = $animal_result->ext_id;
            $animal->ext_data_id = $animal_result->ext_data_id;
            $animal->name = $animal_result->name;
            $animal->imageurl = $animal_result->imageurl;
            $animal->species = $animal_result->species;
            $animal->species_id = $animal_result->species_id;
            $animal->main_species = $animal_result->main_species;
            $animal->main_species_id = $animal_result->main_species_id;
            $animal->conservation_description = $animal_result->conservation_description;
            $animal->conservation_status = $animal_result->conservation_status;
            $animal->conservation_rating = $animal_result->conservation_rating;
            $animal->gender = $animal_result->gender;
            $animal->weight = $animal_result->weight;
            $animal->length = $animal_result->length;
            $animal->life_stage = $animal_result->life_stage;
            $animal->description = $animal_result->description;
            $animal->is_active = $animal_result->is_active == 1;
            $animal->last_refresh = $animal_result->last_refresh;
            $animal->ext_active = $animal_result->ext_active == 1;
            $animal->track_step = $animal_result->track_step;
            $animal->track_step_interval = $animal_result->track_step_interval;

            if (isset($animal_result->max_dt_move))
            {
                $animal->max_dt_move = $animal_result->max_dt_move;
            }
            if (isset($animal_result->min_dt_move))
            {
                $animal->min_dt_move = $animal_result->min_dt_move;
            }
            if (isset($animal_result->location_count))
            {
                $animal->location_count = $animal_result->location_count;
            }

            return $animal;
        }
        return null;
    }

}
?>