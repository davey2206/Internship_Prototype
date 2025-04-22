<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
//set php timeout
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', '1800');
set_time_limit(1800);

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_refresh_locations_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_refresh_locations_animal2);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_refresh_locations_animal3);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_refresh_locations_turtle);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);

$logger = new Logger();

date_default_timezone_set('America/Curacao');

//Get Cron Job parameter
if (!isset($_GET) || !isset($_GET["all_animals"]))
{
    if (isset($argv) && isset($argv[1]))
    {
        $splitted = explode("=", $argv[1]);
        $_GET["all_animals"] = $splitted[1];
    }
}

//All animals or only active
$refresh_only_active = true;
if (isset($_GET["all_animals"]) && ($_GET["all_animals"] == true || $_GET["all_animals"] == 1))
{
    $refresh_only_active = false;
    $logger->debug("Start - Refreshing ALL animals");
}
else
{
    $logger->debug("Start - Refreshing Only animals that are ACTIVE");
}



$animal_manager = Animal_Manager::Instance();
$location_manager = Location_Manager::Instance();

$all_animals = $animal_manager->getAllAnimals($refresh_only_active);

foreach ($all_animals as $animal)
{    
    //Check if latest check > 6 hours ago
	$dateTimeNow = new DateTime();
	$dateTimeSixHoursAgo = $dateTimeNow->modify("-6 hours")->format("Y-m-d H:i:s");
	$dateTimelastRefresh = $animal->last_refresh;
    $currentLocation = null;

    //Check if need to check animal
    if (strtotime($dateTimelastRefresh) >= strtotime($dateTimeSixHoursAgo))
    {
        continue;
    }

    $logger->debug($animal->name . " - Start Refreshing, last refresh check > 6 hours ago.");

    // Get latest locations from scraping scripts
    if ($animal->ext_active)
    {
        $logger->debug($animal->name . " - is ext_active, scraping for new locations");

        if ($animal->origin_type == 1)
        {
            $logger->debug($animal->name . " - origin_type = 1.");
            refresh_locations_turtle($animal);
        }
        else if ($animal->origin_type == 2)
        {
            $logger->debug($animal->name . " - origin_type = 2.");
            refresh_locations_animal($animal);
        }
        else if ($animal->origin_type == 3)
        {
            /*
            $logger->debug($animal->name . " - origin_type = 3.");
            refresh_locations_animal2($animal);
            */
        }
        else if ($animal->origin_type == 4)
        {
            $logger->debug($animal->name . " - origin_type = 4.");
            refresh_locations_animal3($animal);
        }

        $currentLocation = $location_manager->getCurrentLocation($animal);

        // Check if animal will still get new locations, otherwise set ext_active = 0
        checkIfExtActive($animal, $currentLocation);
    }
    else
    {
        $currentLocation = $location_manager->getCurrentLocation($animal);
        $logger->debug($animal->name . " - is not ext_active");
    }

    

    

    // If animal is not active, skip
    if ($animal->is_active == null || $animal->is_active == 0 || $animal->is_active == false)
    {
        $logger->debug($animal->name . " - is not active, so no further actions required.");
        continue;
    }
    
    if (empty($currentLocation))
    {
        $logger->error($animal->name . " HAS NO LOCATIONS, CHECK WHY NOT..");
        //Handle error
        continue;
    }

    if ($animal->track_step > 0) // Add new location to custom track animal if needed, or handle if last location is reached
    {
        $custom_track_current_Location = $location_manager->getCurrentLocation($animal, true);

        $logger->debug($animal->name . " has a CUSTOM TRACK");
        $today = date("Y-m-d");
        $today_date = new DateTime($today);

        $dateLastLocation = $custom_track_current_Location->dt_move;
        $Refresh_needed_date = new DateTime($dateLastLocation);

        $days_between = $animal->track_step_interval;
        
        // Add $days_between days to $lastRefresh_dt
        $Refresh_needed_date->add(new DateInterval('P' . $days_between . 'D'));
        
        // Check if $today_dt is the same date or later than $lastRefresh_dt
        if ($today_date >= $Refresh_needed_date) 
        {
            $logger->debug($animal->name . " track needs a next location. Incrementing track_step.");
            $success = $location_manager->SetNextLocationOnTrack($animal);

            if (!$success)
            {
                //Last location step reached, notify by mail
                sendMail($animal, null);
            }
        }
        else
        {
            $logger->debug($animal->name . " track DOES NOT need a next location yet..");
        }

        //Update animal's last_refresh
        $animal_manager->setLastRefreshToNow($animal->id);
    }
    else // Check and notify if "real-time" animals are inactive
    {
        $logger->debug($animal->name . " Checking if animal has become inactive..");
        $lastLocationDate = new DateTime($currentLocation->dt_move);
        $dateFiveDaysAgo = new DateTime();
        $dateFiveDaysAgo->sub(new DateInterval('P5D')); // Subtract 5 days

        // If last position is older than 5 days
        if ($lastLocationDate < $dateFiveDaysAgo) 
        {
            $logger->debug($animal->name . " animal has become inactive. Replace it with another one..");
            sendMail($animal, $currentLocation->dt_move);
        }
        else
        {
            $logger->debug($animal->name . " still active, no action required.");
        }
    }
}

function checkIfExtActive($animal, $currentLocation)
{
    $animal_manager = Animal_Manager::Instance();
    $logger = new Logger();
    $lastLocationDate = new DateTime($currentLocation->dt_move);
    $dateFiftyDaysAgo = new DateTime();
    $dateFiftyDaysAgo->sub(new DateInterval('P50D')); // Subtract 50 days

    // If last location date is earlier than date 50 days ago, set ext_active to false
    if ($lastLocationDate <= $dateFiftyDaysAgo) 
    {
        $animal_manager->setExtActive($animal->id, false);
        $logger->debug($animal->name . " - is not ext_active anymore, so setting ext_active to false.");
    }
}

function sendMail($animal, $latest_location_date)
{
    // specify multiple recipients
    $to = "n1ck1994@live.nl"; //kukudushi@hotmail.com Multiple mails like this: "n1ck1994@live.nl, admin@kukudushi.com"
    $subject = "Animal information outdated!";
    $base_message = "Environment: ". basename(dirname(__FILE__, 3)) .".\n\nOur animal " . $animal->name . ", with animal_id '" . $animal->id . "' ";

    if ($animal->track_step == 0)
    {
        $message = $base_message . "hasn't had a new location update for 5+ days (" . $latest_location_date . ").. Is this animal inactive?";
    }
    else
    {
       $message = $base_message . "has reached it's last location step.. Therefore this animal has no new locations left, so it should be marked as inactive.?";
    }

    //TEMPORARY, REMOVE AFTER BUG FIXED
    $message .= "\n\nAnimal:\n\n" . serialize($animal);

    // To send HTML mail, the Content-type header must be set
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-type: text/html; charset=iso-8859-1';

    // Additional headers
    //$headers[] = 'To: Nick <mary@example.com>, Patrick <kelly@example.com>';
    //$headers[] = 'From: Kukudushi auto scripts <info@kukudushi.com>';

    // send a mail
    mail($to, $subject, $message, implode("\r\n", $headers));
}

?>