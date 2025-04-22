<?php
// Enable error reporting and logging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', dirname(__FILE__) . '/error_log.txt');

try {
    // Log script start
    error_log('Script started');

    require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
    $includes_manager = Includes_Manager::Instance();

    error_log('Includes manager loaded');

    $includes_manager->include_php_file(Include_php_file_type::db_database);

    error_log('db loaded');

    $includes_manager->include_php_file(Include_php_file_type::obj_type_geolocation);

    error_log('geolocation loaded');
} catch (Exception $e) {
    error_log($e->getMessage());
}

//load wordpress
//defined('WP_USE_THEMES') or define('WP_USE_THEMES', false);
//require_once(dirname(__FILE__, 5) .'/wp-load.php');
//error_log('WordPress loaded');

// Define API token
global $api_token;
$api_token = 'a63f4a192974b2';

function getGeolocation($ip) 
{
    global $api_token;
    $url = "https://ipinfo.io/{$ip}/json?token={$api_token}";
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    $result = curl_exec($curl);
    curl_close($curl);
    return json_decode($result, true);
}

function setGeolocationData($ip, $locationCache) 
{
    if (!isset($locationCache[$ip])) {
        return new Geolocation();
    }

    return new Geolocation($locationCache[$ip]);
}

$sql = "SELECT * FROM wp_kukudushi_item_scans";
$data = DataBase::select($sql);

if (empty($data)) {
    error_log("No results found");
    die("No results found");
}

$ips = array_unique(array_map(function($row) {
    return $row->ip;
}, $data));

error_log("Unique IPs: " . implode(", ", $ips));


$locationCache = [];
foreach ($ips as $ip) 
{
    $locationCache[$ip] = getGeolocation($ip);
}

foreach ($data as &$row) {
    $ip = $row->ip;
    $geolocation = setGeolocationData($ip, $locationCache);
    $row->geo_hostname = $geolocation->hostname;
    $row->geo_city = $geolocation->city;
    $row->geo_region = $geolocation->region;
    $row->geo_country = $geolocation->country;
    $row->geo_loc = $geolocation->loc;
    $row->geo_org = $geolocation->org;
    $row->geo_postal = $geolocation->postal;
    $row->geo_timezone = $geolocation->timezone;
}

$headers = array_keys((array)$data[0]);

$filename = dirname(__FILE__) . '/extended_data.csv';  // Change the path to where you want to save the file
$output = fopen($filename, 'w');
if ($output === false) {
    error_log('Failed to open output file');
    die('Failed to open output file');
}
fputcsv($output, $headers);

foreach ($data as $row) {
    fputcsv($output, (array)$row);
}

fclose($output);

echo "File saved successfully: $filename";
error_log("File saved successfully: $filename");