<?php

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
//require_once(dirname(__FILE__, 2) . '/db/badges.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_badges);

class Badges_Manager
{
    private static $instance = null;
    private $settings;
    private $Badges_DB;

    private function __construct()
    {
        $this->settings = Settings_Manager::Instance();
        $this->Badges_DB = new Badges_DB();
    }

    public static function Instance()
    {
        if (self::$instance === null) {
            self::$instance = new Badges_Manager();
        }
        return self::$instance;
    }

    public function getAllBadges($kukudushi_id)
    {
        return $this->Badges_DB->getBadgeStats($kukudushi_id);
    }

    public function updateCoinStat($kukudushi_id, $amount)
    {
        $this->Badges_DB->updateBadgePoints($kukudushi_id, $amount);
    }

    public function updateFactStat($kukudushi_id, $amount)
    {
        $this->Badges_DB->updateBadgeAnimals($kukudushi_id, $amount);
    }

    public function updateAnimalStat($kukudushi_id, $amount)
    {
        $this->Badges_DB->updateBadgeFacts($kukudushi_id, $amount);
    }
}
