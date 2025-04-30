<?php

require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_scan);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

generate_general_overview_of_last_month();

function generate_general_overview_of_last_month()
{
    // Get the current date and time
    $currentDate = new DateTime();

    // Add one day to get tomorrow's date
    $tomorrowDate = $currentDate->modify('+1 day');

    // Check if the day part of tomorrow's date is 1
    if ($tomorrowDate->format('j') != '1') 
    {
        exit;
    }

    $message = "";
    $scan_manager = Scan_Manager::Instance();
    $now = new DateTime('now', new DateTimeZone('America/Curacao'));
    $date_today = $now->format('Y-m-d');
    $now->modify('first day of this month');
    $date_first_day_of_month = $now->format('Y-m-d');
    $scans_of_today = $scan_manager->get_scans_between_dates($date_first_day_of_month);
    $animal_info = get_active_animals_last_location_date(); //[$last_location, $animal]

    $total_scans = count($scans_of_today);
    $total_unique_scans = getUniqueScanCount($scans_of_today);

    $message .= "Timeframe: $date_first_day_of_month till $date_today";
    $message .= "Total scans of this month: " . strval($total_scans);
    $message .= "\n";
    $message .= "Total UNIQUE scans of this month: " . strval($total_unique_scans);
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
    $subject = "Kukudushi Scan Report - Monthly";
    
    // send a mail
    mail($to, $subject, $message);
}
?>