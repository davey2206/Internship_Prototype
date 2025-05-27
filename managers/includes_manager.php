<?php
require_once(dirname(__FILE__, 2) .'/types/include_php_file_type.php');

class Includes_Manager
{
    private static $instance = null;
    public $included_php_files_list;

    private function __construct()
    {
        $this->included_php_files_list = [];
        $this->include_php_file(Include_php_file_type::obj_type_logger);
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new Includes_Manager();
        }
        return self::$instance;
    }
    
    public function include_php_file($include_file_type)
    {
        if ($this->is_php_file_already_included($include_file_type))
        {
            return;
        }

        switch($include_file_type)
        {
            /* Object types */ 

            case Include_php_file_type::obj_type_animal :
                require_once(dirname(__FILE__, 2) . "/types/animal.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_animal;
                break;
            case Include_php_file_type::obj_type_kukudushi_main_type :
                require_once(dirname(__FILE__, 2) . "/types/kukudushi_main_type.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_kukudushi_main_type;
                break;
            case Include_php_file_type::obj_type_kukudushi_type :
                require_once(dirname(__FILE__, 2) . "/types/kukudushi_type.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_kukudushi_type;
                break;
            case Include_php_file_type::obj_type_kukudushi :
                require_once(dirname(__FILE__, 2) . "/types/kukudushi.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_kukudushi;
                break;
            case Include_php_file_type::obj_type_location :
                require_once(dirname(__FILE__, 2) . "/types/location.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_location;
                break;
            case Include_php_file_type::obj_type_logger :
                require_once(dirname(__FILE__, 2) . "/types/logger.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_logger;
                break;
            case Include_php_file_type::obj_type_metadata_property :
                require_once(dirname(__FILE__, 2) . "/types/metadata_property.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_metadata_property;
                break;
            case Include_php_file_type::obj_type_metadata :
                require_once(dirname(__FILE__, 2) . "/types/metadata.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_metadata;
                break;
            case Include_php_file_type::obj_type_notification :
                require_once(dirname(__FILE__, 2) . "/types/notification.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_notification;
                break;
            case Include_php_file_type::obj_type_payment_type :
                require_once(dirname(__FILE__, 2) . "/types/payment_type.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_payment_type;
                break;
            case Include_php_file_type::obj_type_payment :
                require_once(dirname(__FILE__, 2) . "/types/payment.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_payment;
                break;
            case Include_php_file_type::obj_type_points_type :
                require_once(dirname(__FILE__, 2) . "/types/points_type.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_points_type;
                break;
            case Include_php_file_type::obj_type_points :
                require_once(dirname(__FILE__, 2) . "/types/points.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_points;
                break;
            case Include_php_file_type::obj_type_scan :
                require_once(dirname(__FILE__, 2) . "/types/scan.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_scan;
                break;
            case Include_php_file_type::obj_type_user :
                require_once(dirname(__FILE__, 2) . "/types/user.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_user;
                break;
            case Include_php_file_type::obj_type_geolocation :
                require_once(dirname(__FILE__, 2) . "/types/geolocation.php");
                $this->included_php_files_list[] = Include_php_file_type::obj_type_geolocation;
                break;

            /* Db types */ 

            case Include_php_file_type::db_database :
                require_once(dirname(__FILE__, 2) . "/db/database.php");
                $this->included_php_files_list[] = Include_php_file_type::db_database;
                break;
            case Include_php_file_type::db_animals :
                require_once(dirname(__FILE__, 2) . "/db/animals.php");
                $this->included_php_files_list[] = Include_php_file_type::db_animals;
                break;
            case Include_php_file_type::db_kukudushi :
                require_once(dirname(__FILE__, 2) . "/db/kukudushi.php");
                $this->included_php_files_list[] = Include_php_file_type::db_kukudushi;
                break;
            case Include_php_file_type::db_location :
                require_once(dirname(__FILE__, 2) . "/db/location.php");
                $this->included_php_files_list[] = Include_php_file_type::db_location;
                break;
            case Include_php_file_type::db_metadata :
                require_once(dirname(__FILE__, 2) . "/db/metadata.php");
                $this->included_php_files_list[] = Include_php_file_type::db_metadata;
                break;
            case Include_php_file_type::db_notification :
                require_once(dirname(__FILE__, 2) . "/db/notification.php");
                $this->included_php_files_list[] = Include_php_file_type::db_notification;
                break;
            case Include_php_file_type::db_payment :
                require_once(dirname(__FILE__, 2) . "/db/payment.php");
                $this->included_php_files_list[] = Include_php_file_type::db_payment;
                break;
            case Include_php_file_type::db_points :
                require_once(dirname(__FILE__, 2) . "/db/points.php");
                $this->included_php_files_list[] = Include_php_file_type::db_points;
                break;
            case Include_php_file_type::db_scan :
                require_once(dirname(__FILE__, 2) . "/db/scan.php");
                $this->included_php_files_list[] = Include_php_file_type::db_scan;
                break;
            case Include_php_file_type::db_badges :
                require_once(dirname(__FILE__, 2) . "/db/badges.php");
                $this->included_php_files_list[] = Include_php_file_type::db_badges;
                break;

            /* Manager types */ 

            case Include_php_file_type::manager_animal :
                require_once(dirname(__FILE__, 2) . "/managers/animal_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_animal;
                break;
            case Include_php_file_type::manager_guid :
                require_once(dirname(__FILE__, 2) . "/managers/guid_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_guid;
                break;
            case Include_php_file_type::manager_dashboard_shop :
                require_once(dirname(__FILE__, 2) . "/managers/dashboard_shop_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_dashboard_shop;
                break;
            case Include_php_file_type::manager_kukudushi :
                require_once(dirname(__FILE__, 2) . "/managers/kukudushi_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_kukudushi;
                break;
            case Include_php_file_type::manager_location :
                require_once(dirname(__FILE__, 2) . "/managers/location_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_location;
                break;
            case Include_php_file_type::manager_metadata :
                require_once(dirname(__FILE__, 2) . "/managers/metadata_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_metadata;
                break;
            case Include_php_file_type::manager_notification :
                require_once(dirname(__FILE__, 2) . "/managers/notification_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_notification;
                break;
            case Include_php_file_type::manager_payment :
                require_once(dirname(__FILE__, 2) . "/managers/payment_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_payment;
                break;
            case Include_php_file_type::manager_points :
                require_once(dirname(__FILE__, 2) . "/managers/points_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_points;
                break;
            case Include_php_file_type::manager_scan :
                require_once(dirname(__FILE__, 2) . "/managers/scan_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_scan;
                break;
            case Include_php_file_type::manager_user :
                require_once(dirname(__FILE__, 2) . "/managers/user_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_user;
                break;
            case Include_php_file_type::manager_settings :
                require_once(dirname(__FILE__, 2) . "/managers/settings_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_settings;
                break;
            case Include_php_file_type::manager_badges :
                require_once(dirname(__FILE__, 2) . "/managers/badges_manager.php");
                $this->included_php_files_list[] = Include_php_file_type::manager_badges;
                break;

                /* Scraping types */

                case Include_php_file_type::scrape_refresh_locations_animal :
                    require_once(dirname(__FILE__, 2) . "/scrape/refresh_locations_animal.php");
                    $this->included_php_files_list[] = Include_php_file_type::scrape_refresh_locations_animal;
                    break;
                case Include_php_file_type::scrape_refresh_locations_animal2 :
                    require_once(dirname(__FILE__, 2) . "/scrape/refresh_locations_animal2.php");
                    $this->included_php_files_list[] = Include_php_file_type::scrape_refresh_locations_animal2;
                    break;
                case Include_php_file_type::scrape_refresh_locations_animal3 :
                    require_once(dirname(__FILE__, 2) . "/scrape/refresh_locations_animal3.php");
                    $this->included_php_files_list[] = Include_php_file_type::scrape_refresh_locations_animal3;
                    break;
                case Include_php_file_type::scrape_refresh_locations_turtle :
                    require_once(dirname(__FILE__, 2) . "/scrape/refresh_locations_turtle.php");
                    $this->included_php_files_list[] = Include_php_file_type::scrape_refresh_locations_turtle;
                    break;
                case Include_php_file_type::scrape_functions :
                    require_once(dirname(__FILE__, 2) . "/scrape/scrape_functions.php");
                    $this->included_php_files_list[] = Include_php_file_type::scrape_functions;
                    break;
                case Include_php_file_type::scrape_gospel :
                    require_once(dirname(__FILE__, 2) . "/scrape/scrape_gospel.php");
                    $this->included_php_files_list[] = Include_php_file_type::scrape_gospel;
                    break;
                case Include_php_file_type::scrape_wisdom :
                    require_once(dirname(__FILE__, 2) . "/scrape/scrape_wisdom.php");
                    $this->included_php_files_list[] = Include_php_file_type::scrape_wisdom;
                    break;


                /* Miscelaneous types */

            case Include_php_file_type::misc_payment_functions :
                require_once(dirname(__FILE__, 2) . "/payments/payment-functions.php");
                $this->included_php_files_list[] = Include_php_file_type::misc_payment_functions;
                break;
                
                
            default :
                break;
        }
    }

    private function is_php_file_already_included($include_file_type)
    {
        if (in_array($include_file_type, $this->included_php_files_list))
        {
            return true;
        }
        return false;
    }
}
?>