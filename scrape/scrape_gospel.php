<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);

// Logger initialization moved inside functions to ensure it captures the correct calling context
// $logger = new Logger();

function refresh_gospel()
{
    $logger = new Logger();
    $logger->debug("Starting refresh_gospel function.");

    $dom = new DomDocument();
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = true;
    libxml_use_internal_errors(true);
    
    $date_today = date('m-d-Y');
    $logger->info("Attempting to load gospel for date: $date_today");

    $dom->loadHTML(getPageContentsWithProxy('https://www.biblestudytools.com/bible-verse-of-the-day/' . $date_today . '/'));
    $finder = new DomXPath($dom);
    $classname="verse";
    $nodes = $finder->query("//*[contains(@class, '$classname')]");
    $verseNumber = $finder->query("//*[contains(@class, 'scripture')]");

    $origin = trim(preg_replace('/[\t\n\r\s]+/', ' ', htmlspecialchars($verseNumber[0]->childNodes[3]->textContent ?? "")));
    $caption = trim(preg_replace('/[\t\n\r\s]+/', ' ', htmlspecialchars($nodes[1]->childNodes[2]->wholeText ?? "")));

    if (!empty($origin) && !empty($caption)) 
    {
        $logger->info("Successfully retrieved gospel: $origin");
        return $origin . "\n\n" . $caption;
    } 
    else 
    {
        $logger->error("Failed to retrieve gospel, attempting retry.");
        return retry();
    }
}

function retry()
{
    $logger = new Logger();
    $logger->debug("Starting retry function for refresh_gospel.");

    $dom = new DomDocument();
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = true;
    libxml_use_internal_errors(true);
    
    $date_today = date('m-d-Y');
    $logger->info("Retrying with alternative method for date: $date_today");

    $dom->loadHTML(getPageContentsWithProxy('https://www.biblestudytools.com/bible-verse-of-the-day/' . $date_today . '/'));
    $finder = new DomXPath($dom);
    $classname1 = "text-blue-600";
    $classname2 = "text-2xl";
    $classname3 = "font-bold";
    $nodes = $finder->query("//*[contains(@class, '$classname1') and contains(@class, '$classname2') and contains(@class, '$classname3')]");

    $origin = trim(preg_replace('/[\t\n\r\s]+/', ' ', htmlspecialchars($nodes[1]->textContent ?? "")));
    $caption = trim(preg_replace('/[\t\n\r\s]+/', ' ', htmlspecialchars($nodes[1]->parentNode->parentNode->childNodes[3]->childNodes[3]->textContent ?? "")));

    if (!empty($origin) && !empty($caption)) 
    {
        $logger->info("Successfully retrieved gospel on retry: $origin");
        return $origin . "\n\n" . $caption;
    } 
    else 
    {
        $logger->error("Retry failed, attempting second retry.");
        return secondRetry();
    }
}

function secondRetry()
{
    $logger = new Logger();
    $logger->debug("Starting second retry function for refresh_gospel.");

    $dom = new DomDocument();
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = true;
    libxml_use_internal_errors(true);
    
    $date_today = date('m-d-Y');
    $logger->info("Second retry for date: $date_today");

    $dom->loadHTML(getPageContentsWithProxy('https://www.biblestudytools.com/bible-verse-of-the-day/' . $date_today . '/'));
    $finder = new DomXPath($dom);
    $classname = "text-blue-600 text-2xl font-bold";
    $nodes = $finder->query("//*[contains(@class, '$classname')]");

    $origin = trim(preg_replace('/[\t\n\r\s]+/', ' ', htmlspecialchars($nodes[0]->textContent ?? "")));
    $caption = trim(preg_replace('/[\t\n\r\s]+/', ' ', htmlspecialchars($nodes[0]->parentNode->parentNode->childNodes[3]->textContent ?? "")));

    $logger->info("Second retry successful, retrieved gospel: $origin");
    return ($origin . "\n\n" . $caption);
}
?>
