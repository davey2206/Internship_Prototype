<?php
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_location);
class Animal
{
    public $id;
    public $origin_type;
    public $ext_site;
    public $ext_id;
    public $ext_data_id;
    public $name;
    public $imageurl;
    public $species;
    public $species_id;
    public $main_species;
    public $main_species_id;
    public $conservation_description;
    public $conservation_status;
    public $conservation_rating;
    public $gender;
    public $weight;
    public $length;
    public $life_stage;
    public $description;
    public $is_active;
    public $last_refresh;
    public $ext_active;
    public $track_step;
    public $track_step_interval;
    public $is_owned;
    public $fun_fact;
    public $is_default;

    /**
     * @var Location[] An array of Location objects.
     * This property is intended to hold an array of Location instances.
     */
    public $locations;
    public $max_dt_move;
    public $min_dt_move;
    public $location_count; 

    function __construct() 
    {

        
    }

    function exists()
    {
        return !empty($this->id);
    }
}
?>