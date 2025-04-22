<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);

function refresh_wisdom()
{
    $dom = new DomDocument();
    libxml_use_internal_errors(true);
    //$dom->loadHTMLFile('https://www.biblestudytools.com/bible-verse-of-the-day/');
    $dom->loadHTML(getPageContentsWithProxy('https://www.wow4u.com/quote-of-the-day-daily-positive-words-of-wisdom/'));
    $finder = new DomXPath($dom);
    $classname = "wp-block-quote";
    $nodes = $finder->query("//*[contains(@class, '$classname')]");

    $quote1 = $nodes[0]->textContent ?? "";
    $quote2 = $nodes[1]->textContent ?? "";
    $quote3 = $nodes[2]->textContent ?? "";

    if (!empty($quote1)) 
    {
        return $quote1;
    } 
    else if (!empty($quote2)) 
    {
        return $quote2;
    } 
    else 
    {
        return $quote3;
    }
}
        
?>