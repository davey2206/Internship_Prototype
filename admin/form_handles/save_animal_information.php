<?php  
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

$settings = Settings_Manager::Instance();
$animal_manager = Animal_Manager::Instance();
$location_manager = Location_Manager::Instance();

if (!empty($_POST))  
{  
    $errorMSG = '';
    $animal_id = intval($_POST["animal_id"]);
    $name = !empty($_POST["name"]) ? trim($_POST["name"]) : "";
    $species = !empty($_POST["species"]) ? intval($_POST["species"]) : 0;
    $gender = !empty($_POST["gender"]) ? $_POST["gender"] : "";
    $weight = !empty($_POST["weight"]) ? $_POST["weight"] : "";
    $length = !empty($_POST["length"]) ? $_POST["length"] : "";
    $life_stage = !empty($_POST["life_stage"]) ? intval($_POST["life_stage"]) : 0;

    $restart_track = !empty($_POST["restart_track"]) ? ($_POST["restart_track"] === "true" ? true : false) : false;
    $start_steps = !empty($_POST["start_steps"]) ? intval($_POST["start_steps"]) : 0;
    $steps_interval = !empty($_POST["steps_interval"]) ? intval($_POST["steps_interval"]) : 0;

    $description = !empty($_POST["description"]) ? trim($_POST["description"]) : "";
    $response_uploaded_image_url = "";
    $already_in_webp_format = false;

    $active = 0;

    $animal = $animal_manager->getAnimalById($animal_id);

    if (!$animal->exists())
    {
        $errorMSG .= "<li>The animal does not exist..</li>";
    }
    else if (empty($name))
    {
        $errorMSG .= "<li>The name cannot be empty..</li>";
    }


    //Exit if error
    if (strlen($errorMSG) > 0)
    {
        $response = ['code' => 404, 'message' => $errorMSG];
        echo json_encode($response);
        exit();
    }


    if (isset($_POST['is_active'])) 
    {
        $isActiveRaw = $_POST['is_active'];
        $isActive = strtolower($isActiveRaw) === 'true';
    
        if ($isActive) 
        {
            $active = 1;
        }
    } 

    // Handle the file upload
    if (isset($_FILES['animal_image_upload']) && $_FILES['animal_image_upload']['error'] == 0) 
    {
        $uploadDir = $settings->_kukudushi_animal_pictures_dir_path . "/";
        $replacedDir = $uploadDir . "/replaced_animal_images/";

        $fileName = $animal_id;
        $fileNameFull = $fileName . '.webp';
        $filePath = $uploadDir . $fileNameFull;  // Target file path with .webp extension


        // Check if upload directory exists, if not create it
        if (!file_exists($uploadDir)) 
        {
            mkdir($uploadDir, 0755, true);  // Create the directory if it does not exist
        }
        // Check if replaced directory exists, if not create it
        if (!file_exists($replacedDir)) 
        {
            mkdir($replacedDir, 0755, true);  // Create the directory if it does not exist
        }

        // Check if target file exists and move it if it does
        if (file_exists($filePath)) 
        {
            $newLocation = $replacedDir . $fileName . '_' . time() .'.webp';
            if (!rename($filePath, $newLocation)) 
            {
                $errorMSG .= "<li>Failed to move existing file.</li>";
            }
        }

        // Check if GD Library is available for image processing
        if (extension_loaded('gd')) 
        {
            $imageType = exif_imagetype($_FILES['animal_image_upload']['tmp_name']);
            switch ($imageType) 
            {
                case IMAGETYPE_JPEG:
                    $image = imagecreatefromjpeg($_FILES['animal_image_upload']['tmp_name']);
                    break;
                case IMAGETYPE_PNG:
                    $image = imagecreatefrompng($_FILES['animal_image_upload']['tmp_name']);
                    break;
                case IMAGETYPE_GIF:
                    $image = imagecreatefromgif($_FILES['animal_image_upload']['tmp_name']);
                    break;
                case IMAGETYPE_WEBP:
                    // If already WebP, simply move the file to the destination
                    if (!move_uploaded_file($_FILES['animal_image_upload']['tmp_name'], $filePath)) 
                    {
                        $errorMSG .= "<li>Failed to move WebP image to the destination.</li>";
                    } 
                    else 
                    {
                        $already_in_webp_format = true;
                        $response_uploaded_image_url = $settings->_kukudushi_animal_pictures_dir_url ."/" .$fileNameFull;
                    }
                    break;
                default:
                    $errorMSG .= "<li>Unsupported image type.</li>";
                    echo $errorMSG;
                    return;
            }
            
            // Convert to WebP and save
            if (isset($image) && imagewebp($image, $filePath)) 
            {
                imagedestroy($image);  // Free up memory
                $response_uploaded_image_url = $settings->_kukudushi_animal_pictures_dir_url ."/" .$fileNameFull;
            } 
            else if ($already_in_webp_format == false)
            {
                $errorMSG .= "<li>Failed to convert image to WebP.</li>";
            }
        } 
        else 
        {
            $errorMSG .= "<li>GD Library is not available.</li>";
        }
    }
    else if (isset($_FILES['animal_image_upload']['error']))
    {
        $errorMSG .= "<li>An error occured: " . $_FILES['animal_image_upload']['error'] . "</li>";
    }

    //Exit if error
    if (strlen($errorMSG) > 0)
    {
        $response = ['code' => 404, 'message' => $errorMSG];
        echo json_encode($response);
        exit();
    }
    
    $animal->name = $name;
    $animal->species = $species;
    $animal->gender = $gender;
    $animal->weight = $weight;
    $animal->length = $length;
    $animal->life_stage = $life_stage;
    $animal->description = $description;
    $animal->active = $active;
    
    $success = $animal_manager->save_animal_information($animal);

    if ($success == true && $restart_track == true && $start_steps > 0 && $steps_interval > 0)
    {
        $animal_manager->restartAnimalTrack($animal->id, $start_steps, $steps_interval);
        $location_manager->restartAnimalTrack($animal->id, $start_steps, $steps_interval);
    }

    $response = [];
    
    if (!empty($response_uploaded_image_url))
    {
        $response['new_image_url'] = $response_uploaded_image_url;
    }

    $response['code'] = 200;
    $response['message'] = "Information for Animal: ". $animal->name ." has been saved succesfully!";
    echo json_encode($response);
}  
?>