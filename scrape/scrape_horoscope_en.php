<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_caption);

$caption_manager = Caption_Manager::Instance();


if ($caption_manager->horoscope_refresh_needed())
{
	refreshDatabaseHoroscopes();
}
else
{
    exit();
}

function refreshDatabaseHoroscopes()
{
	for ($x = 1; $x <= 12; $x++) 
	{
		$dom = new DomDocument();
		libxml_use_internal_errors(true);
        $dom->loadHTML(getPageContentsWithProxy("https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-today.aspx?sign=" . $x));
        $horoscope_page_html = $dom;

        $finder = new DomXPath($horoscope_page_html);
        $classname = "main-horoscope";
        $nodes = $finder->query("//*[contains(@class, '$classname')]");
        $horoscope_text_raw = $nodes[0]->childNodes[3]->nodeValue;
		$splitted = explode("-", $horoscope_text_raw);
        $horoscope_text = trim(str_replace( [trim($splitted[0]), "-"], "", $horoscope_text_raw));

        $horoscope_sign = "";
        $titleList = $dom->getElementsByTagName("title");
        if ($titleList->length > 0) 
		{
            $title = $titleList->item(0)->textContent;
			$splitted = $pieces = explode(" ", $title);
            $horoscope_sign = $splitted[0];
        }

		saveHoroscopeToDB($horoscope_sign, $horoscope_text, $dom);
	}
}

function saveHoroscopeToDB($horoscopeName, $horoscopeText, $dom)
{
	$caption_manager = Caption_Manager::Instance();
	$horoscope_type_id = $caption_manager->getHoroscopeTypeId($horoscopeName);
	$caption_manager->insert_new_horoscope($horoscopeText, $horoscope_type_id, "EN");
}
?>