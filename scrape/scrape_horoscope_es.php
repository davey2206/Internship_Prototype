<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_caption);

$logger = new Logger();
$caption_manager = Caption_Manager::Instance();

$logger->info("Start - scrape_horoscope_es..");

if ($caption_manager->horoscope_refresh_needed())
{
    $logger->info("Horoscope refresh needed.");
    refreshAllDatabaseHoroscopes();
}
else
{
    $logger->info("No horoscope refresh needed.");
    exit();
}

function refreshAllDatabaseHoroscopes()
{
    $logger = new Logger();
    $logger->debug("Starting refreshAllDatabaseHoroscopes function.");

    $caption_manager = Caption_Manager::Instance();
    $all_horoscope_types = $caption_manager->getAllHoroscopeTypes();

    if (empty($all_horoscope_types)) 
    {
        $logger->error("Error retrieving some or all of the 12 horoscope types.");
        print("Error retrieving some or all of the 12 horoscope types.");
        exit;
    }

    foreach ($all_horoscope_types as $horoscope) 
    {
        $horoscope_name = $horoscope->name_ES;
        $logger->info("Processing horoscope: $horoscope_name");

        $horoscope_name_escaped = str_replace("á", "a", str_replace("é", "e", strtolower($horoscope_name)));
        $horoscope_type_id = $horoscope->id;
        $dom = new DomDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML(getPageContentsWithProxy("https://www.lecturas.com/horoscopo/" . $horoscope_name_escaped));
        $horoscope_text = getHoroscopbyName($horoscope_name);

        saveHoroscopeToDB($horoscope_type_id, $horoscope_text, $dom);
    }
}

function getHoroscopbyName($horoscope_name)
{
    $logger = new Logger();
    $logger->debug("Retrieving horoscope by name: $horoscope_name");

    $dom = new DomDocument();
    libxml_use_internal_errors(true);
    $dom->loadHTML(getPageContentsWithProxy("https://www.lecturas.com/horoscopo/" . str_replace("á", "a", str_replace("é", "e", strtolower($horoscope_name)))));
    $horoscope_text = getHoroscopeTextFromPage($dom);

    return $horoscope_text;
}

function getHoroscopeTextFromPage($dom)
{
    $logger = new Logger();

    foreach ($dom->childNodes as $node) 
    {
        if ($node->nodeType == XML_ELEMENT_NODE)
        {
            if (($node->hasAttribute("id") && str_contains($node->getAttribute("id"), "horoscopo-hoy")) ||
                ($node->hasAttribute("class") && str_contains($node->getAttribute("class"), "horoscopo-hoy horoscopo-section")))
            {
                $horoscope_text = $node->childNodes[1]->childNodes[3]->textContent;
                $logger->info("Found horoscope text.");
                return $horoscope_text;
            }
        }

        if ($node->hasChildNodes()) 
        {
            $description = getHoroscopeTextFromPage($node);
            
            if ($description != null && $description != "")
            {
                return $description;
            }
        }
    }
}

function saveHoroscopeToDB($horoscope_type_id, $horoscopeText, $dom)
{
    $logger = new Logger();
    $caption_manager = Caption_Manager::Instance();
    $horoscope_text = trim(preg_replace('/\s+/', ' ', $horoscopeText));

    $caption_manager->insert_new_horoscope($horoscope_text, $horoscope_type_id, "ES");
    $logger->info("Saved horoscope to database: Type ID $horoscope_type_id");
}
?>
