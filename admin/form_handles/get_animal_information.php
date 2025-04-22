<?php  
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

$settings = Settings_Manager::Instance();

$table_name = "wp_kukudushi_animals";
$species_table_name = "wp_kukudushi_animals_species"; // Species table name

// Fetch all species names
$speciesQuery = "SELECT species_name FROM `$species_table_name` ORDER BY species_name";
$speciesQuery = "SELECT id, species_name FROM `$species_table_name` ORDER BY species_name";
$speciesList = DataBase::select($speciesQuery);
$all_species = array_map(function($item) {
    return [
        'id' => $item->id,
        'name' => $item->species_name
    ];
}, $speciesList);

if(isset($_POST["animal_id"]))  
{  
    $animal_id = intval($_POST["animal_id"]);

    //$sql = "SELECT a.*, s.species_name FROM `$table_name` a LEFT JOIN `$species_table_name` s ON a.species = s.id WHERE a.id = %d";
    $sql = "SELECT * FROM `$table_name` WHERE id = %d";

    $data = [$animal_id];

    $animal_record = DataBase::select($sql, $data);
                                    
    if (!empty($animal_record)) 
    {
        //Get animal image url
        $image_url = $settings->_kukudushi_animal_pictures_dir_url ."/". $animal_record[0]->id .".webp";
        $image_path = $settings->_kukudushi_animal_pictures_dir_path ."/". $animal_record[0]->id .".webp";
        if (!file_exists($image_path)) 
        {
            $image_url = $settings->_kukudushi_custom_media_dir_url . "/no-image.png";
        }

        $gender = "Empty";
        if (!empty($animal_record[0]->gender))
        {
            $gender = $animal_record[0]->gender;
        }

        $output = [
            "id" => $animal_record[0]->id,
            "ext_id" => $animal_record[0]->ext_id,
            "name" => $animal_record[0]->name,
            "imageurl" => $image_url,
            "species" => $animal_record[0]->species, // Display species_name
            "gender" => $gender,
            "weight" => $animal_record[0]->weight,
            "length" => $animal_record[0]->length,
            "life_stage" => $animal_record[0]->life_stage,
            "description" => stripslashes($animal_record[0]->description),
            "is_active" => $animal_record[0]->is_active,
            "last_refresh" => $animal_record[0]->last_refresh,
            "all_species" => $all_species // Added all_species to output
        ];
        echo json_encode($output);  
    } 
    else 
    {
        echo json_encode(['error' => 'No record found or an error occurred']);
    }
}  
?>
