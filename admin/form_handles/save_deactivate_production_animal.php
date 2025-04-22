<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_metadata);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_notification);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_points);
	
$errorMSG = "";

global $animal_manager;
$animal_manager = Animal_Manager::Instance();

global $kukudushi_manager;
$kukudushi_manager = MetaData_Manager::Instance();

if (!empty($_POST["old_animal_selection"]) && !empty($_POST["operation_type_selection"]))
{
    //Mandatory parameters
    $old_animal_id = !empty($_POST["old_animal_selection"]) ? intval($_POST["old_animal_selection"]) : 0;
    $type_of_operation = !empty($_POST["operation_type_selection"]) ? intval($_POST["operation_type_selection"]) : 0;

    //Optional parameters
    $new_animal_id = !empty($_POST["new_animal_selection"]) ? intval($_POST["new_animal_selection"]) : 0;
    $points_amount = !empty($_POST["points_amount"]) ? intval($_POST["points_amount"]) : 0;
    $notification_message = !empty($_POST["notification_message"]) ? trim($_POST["notification_message"]) : "";

    //get animal(s)
    $old_animal = $animal_manager->getAnimalById($old_animal_id);
    $new_animal = null;

    if (empty($old_animal_id) || $old_animal_id < 1)
    {
        $errorMSG .= "<li>The animal you wish to deactivate has an invalid id..</li>";
    }

    if (!empty($new_animal_id) && $new_animal_id > 0)
    {
        $new_animal = $animal_manager->getAnimalById($new_animal_id);
    }

    if (!$old_animal->exists())
    {
        $errorMSG .= "<li>The animal (first) you have selected to change does not exist..</li>";
    }
    else if ($type_of_operation < 1 || $type_of_operation > 3)
    {
        $errorMSG .= "<li>Operation type should be an integer value from 1 to 3...</li>";
    }

    /*
    if (empty($notification_message))
    {
        $errorMSG .= "<li>Notification text cannot be empty!</li>";
    }
    */

    //Exit if error
    if (strlen($errorMSG) > 0)
    {
        $response = ['code' => 404, 'message' => $errorMSG];
        echo json_encode($response);
        exit();
    }

    
    
    //Check which operation
    switch ($type_of_operation)
    {
        case 1: //Deactivate
            execute_operation_deactivate_animal_only($old_animal, $notification_message);
            break;
        case 2: //Deactivate + Points
            execute_operation_deactivate_animal_award_points($old_animal, $points_amount, $notification_message);
            break;
        case 3: //Deactivate + Replace
            execute_operation_deactivate_animal_replace_animal($old_animal, $new_animal, $notification_message);
            break;
    }
    


    //$msg = "Animal: ". $old_animal->name ." succesfully replaced by new Animal: ". $new_animal->name ."!";
    //echo json_encode(['code' => 200, 'message' => $msg]);
    exit;
}

function execute_operation_deactivate_animal_only($animal, $notification_message = "")
{
    $notification_manager = new Notification_Manager();
    $relevant_metadata = get_relevant_metadata($animal->id);

    $affected_kukudushis = [];

    foreach ($relevant_metadata as $metadata)
    {
        // Check if kukudushi already affected
        if (in_array($metadata->kukudushi_id, $affected_kukudushis)) 
        {
            continue;
        }

        //Send notification
        $message = $notification_message;
        $default_message = "With regret we have to announce that the battery on your animal ". $animal->name ."'s tracking antenna is out of power. <br /><br />Don't worry, your animal is still in good health. <br />Our apologies for the inconvenience.";
        if (empty($notification_message))
        {
            $message = $default_message;
        }
        $notification_manager->insertNewNotification($metadata->kukudushi_id, $message, "", 0, 60);

        // Mark kukudushi as affected
        $affected_kukudushis[] = $metadata->kukudushi_id;
    }

    //Deactivate old animal
    global $animal_manager;
    $animal_manager->setActive($animal->id, false);

    $msg = "Animal: ". $animal->name ." has been set to inactive succesfully! Also a notification has been sent. <br>Kukudushi's affected: " . count($affected_kukudushis) . ".";
    echo json_encode(['code' => 200, 'message' => $msg]);
}

function execute_operation_deactivate_animal_award_points($animal, $points_amount, $notification_message = "")
{
    $notification_manager = new Notification_Manager();
    $points_manager = Points_Manager::Instance();
    $relevant_metadata = get_relevant_metadata($animal->id);

    $affected_kukudushis = [];

    foreach ($relevant_metadata as $metadata)
    {
        // Check if kukudushi already affected
        if (in_array($metadata->kukudushi_id, $affected_kukudushis)) 
        {
            continue;
        }

        //Send notification
        $message = $notification_message;
        $default_message = "With regret we have to announce that the battery on your animal ". $animal->name ."'s tracking antenna is out of power. <br />Don't worry, your animal is still in good health. <br />Our apologies for the inconvenience. <br />To make up for it, we have awarded you with: <br /><br /><b>". $points_amount ." Kuku points</b><br /><br />You can adopt a new animal of your choosing in your Dashboard; <br /><br /><b>- Click the 'Dashboard' Button on the -<br />- top right side of the screen -</b><br /><br />Enjoy, and thank you for caring!";
        if (empty($notification_message))
        {
            $message = $default_message;
        }
        $notification_manager->insertNewNotification($metadata->kukudushi_id, $message, "", 0, 60);

        //Award points
        $description = strval($points_amount) . " Kuku points awarded! <br />Compensation for ". $animal->name ."''s empty antenna battery. <br />Enjoy, and thank you for caring!";
        $points_manager->give_points_amount($metadata->kukudushi_id, $description, $points_amount);

        // Mark kukudushi as affected
        $affected_kukudushis[] = $metadata->kukudushi_id;
    }

    //Deactivate old animal
    global $animal_manager;
    $animal_manager->setActive($animal->id, false);

    $msg = "Animal: ". $animal->name ." has been set to inactive succesfully! Also ". strval($points_amount) ." Kuku points AND a notification have been sent. <br>Kukudushi's affected: " . count($affected_kukudushis) . ".";
    echo json_encode(['code' => 200, 'message' => $msg]);
}

function execute_operation_deactivate_animal_replace_animal($old_animal, $new_animal, $notification_message = "")
{
    $notification_manager = new Notification_Manager();
    $points_manager = Points_Manager::Instance();
    $relevant_metadata = get_relevant_metadata($old_animal->id);

    $affected_kukudushis = [];

    foreach ($relevant_metadata as $metadata)
    {
        // Check if kukudushi already affected
        if (in_array($metadata->kukudushi_id, $affected_kukudushis)) 
        {
            continue;
        }

        //Send notification
        $message = $notification_message;
        $default_message = "With regret we have to announce that the battery on your animal ". $old_animal->name ."'s tracking antenna is out of power. <br />Don't worry, your animal is still in good health. <br />Our apologies for the inconvenience. <br />To make up for it, we have replaced your animal with: <br /><br /><b>". $new_animal->name ."</b><br /><br />Enjoy, and thank you for caring!";
        if (empty($notification_message))
        {
            $message = $default_message;
        }
        $notification_manager->insertNewNotification($metadata->kukudushi_id, $message, "", 0, 60);

        //Change animal in metadata
        global $kukudushi_manager;
        $new_metadata = $metadata;
        $new_metadata->metadata = "animal_id=". $new_animal->id .";";
        $kukudushi_manager->save($new_metadata);

        // Mark kukudushi as affected
        $affected_kukudushis[] = $metadata->kukudushi_id;
    }

    //Deactivate old animal & activate new animal
    global $animal_manager;
    $animal_manager->setActive($old_animal->id, false);
    $animal_manager->setActive($new_animal->id, true);

    $msg = "Animal: ". $old_animal->name ." has been succesfully replaced by Animal: ". $new_animal->name .", and a notification has been sent! <br>Kukudushi's affected: " . count($affected_kukudushis) . ".";
    echo json_encode(['code' => 200, 'message' => $msg]);
}

function get_relevant_metadata($old_animal_id)
{
    global $kukudushi_manager;
    return $kukudushi_manager->getAllMetadataWithAnimalId($old_animal_id);
}
?>