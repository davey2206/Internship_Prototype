<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
//load wordpress
define('WP_USE_THEMES', false);
require_once(dirname(__FILE__, 5) . '/wp-load.php');

require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

if (!function_exists('wp_handle_upload'))
{
    require_once(dirname(__FILE__, 3) .'/wp-admin/includes/file.php');
}

require_once ($_SERVER["HOME"] .'/vendor/autoload.php');
use PhpOffice\PhpSpreadsheet\IOFactory;

$errorMSG = "";
$max_file_size = 100 * 1000 * 1000; //100 MB
$supported_file_types_keywords = ["sheet", "office"];
//path to upload directory
$animal_pictures_dir = '/media/excel_files/';
$custom_upload_path = dirname(__FILE__, 3) . $animal_pictures_dir;
//get upload directory url
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'];
$baseUrl = $protocol . $domainName;
$custom_upload_url = $baseUrl . $animal_pictures_dir;

if (isset($_FILES) && isset($_POST["type_selection"]) )
{
    $file = $_FILES["file"];
    $upload_file_type_full = $file["type"];
    $upload_file_size = $file["size"];
    //$upload_file_type = explode('/', $upload_file_type_full)[0];

    if (intval($upload_file_size) >= $max_file_size)
    {
        $errorMSG .= "<li>The file you're trying to upload exceeds the file size limit. The max supported file size is 30MB.</li>";
    }

    
    if (!str_contains($upload_file_type_full, $supported_file_types_keywords[0]) || !str_contains($upload_file_type_full, $supported_file_types_keywords[1]))
    {
        $errorMSG .= "<li>The file type of the file you're trying to upload (". $upload_file_type_full . ") is not supported.. The supported file types are .xls and .xlsx files.</li>";
    }
    

    if (empty($errorMSG))
    {
        $uploadedfile = $file;
        $upload_overrides = array('test_form' => false);
        $target_file = $custom_upload_path . basename($uploadedfile["name"]);

        // Ensure directory exists
        if (!file_exists($custom_upload_path)) 
        {
            mkdir($custom_upload_path, 0777, true);
        }
        
        if (move_uploaded_file($uploadedfile['tmp_name'], $target_file))
        {
            $file_url = $custom_upload_url . basename($_FILES['fileToUpload']['name']);

            uploadSuccess($target_file, $file_url,  $_POST["type_selection"], $_POST["animal_selection"]);

            $msg = "File uploaded succesfully!";
            echo json_encode(['code' => 200, 'message' => $msg, 'url' => $movefile['url']]);
            exit;

        }
        else
        {
            $errorMSG = "File upload failed...\n";
            echo json_encode(['code' => 404, 'message' => $errorMSG]);
            exit;
        }


    }
    else
    {
        echo json_encode(['code' => 404, 'message' => $errorMSG]);
        exit;
    }
}

function uploadSuccess($file_path, $file_url, $type, $animal_id)
{
    $path = $file_path;
    $url = $file_url;
    $uid_array = getDataFromExcel($path);
    $metadataParameter = "";

    $errorMSG = "";

    if (kukudushiUidExists($uid_array[0]) || kukudushiUidExists($uid_array[count($uid_array) - 1]))
    {
        $errorMSG .= "<li>The Kukudushi UID's in this excel sheet already exist in the Database.. Have you already imported this file?</li>";
    }

    foreach ($uid_array as $uid)
    {
        if (strlen($uid) != 14)
        {
            $errorMSG .= "<li>The Kukudushi UID: '". $uid ."' doesn't have 14 characters.. Invalid Id?</li>";
        }
        else if (!preg_match('/^[\w]+$/',$uid))
        {
            $errorMSG .= "<li>The Kukudushi UID: '". $uid ."' is invalid. UID's can only contain letters (both capital and non capital) and numbers!</li>";
        }
    }

    if (!empty($errorMSG))
    {
        //delete file
        if (file_exists($path)) 
        {
            unlink($path);
        }
        echo json_encode(['code' => 404, 'message' => $errorMSG]);
        exit;
    }

    if (!empty($animal_id))
    {
        if ($type == 19 && $animal_id > 0)
        {
            $metadataParameter = "animal_id=" . $animal_id . ";";
        }
        else if ($type == 27 || $type == 29)
        {
            $metadataParameter = "animal_id=43;";
        }
    }
    
    $data = array(
        'path' => $path,
        'url' => $url,
        'type' => $type,
    );
    
    $format = array('%s', '%s', '%d');
    
    $excelFileRecord = DataBase::insert('wp_kukudushi_processed_excel', $data, $format);
    
    if ($excelFileRecord != NULL && is_int($excelFileRecord) && $excelFileRecord > 0) 
    {

        foreach ($uid_array as $new_uid)
        {
            $data = array(
                'kukudushi_id' => $new_uid,
                'type_id' => $type,
                'excel_id' => $excelFileRecord
            );
            $format = array('%s', '%d', '%d');
            $inserted_id = DataBase::insert('wp_kukudushi_items', $data, $format);


            $data = array(
                'kukudushi_id' => $new_uid,
                'type' => $type,
                'metadata' => $metadataParameter,
                'is_default' => 1
            );
            $format = array('%s', '%d', '%s', '%d');
            $inserted_id = DataBase::insert('wp_kukudushi_item_metadata', $data, $format);
            
        }
    }
}

function kukudushiUidExists($kukudushi_id)
{

    $result = DataBase::select(("SELECT * FROM `wp_kukudushi_items` WHERE `kukudushi_id` = %s"),
                strval($kukudushi_id)
            );

    if (!empty($result)) 
    {
        return true;
    }
    return false;
}

function getDataFromExcel($filePath)
{
	//$inputFileName = __DIR__ . '/230905 certificaatjes.xlsx';
	$inputFileName = $filePath;
	$spreadsheet = IOFactory::load($inputFileName);
    $kukudushi_uid_array = [];
    
	for ($x = 1; $x <= 100000; $x++) 
	{
		$value = $spreadsheet->getActiveSheet()->getCell('A' . strval($x));
		
		if (!empty($value) && strlen($value) > 0 && $value != "")
		{
			array_push($kukudushi_uid_array, $value);
		}
        else
        {
            break;
        }
	}

    return $kukudushi_uid_array;
}
?>