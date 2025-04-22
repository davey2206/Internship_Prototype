<?php
require_once(dirname(__FILE__, 2) . "/kukudushi_custom/kukudushi_settings.php");

$settings = Settings_Manager::Instance();
$user_manager = User_Manager::Instance();
$current_user = $user_manager->get_current_user();

// Check if admin
if (!$current_user->is_admin())
{
    echo '<script>alert("Please login as an administrator!")</script>';
    sleep(2);
	echo '<script type="text/javascript">window.location.href="' . $settings->_kukudushi_base_url . '";</script>';
    exit;
}

//get all kukudushis
$allTurtles = DataBase::select("SELECT * FROM wp_kukudushi_turtles");

foreach ($allTurtles as $turtle)
{

	//insert metadata
	//Add latest horoscopes
	$turtleLocationQuery = "INSERT INTO wp_kukudushi_animals (origin_type , ext_id , name, imageurl, species, description, is_active, last_refresh) VALUES ('1', '". $turtle->id ."', '". $turtle->name ."', '" . $turtle->imageurl . "', '" . $turtle->category . "', '" . $turtle->description . "', '" . $turtle->is_active . "', '" . $turtle->last_refresh . "');";

	echo $turtleLocationQuery;
	echo "<br />";
	//break;
}

//print_r($type_id);
//print_r("<br /><br />");

?>