<?php
if(!session_id()) 
{
    @session_start();
}

/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

$settings = Settings_Manager::Instance();
//$user_manager = User_Manager::Instance();
//sleep(1);
//$user = $user_manager->current_user;


// Check if admin
/*
if (!$user->is_admin())
{
    echo '<script>alert("Please login as an administrator!")</script>';
    sleep(2);
    header('Location: ' . $settings->_kukudushi_base_url);
    exit;
}
*/

$target_metadata = "animal_id=530;";
$allKukudushisOfType = DataBase::select("SELECT * FROM wp_kukudushi_item_metadata WHERE metadata = '". $target_metadata ."';");

foreach ($allKukudushisOfType as $item)
{
	$kukudushi_id = $item->kukudushi_id;
	//$new_metadata = "animal_id=18;";

	$message = "With regret we have to announce that the battery on turtle Elena''s tracking antenna is out of power. <br />Don''t worry, the animal is still in good health. <br />Our apologies for the inconvenience. <br />To make up for it, we have awarded you with: <br /><br /><b>1000 Kuku points</b><br /><br />You can adopt a new animal of your choosing in your Dashboard; <br /><br /><b>- Click the ''Dashboard'' Button on the -<br />- top right side of the screen -</b><br /><br />Enjoy, and thank you for caring!";
	$image = "https://kukudushi.com/kukudushi_custom/media/animal_pictures/530.webp";
	$active_date = "2024-04-16";
	$expiration_date = "2024-05-24";

	//Award points
	$sql = "INSERT INTO `wp_kukudushi_points`(`kukudushi_id`, `amount`, `description`) VALUES ('". $kukudushi_id ."', 1000, '1000 Kuku points awarded! <br />Compensation for Elena''s empty antenna battery. <br />Enjoy, and thank you for caring!');";
	echo htmlentities($sql);


	//get all kukudushis
	//$sql = "UPDATE wp_kukudushi_item_metadata SET metadata = '". $new_metadata ."' WHERE id = '". $item->id ."';";
	
	//echo $sql;

    echo "<br />";

	$createNotificationQuery = "INSERT INTO wp_kukudushi_notifications (kukudushi_id, message, image, active_date, expiration_date, is_active) VALUES ('". $kukudushi_id ."', '". $message ."', '". $image ."', '". $active_date ."', '". $expiration_date ."', 1);";

	echo htmlentities($createNotificationQuery);
	echo "<br /><br />";
}



?>