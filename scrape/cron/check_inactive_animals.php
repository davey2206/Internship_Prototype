<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

$active_animals = DataBase::select("SELECT * FROM wp_kukudushi_animals WHERE is_active = 1 ORDER BY species ASC, name ASC;");

foreach ($active_animals as $animal)
{
    $latest_location = DataBase::select("SELECT * FROM `wp_kukudushi_animals_locations` WHERE `ext_id` = " . $animal->id . " ORDER BY `dt_move` DESC LIMIT 1");

    $time1 = strtotime($latest_location[0]->dt_move);
    $time2 = strtotime(date("Y-m-d", strtotime("-5 day")));

    if ($time1 < $time2)
    {
        //Last position is older than 5 days
        sendMail($animal, $latest_location[0]->dt_move);
    }
    else
    {
        //Last position is NOT older than 5 days
    }

}

function sendMail($animal, $latest_location_date)
{
    // specify multiple recipients
    $to = "n1ck1994@live.nl, kukudushi@hotmail.com";
    $subject = "Animal information outdated!";
    $message = "Our animal ". $animal->name .", with animal_id '". $animal->id ."' hasn't had a new location update for at least 5 days (". $latest_location_date .").. Is this animal inactive?";

    // send a mail
    mail($to, $subject, $message);
}
?>