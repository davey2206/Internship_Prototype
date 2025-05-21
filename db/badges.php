<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Badges_DB
{
    public function getBadgeStats($kukudushi)
    {
        //get badge stats
    }
}
?>