<?php

require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_scan);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_caption);

generate_general_overview_of_last_week();

function generate_general_overview_of_last_week()
{
    $message = "";
    $scan_manager = Scan_Manager::Instance();
    $one_week_ago = new DateTime('now', new DateTimeZone('America/Curacao'));
    $date_today_string = $one_week_ago->format('Y-m-d');
    $one_week_ago->modify('-7 days');
    $date_one_week_ago_string = $one_week_ago->format('Y-m-d');
    $scans_of_today = $scan_manager->get_scans_between_dates($date_one_week_ago_string);
    $animal_info = get_active_animals_last_location_date(); //[$last_location, $animal]
    $captions = get_captions_last_location_date();

    $total_scans = count($scans_of_today);
    $total_unique_scans = getUniqueScanCount($scans_of_today);

    $message .= "Timeframe: $date_one_week_ago_string till $date_today_string";
    $message .= "Total scans of the past 7 days: " . strval($total_scans);
    $message .= "\n";
    $message .= "Total UNIQUE scans of the past 7 days: " . strval($total_unique_scans);
    $message .= "\n\n";

    $message .= "______________________________________________";
    $message .= "\n";
    $message .= "Active animals: ";
    $message .= "\n\n";

    foreach ($animal_info as $info)
    {
        [$last_location, $animal] = $info;
        $message .= "Animal: ". $animal->name;
        $message .= "\n";
        $message .= "Last location date: ". $last_location->dt_move;
        $message .= "\n";
        $message .= "----------------";
        $message .= "\n";
    }

    $message .= "\n";
    $message .= "______________________________________________";
    $message .= "\n";

    mail_overview_to_admins($message);

}


function get_active_animals_last_location_date()
{
    $animal_info = [];
    $animal_manager = Animal_Manager::Instance();
    $active_animals = $animal_manager->getAllActiveAnimals();

    $location_manager = Location_Manager::Instance();

    foreach ($active_animals as $animal)
    {
        $last_location = $location_manager->getCurrentLocation($animal, false);
        $animal_info[] = [$last_location, $animal];
    }

    return $animal_info;
}

function get_captions_last_location_date()
{
    $caption_info = [];
    $caption_manager = Caption_Manager::Instance();
    
    //Get gospel last date
    //Get horoscope last date

    return $caption_info;
}

function getUniqueScanCount($scans)
{
    // Count unique `kukudushi_id`
    $uniqueIds = [];
    foreach ($scans as $scan) 
    {
        $uniqueIds[$scan->kukudushi_id] = true;
    }
    $uniqueScanCount = count($uniqueIds); // Count the number of unique keys
    return $uniqueScanCount;
}


function mail_overview_to_admins($message)
{
    // specify multiple recipients
    $to = "n1ck1994@live.nl, james@bravio.nl, kukudushi@hotmail.com, patrick@kukudushi.com, laurens@kukudushi.com, richel@kukudushi.com";
    $subject = "Kukudushi Scan Report - Weekly";
    
    // send a mail
    mail($to, $subject, $message);
}
?>