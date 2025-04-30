<?php

/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_caption);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_points);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_metadata);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_media_links);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_guid);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_metadata_property);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_kukudushi_type);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_metadata);

abstract class ShopItemPrices
{
    const AnimalTracker = 1000;
}
class Dashboard_Shop_Manager
{
    public $settings;
    public $kukudushi;
    public $userPoints = 0;
    public $animal_manager;
    public $points_manager;
    public $metadata_manager;

    function __construct($kukudushi)
    {
        $this->settings = Settings_Manager::Instance();
        $this->kukudushi = $kukudushi;
        $this->animal_manager = Animal_Manager::Instance();
        $this->points_manager = Points_Manager::Instance();
        $this->metadata_manager = MetaData_Manager::Instance();

        $this->userPoints = $this->points_manager->getTotalPoints($this->kukudushi);
    }

    public function buyAnimal($animal_id)
    {
        $animal = $this->animal_manager->getAnimalById($animal_id);
        $message = "";
        $owned_animals_metadata = $this->kukudushi->getMetadataFromType("Animal Tracker");
        $owned_animal_ids = [];

        foreach($owned_animals_metadata as $meta)
        {
            $animal_metadata_id = intval($meta->getValue(MetaData_Property::Animal_id));
            array_push($owned_animal_ids, $animal_metadata_id);
        }

        if ($this->userPoints < ShopItemPrices::AnimalTracker)
        {
            $message .= '<div>You do not have enough points to buy this aninmal!</div>';

        }
        else if ($animal == NULL)
        {
            $message .= '<div>This animal does not exist or is not active at the moment!</div>';
        }
        else if (in_array($animal_id, $owned_animal_ids))
        {
            $message .= '<div>You already own this animal! <br />Please select a different one.</div>';
        }
        else
        {
            $description = "Adopted new animal: " . $animal->name;
            $this->handlePoints(ShopItemPrices::AnimalTracker, $description);
            $this->userPoints -= ShopItemPrices::AnimalTracker;

            $message .= $description;

            $metadata = "animal_id=" . $animal_id . ";";

            $new_metadata = new MetaData();
            $new_metadata->type_id = Kukudushi_type::Animal_Tracker;
            $new_metadata->kukudushi_id = $this->kukudushi->id;
            $new_metadata->is_default = !$this->kukudushi->hasDefaultMetaData();
            $new_metadata->metadata = $metadata;
            $new_metadata = $this->metadata_manager->save($new_metadata);

            return [$new_metadata, $this->userPoints, $message];
        }

        return [null, $this->userPoints, $message];
    }

    public function handlePoints($amount, $description = "")
    {
        //Make sure the amount is in minus
        if ($amount > 0)
        {
            $amount = $amount * -1;
        }

        //spend points
        $inserted_id = $this->points_manager->spend_points($this->kukudushi->id, $amount, $description);
    }
    
}

?>