<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_functions);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_gospel);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::scrape_wisdom);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_caption);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_caption);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_kukudushi_type);


check_gospel();
//check_wisdom();

function check_gospel()
{
    $logger = new Logger();
    $logger->debug("Starting check_gospel function.");

    date_default_timezone_set('America/Curacao');
    $caption_manager = Caption_Manager::Instance();
    $result = $caption_manager->getLastGenericCaption(Kukudushi_type::Gospel);

    if (!empty($result)) 
    {
        $today = date("Y-m-d");
        $dateLastRefresh = $result[0]->used_date;
        $logger->info("Last Gospel refresh date: $dateLastRefresh");

        $today_dt = new DateTime($today);
        $lastRefresh_dt = new DateTime($dateLastRefresh);

        if ($lastRefresh_dt < $today_dt) 
        {
            $logger->info("Last Gospel refresh is older than today. Refreshing...");
            get_new_gospel();
        }
        else
        {
            $logger->info("Gospel is up to date. No need for refresh.");
        }
    }
    else 
    {
        $logger->info("No Gospel found. Refreshing...");
        get_new_gospel();
    }
}

function get_new_gospel()
{
    $caption_manager = Caption_Manager::Instance();
    $logger = new Logger();
    $logger->debug("Starting get_new_gospel function.");

    //Get new caption
    $caption = refresh_gospel();

    if (empty($caption))
    {
        $logger->info("Something went wrong.. The returnes caption is empty..");
        return;
    }

    //$caption_manager->update_last_caption(Kukudushi_type::Gospel);
    //$logger->info("Updated previous Gospel caption marked as active.");

    $caption_object = new Caption();
    $caption_object->type = Kukudushi_type::Gospel; // Assuming this should be Gospel instead of Wisdom for consistency?
    $caption_object->caption_EN = $caption;
    $caption_object->is_active = true;
    $caption_object->used_date = date("Y-m-d");
    $success = $caption_manager->insert_new_caption($caption_object, true);

    if ($success)
    {
        $logger->info("Succesfully inserted new Gospel caption: \"$caption\"");
    }
    else
    {
        $logger->info("Failed to insert new Gospel caption: \"$caption\"");
    }
}

?>