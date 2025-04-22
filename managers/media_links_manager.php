<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_media_link);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_media_link);

class Media_Links_Manager
{
    private static $instance = null;
    private $media_links_db;

    // Constructor with an optional parameter
    private function __construct() 
    {
        $this->media_links_db = new Media_Link_DB();
        
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new Media_Links_Manager();
        }
        return self::$instance;
    }

    public function getLink($link_id)
    {
        $media_link = new Media_Link();
        if ($link_id !== null) 
        {
            $db_result = $this->media_links_db->getLinkById($link_id);
            if ($db_result) 
            { // Ensure $db_result is not false or null
                $media_link->id = $db_result->id;
                $media_link->kukudushi_id = $db_result->kukudushi_id;
                $media_link->url = $db_result->url;
                $media_link->type = $db_result->type;
                $media_link->datetime = $db_result->datetime;
                $media_link->is_active = $db_result->is_active == 1;
            }
        }
        return $media_link;
    }

    public function save_media_link($new_link)
    {
        //Set old link inactive
        $this->set_old_links_inactive($new_link->kukudushi_id);
        
        return $this->media_links_db->save($new_link);
    }

    public function set_old_links_inactive($kukudushi_id)
    {
        $this->media_links_db->set_old_links_inactive($kukudushi_id);
    }
}
