<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

function validateDate($date, $format = 'Y-m-d')
{
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

$settings = Settings_Manager::Instance();

// Table names
$table_name = "wp_kukudushi_animals";
$species_table_name = "wp_kukudushi_animals_species";

## Read value
$draw = $_POST['draw'];
$row = intval($_POST['start']);
$rowperpage = intval($_POST['length']);
$columnIndex = $_POST['order'][0]['column'];
$columnName = $_POST['columns'][$columnIndex]['data'];
$columnSortOrder = $_POST['order'][0]['dir'];
$searchValue = $_POST['search']['value'];

$totalRecordsQuery = "SELECT COUNT(*) AS allcount FROM `$table_name`";
$records = DataBase::select($totalRecordsQuery);
$totalRecords = $records[0]->allcount;

$searchQuery = "";
if($searchValue != '')
{
   $searchQuery = " AND (a.id LIKE %s OR a.name LIKE %s OR s.species_name LIKE %s OR a.description LIKE %s)";
   $searchValueWildcard = '%' . $searchValue . '%';
   $records = DataBase::select("SELECT COUNT(*) AS allcount FROM `$table_name` a LEFT JOIN `$species_table_name` s ON a.species = s.id WHERE 1 " . $searchQuery, 
                               [$searchValueWildcard, $searchValueWildcard, $searchValueWildcard, $searchValueWildcard]);
} 
else 
{
   $records = DataBase::select("SELECT COUNT(*) AS allcount FROM `$table_name` a LEFT JOIN `$species_table_name` s ON a.species = s.id");
}
$totalRecordwithFilter = $records[0]->allcount;

## Fetch records
$animalsQuery = "SELECT a.*, s.species_name FROM `$table_name` a LEFT JOIN `$species_table_name` s ON a.species = s.id WHERE 1 $searchQuery ORDER BY `$columnName` $columnSortOrder LIMIT %d, %d";
if($searchValue != '')
{
    $animalRecords = DataBase::select($animalsQuery, 
                                    [$searchValueWildcard, $searchValueWildcard, $searchValueWildcard, $searchValueWildcard, $row, $rowperpage]);
} 
else 
{
    $animalRecords = DataBase::select($animalsQuery, 
                                    [$row, $rowperpage]);
}

$data = array();
foreach ($animalRecords as $row) 
{
   //Get animal image url
   $image_url = $settings->_kukudushi_animal_pictures_dir_url ."/". $row->id .".webp";
   $image_path = $settings->_kukudushi_animal_pictures_dir_path ."/". $row->id .".webp";
   if (!file_exists($image_path)) 
   {
      $image_url = $settings->_kukudushi_custom_media_dir_url . "/no-image.png";
   }

   $description = stripslashes($row->description);
   if (strlen($description) > 650)
   {
      $description = substr($description, 0, 645) . " ....";
   }

   $data[] = array( 
      "id" => $row->id,
      "ext_id" => $row->ext_id,
      "name" => $row->name,
      "imageurl" => $image_url,
      "species" => $row->species_name, // Changed to species_name
      "description" => $description,
      "is_active" => $row->is_active,
      "last_refresh" => $row->last_refresh,
   );
}

## Response
$response = array(
  "draw" => intval($draw),
  "iTotalRecords" => $totalRecords,
  "iTotalDisplayRecords" => $totalRecordwithFilter,
  "aaData" => $data
);

echo json_encode($response);
?>