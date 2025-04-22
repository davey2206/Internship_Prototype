<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_metadata);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_scan);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_points);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_notification);

class Kukudushi_Manager 
{
    private static $instance = null;
    public $kukudushi_db;
    public $metadata_manager;
    public $scan_manager;
    public $points_manager;
    public $notification_manager;

    //Constructor
    private function __construct()
    {
        $this->kukudushi_db = new Kukudushi_DB();
        $this->metadata_manager = MetaData_Manager::Instance();
        $this->scan_manager = Scan_Manager::Instance();
        $this->points_manager = Points_Manager::Instance();
        $this->notification_manager = new Notification_Manager();
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new Kukudushi_Manager();
        }
        return self::$instance;
    }

    public function get_kukudushi($id)
    {
        $kukudushi_db = new Kukudushi_DB();
        $exists = false;
        $temporary_id_expired = false;
        $temporary_id = "";

        if (str_contains($id, "-")) //temporary id
        {
            [$exists, $temporary_id_expired, $result_kukudushi, $temporary_id] = $kukudushi_db->getKukudushiByTemporaryId($id);
        }
        else //UID
        {
            [$exists, $temporary_id_expired, $result_kukudushi, $temporary_id] = $kukudushi_db->getKukudushiByUid($id);
        }

        $kukudushi = new Kukudushi();
        $kukudushi->exists = $exists;
        $kukudushi->temporary_id_expired = $temporary_id_expired;

        if ($kukudushi->exists == true)
        {
            $kukudushi->id = $result_kukudushi->kukudushi_id;
            $kukudushi->type_id = $result_kukudushi->type_id;
            $kukudushi->model_id = $result_kukudushi->model_id;
            $kukudushi->sell_loc_id = $result_kukudushi->sell_loc_id;
            $kukudushi->new_user = $result_kukudushi->new_user;
            $kukudushi->language = $result_kukudushi->language;
            $kukudushi->temporary_id = $temporary_id;
            $kukudushi->metadata = $this->metadata_manager->getAllMetaData($kukudushi->id);
            $kukudushi->points = $this->points_manager->getTotalPoints($kukudushi);
        }
        else
        {
            $kukudushi->id = $id;
        }

        return $kukudushi;
    }

    public function getAllModels()
    {
        return $this->kukudushi_db->getAllModels();
    }

    public function getAllMainModels()
    {
        return $this->kukudushi_db->getAllMainModels();
    }

    public function setKukudushiNewUser($new_user, $kukudushi)
    {
        return $this->kukudushi_db->setKukudushiNewUser($new_user, $kukudushi);
    }

    public function setKukudushiModel($model_id, $kukudushi)
    {
        return $this->kukudushi_db->setKukudushiModel($model_id, $kukudushi);
    }

    public function getAllTypes()
    {
        return $this->kukudushi_db->getAllTypes();
    }

    public function setKukudushiType($type_id, $kukudushi)
    {
        return $this->kukudushi_db->setKukudushiType($type_id, $kukudushi);
    }

    public function changeLanguage($language_id, $kukudushi_id)
    {
        $this->kukudushi_db->changeLanguage($language_id, $kukudushi_id);
    }
}
?>