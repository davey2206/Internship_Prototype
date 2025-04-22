<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_location);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);

function refresh_locations_animal($animal)
{
    $dom = new DomDocument();
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = true;
    libxml_use_internal_errors(true);
    $dom->loadHTML(getPageContentsWithProxy($animal->ext_site));

    $scripts = $dom->getElementsByTagName('script');
    $output = $scripts->item(count($scripts) - 2)->nodeValue;
    $locationsString = getBetween($output, "var locations = ", "];")[0] . "]";

    $b = '$locations = ' . (str_replace(array('[', ']'), array('array(', ')'), $locationsString)) . ';';
    eval($b);

    foreach ($locations as &$location) 
    {
        $dateTime = date_parse_from_format("F j Y h:i:s", $location[0]);
        $dateTime = $dateTime["year"] . '-' . $dateTime["month"] . '-' . $dateTime["day"];
        $lat = $location[1];
        $lng = $location[2];
        $timestamp = strtotime($dateTime);

        $hash = hash("sha256", $dateTime . $lat . $lng);

        #alter positions slightly
        $randomNumber1 = rand(-3, 3);
        $randomNumber2 = rand(-3, 3);
        $new_lat = (floatval($lat) * 1000000 + $randomNumber1) / 1000000;
        $new_lng = (floatval($lng) * 1000000 + $randomNumber2) / 1000000;

        $animal_manager = Animal_Manager::Instance();
        $location_manager = Location_Manager::Instance();
        $location = new Location();

        $location->ext_id = $animal->id;
        $location->ext_loc_id = $timestamp;
        $location->dt_move = $dateTime;
        $location->lat = $new_lat;
        $location->lng = $new_lng;
        $location->hash = $hash;

        $location_manager->save_new_location($location);
    }

    $animal_manager->setLastRefreshToNow($animal->id);
}

function getBetween($content, $start, $end)
{
    $n = explode($start, $content);
    $result = array();
    foreach ($n as $val) {
        $pos = strpos($val, $end);
        if ($pos !== false) {
            $result[] = substr($val, 0, $pos);
        }
    }
    return $result;
}
?>