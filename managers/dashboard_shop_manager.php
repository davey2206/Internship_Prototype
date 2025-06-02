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
    const Horoscope = 1000;
    const Gospel = 1000;
    const CustomMedia = 1000;
    const Wisdom = 1000;
    const PinkRibbon = 1000;
}
class Dashboard_Shop_Manager
{
    public $settings;
    public $kukudushi;
    public $userPoints = 0;
    public $animal_manager;
    public $captions_manager;
    public $media_links_manager;
    public $points_manager;
    public $metadata_manager;

    function __construct($kukudushi)
    {
        $this->settings = Settings_Manager::Instance();
        $this->kukudushi = $kukudushi;
        $this->animal_manager = Animal_Manager::Instance();
        $this->captions_manager = Caption_Manager::Instance();
        $this->points_manager = Points_Manager::Instance();
        $this->metadata_manager = MetaData_Manager::Instance();
        $this->media_links_manager = Media_Links_Manager::Instance();

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

    public function buyGospel()
    {
        $message = "";
        $owned_gospel_metadata = $this->kukudushi->getMetadataFromType("Gospel");


        if ($this->userPoints < ShopItemPrices::Gospel)
        {
            $message .= 'You do not have enough points to buy the kukudushi Gospel!';
        }
        else if (!empty($owned_gospel_metadata))
        {
            $message .= 'You already own the kukudushi Gospel!';
        }
        else
        {
            $description = "Bought kukudushi gospel";
            $this->handlePoints(ShopItemPrices::Gospel, $description);

            $message .= $description;

            $new_metadata = new MetaData();
            $new_metadata->type_id = Kukudushi_type::Gospel;
            $new_metadata->kukudushi_id = $this->kukudushi->id;
            $new_metadata->is_default = !$this->kukudushi->hasDefaultMetaData();
            $new_metadata->metadata = "";
            $new_metadata = $this->metadata_manager->save($new_metadata);

            return [$new_metadata, $message];
        }

        return [null, $message];
    }

    public function buyHoroscope($horoscope_id, $langauge)
    {
        $message = "";
        $owned_horoscope_metadata = $this->kukudushi->getMetadataFromType("Horoscope");
        $horoscope = $this->captions_manager->getHoroscopeById($horoscope_id);

        if ($this->userPoints < ShopItemPrices::Horoscope)
        {
            $message .= 'You do not have enough points to buy the Kukudushi horoscope!';
        }
        else if ($horoscope == NULL)
        {
            $message .= 'The Horoscope you selected does not exist!';
        }
        else if ($langauge != "EN" && $langauge != "ES")
        {
            $message .= 'The selected language is not supported!';
        }
        else if (!empty($owned_horoscope_metadata))
        {
            $message .= 'You already own the kukudushi Gospel!';
        }
        else
        {
            $horoscope_name = $horoscope->name_EN;
            if ($horoscope->name_EN != $horoscope->name_ES)
            {
                $horoscope_name .= " - " . $horoscope->name_ES;
            }

            $description = "Bought Kukudushi Horoscope: " . $horoscope_name .", language: ". $langauge;
            $this->handlePoints(ShopItemPrices::Horoscope, $description);

            $message .= $description;

            $metadata = "horoscope_id=" . $horoscope_id . ";language=". $langauge .";";

            $new_metadata = new MetaData();
            $new_metadata->type_id = Kukudushi_type::Horoscope;
            $new_metadata->kukudushi_id = $this->kukudushi->id;
            $new_metadata->is_default = !$this->kukudushi->hasDefaultMetaData();
            $new_metadata->metadata = $metadata;
            $new_metadata = $this->metadata_manager->save($new_metadata);

            return [$new_metadata, $message];
        }

        return [null, $message];
    }

    public function buyWisdom()
    {
        $message = "";
        $owned_wisdom_metadata = $this->kukudushi->getMetadataFromType("Wisdom");

        if ($this->userPoints < ShopItemPrices::Wisdom) 
        {
            $message .= 'You do not have enough points to buy the Kukudushi Wisdom!';
        } 
        else if (!empty($owned_wisdom_metadata))
        {
            $message .= 'You already own the kukudushi Wisdom!';
        }
        else 
        {
            $description = 'Bought Kukudushi Wisdom!';
            $this->handlePoints(ShopItemPrices::Wisdom, $description);

            $message .= $description;

            $new_metadata = new MetaData();
            $new_metadata->type_id = Kukudushi_type::Wisdom;
            $new_metadata->kukudushi_id = $this->kukudushi->id;
            $new_metadata->is_default = !$this->kukudushi->hasDefaultMetaData();
            $new_metadata->metadata = "";
            $new_metadata = $this->metadata_manager->save($new_metadata);

            return [$new_metadata, $message];
        }

        return [null, $message];
    }

    public function buyPinkRibbon()
    {
        $message = "";
        $owned_pink_ribbon_metadata = $this->kukudushi->getMetadataFromType("Pink Ribbon");

        if ($this->userPoints < ShopItemPrices::PinkRibbon)
        {
            $message .= 'You do not have enough points to buy the Kukudushi Pink Ribbon!';
        }
        else if (!empty($owned_pink_ribbon_metadata))
        {
            $message .= 'You already own the kukudushi Pink Ribbon!';
        }
        else
        {
            $description = 'Bought Kukudushi Pink Ribbon!';
            $this->handlePoints(ShopItemPrices::PinkRibbon, $description);
            $message .= $description;

            $new_metadata = new MetaData();
            $new_metadata->type_id = Kukudushi_type::Pink_Ribbon;
            $new_metadata->kukudushi_id = $this->kukudushi->id;
            $new_metadata->is_default = !$this->kukudushi->hasDefaultMetaData();
            $new_metadata->metadata = "";
            $new_metadata = $this->metadata_manager->save($new_metadata);

            return [$new_metadata, $message];
        }

        return [null, $message];
    }

    public function buyCustomMedia($file)
    {
        $message = "";
        $owned_custom_media_metadata = $this->kukudushi->getMetadataFromType("Custom Media");

        $max_file_size = 30 * 1000 * 1000;
        $supported_file_types = "image, video ,audio";

        $upload_file_type_full = $file["type"];
        $upload_file_size = $file["size"];
        $upload_file_type = explode('/', $upload_file_type_full)[0];

        if ($this->userPoints < ShopItemPrices::CustomMedia) 
        {
            $message .= 'You do not have enough points to buy the Kukudushi Custom Media!';
        } 
        else if (!empty($owned_custom_media_metadata))
        {
            $message .= 'You already own the kukudushi Custom Media!';
        }
        else if (empty($file) || empty($file['name']) || empty($file['type']) || empty($file['size'])) 
        {
            $message .= "No file was provided or the file is missing required information.";
        }
        else if (intval($upload_file_size) >= $max_file_size)
        {
            $message .= "The file you're trying to upload exceeds the file size limit. The max supported file size is 30MB.";
        }

        else if (!str_contains($supported_file_types, $upload_file_type))
        {
            $message .= "The file type of the file you're trying to upload (". $upload_file_type . ") is not supported.. The supported file types are image, video and audio files.";
        }
        else 
        {
            $description = "Bought Kukudushi Custom Media!";
            $this->handlePoints(ShopItemPrices::CustomMedia, $description);
            $message .= $description;

            $new_metadata = $this->uploadFile($file);

            return [$new_metadata, $message];
        }

        return [null, $message];
    }

    public function changeCustomMedia($file)
    {
        $message = "";

        $max_file_size = 30 * 1000 * 1000;
        $supported_file_types = "image, video ,audio";

        $upload_file_type_full = $file["type"];
        $upload_file_size = $file["size"];
        $upload_file_type = explode('/', $upload_file_type_full)[0];

        if (intval($upload_file_size) >= $max_file_size)
        {
            $message .= "The file you're trying to upload exceeds the file size limit. The max supported file size is 30MB.";
        }

        else if (!str_contains($supported_file_types, $upload_file_type))
        {
            $message .= "The file type of the file you're trying to upload (". $upload_file_type . ") is not supported.. The supported file types are image, video and audio files.";
        }
        else 
        {
            $message .= "Media customisation completed!";

            $new_metadata = $this->uploadFile($file);

            return [$new_metadata, $message];
        }

        return [null, $message];
    }
    
    public function uploadFile($uploadedfile)
    {
        $guid_manager = GUID_Manager::Instance();

        //path to upload directory
        $upload_directory = $this->settings->_kukudushi_user_media_upload_dir_path . "/";
        $upload_directory_url = $this->settings->_kukudushi_user_media_upload_dir_url . "/";
        
        $upload_overrides = array('test_form' => false);
        
        $generated_filename = $guid_manager->getGUID();
        $file_extension = pathinfo($uploadedfile["name"], PATHINFO_EXTENSION);
        $file_name = $generated_filename . '.' . $file_extension;
        $target_file = $upload_directory . $generated_filename . '.' . $file_extension;

        $upload_file_type_full = $uploadedfile["type"];
        
        // Ensure directory exists
        if (!file_exists($upload_directory)) 
        {
            mkdir($upload_directory, 0777, true);
        }

        if (move_uploaded_file($uploadedfile['tmp_name'], $target_file))
        {
            $file_url = $upload_directory_url . $file_name;
            $metadata = $this->uploadSuccess($file_url, $upload_file_type_full);

            return $metadata;

        }
        else
        {
            return null;
        }
    }

    public function uploadSuccess($url, $fileType)
    {

        $new_link = new Media_Link();
        $new_link->is_active = true;
        $new_link->kukudushi_id = $this->kukudushi->id;
        $new_link->url = $url;
        $new_link->type = $fileType;

        $new_link = $this->media_links_manager->save_media_link($new_link);
        
        if (!empty($new_link)) 
        {
            //Check if existing metadata
            $new_metadata = $this->kukudushi->getMetadataFromType("Custom Media")[0] ?? NULL;
            $metadataParameter = "link_id=". $new_link->id .";";

            if ($new_metadata == NULL)
            {
                $new_metadata = new MetaData();
                $new_metadata->type_id = Kukudushi_type::Custom_Media;
                $new_metadata->kukudushi_id = $this->kukudushi->id;
                $new_metadata->is_default = !$this->kukudushi->hasDefaultMetaData();
            }
            
            $new_metadata->metadata = $metadataParameter;

            $this->metadata_manager->save($new_metadata);
            return $new_metadata;
        }
    }

    public function changeHoroscope($horoscope_id)
    {
        $message = ""; 
        $horoscope_metadata = $this->kukudushi->getMetadataFromType("Horoscope")[0] ?? NULL;

        $horoscope = $this->captions_manager->getHoroscopeById($horoscope_id);

        if ($horoscope == NULL)
        {
            $message .= 'The Horoscope you selected does not exist!';
        }
        else if ($horoscope_metadata == NULL)
        {
            $message .= 'You do not own the Horoscope functionality!';
        }
        else
        {
            $metadata = "horoscope_id=" . $horoscope_id . ";language=" . $horoscope_metadata->getValue(MetaData_Property::Language) . ";";

            $horoscope_metadata->metadata = $metadata;
            $this->metadata_manager->save($horoscope_metadata);

            return [$horoscope_metadata, $message];
        }
        
        return [null, $message];
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