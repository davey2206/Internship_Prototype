<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_guid);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Kukudushi_DB
{
    public $logger;

    function __construct() 
    {
        $this->logger = new Logger();
    }

    public function getKukudushiByUid(string $kukudushi_id, $temporary_id_expired = false)
    {
        $this->logger->debug(sprintf("getKukudushiByUid() ] => PARAMETERS: 'kukudushi_id' = %s.", $kukudushi_id));
        $resultKukudushi = null;

        if (empty($kukudushi_id)) 
        {
            $this->logger->info(sprintf("kukudushi_id is empty"));
            return [false, false, null, null];
        }


        $result = DataBase::select("SELECT * FROM `wp_kukudushi_items` WHERE `kukudushi_id` = %s", 
                [$kukudushi_id]);


        // Check if any rows were returned
        if (!empty($result)) 
        {
            $resultKukudushi = $result[0];
            $temporary_id = null;
            
            $this->logger->info(sprintf("Result found! kukudushi_id: %s", $kukudushi_id));
            if (!$temporary_id_expired)
            {
                $temporary_id = $this->getTemporaryId($kukudushi_id);
            }

            return [true, $temporary_id_expired, $resultKukudushi, $temporary_id];
        }
        $this->logger->info(sprintf("NO results found with kukudushi_id: %s", $kukudushi_id));
        return [false, false, null, null];
    }

    public function getKukudushiByTemporaryId(string $temporary_id)
    {
        $this->logger->debug(sprintf("getKukudushiByTemporaryId() ] => PARAMETERS: 'temporary_id' = %s.", $temporary_id));
        if (empty($temporary_id)) //Id does NOT exits
        {
            return [false, false, null, null];
        }

        $temporary_id_result = DataBase::select("SELECT * FROM `wp_kukudushi_item_temporary_id` WHERE `temporary_id` = %s ORDER BY date DESC", 
                            [$temporary_id]);
        
        if (empty($temporary_id_result)) 
        {
            return [false, false, null, null];
        }

        date_default_timezone_set('America/Curacao');
        $last_temp_id_date = strtotime($temporary_id_result[0]->date);
        $date_today = strtotime(date("Y-m-d"));

        if ($last_temp_id_date < $date_today) //Temporary_id is more than 1 day old (expired)
        {
            return $this->getKukudushiByUid($temporary_id_result[0]->kukudushi_id, true);
        }
        
        return $this->getKukudushiByUid($temporary_id_result[0]->kukudushi_id, false);
    }

    public function getTemporaryId($kukudushi_id, $send_homepage = false)
    {
        $this->logger->debug(sprintf("getTemporaryId() ] => PARAMETERS: 'kukudushi_id' = %s, 'send_homepage' = %s.", $kukudushi_id, $send_homepage));
        if (empty($kukudushi_id)) 
        {
            return null;
        }

        $temporary_id = null;
        
        //Get temporary_id
        $temporary_id_result = DataBase::select("SELECT * FROM `wp_kukudushi_item_temporary_id` WHERE `kukudushi_id` = %s ORDER BY `date` DESC", 
                                [$kukudushi_id]);


        if (empty($temporary_id_result))
        {
            $this->logger->info("temporary_id_result is empty.");
        
            $temporary_id = $this->generateNewTemporaryId($kukudushi_id);
        }
        else
        {
            $temporary_id = $temporary_id_result[0]->temporary_id;

            date_default_timezone_set('America/Curacao');
            $today = date("Y-m-d");
            $dateLastRefresh = $temporary_id_result[0]->date;
            $today_dt = new DateTime($today);
            $lastRefresh_dt = new DateTime($dateLastRefresh);

            $this->logger->info(sprintf("BEFORE check if date is other date than today: 'today_dt' = %s, 'lastRefresh_dt' = %s.", $today_dt->format('Y-m-d'), $lastRefresh_dt->format('Y-m-d')));
        
            //If lastrefresh is other date than today
            if ($lastRefresh_dt < $today_dt)
            {
                $this->logger->info("Temporary id is expired.. Generating new temporary ID.");
        
                $temporary_id = $this->generateNewTemporaryId($kukudushi_id);

                if ($send_homepage)
                {
                    echo '<script type="text/javascript">window.location.href="https://'. $_SERVER["SERVER_NAME"] . '";</script>';
                    exit();
                }
            }
        }

        return $temporary_id;
    }

    public function getAllModels()
    {
        $result = DataBase::select("SELECT * FROM `wp_kukudushi_models`");

        return $result;
    }

    public function getAllMainModels()
    {
        $result = DataBase::select("SELECT * FROM `wp_kukudushi_models_main`");
        
        return $result;
    }

    public function setKukudushiNewUser($new_user, $kukudushi)
    {
        if ($kukudushi->exists)
        {
            DataBase::update(
                'wp_kukudushi_items', 
                ['new_user' => $new_user ? 1 : 0],
                ['kukudushi_id' => $kukudushi->id]
            );
        }
        else
        {
            $data = array(
                'kukudushi_id' => $kukudushi->id,
                ['new_user' => $new_user ? 1 : 0],
                'language' => 'EN'
            );
            $format = array('%s', '%d', '%s');
            $inserted_id = DataBase::insert('wp_kukudushi_items', $data, $format);
        }
    }

    public function setKukudushiModel($model_id, $kukudushi)
    {
        if ($kukudushi->exists)
        {
            DataBase::update(
                'wp_kukudushi_items', 
                ['model_id' => $model_id],
                ['kukudushi_id' => $kukudushi->id]
            );
        }
        else
        {
            $data = array(
                'kukudushi_id' => $kukudushi->id,
                'model_id' => $model_id,
                'language' => 'EN'
            );
            $format = array('%s', '%d', '%s');
            $inserted_id = DataBase::insert('wp_kukudushi_items', $data, $format);
        }
    }

    public function getAllTypes()
    {
        // First get the Animal Tracker main type ID
        $sql = "SELECT id FROM `wp_kukudushi_types_main` WHERE `type_name` = 'Animal Tracker'";
        $result = DataBase::select($sql);

        if (empty($result)) {
            return [];
        }

        $main_type_id = $result[0]->id;

        // Now get all types that have this main_type
        $sql = "SELECT type_id, type_name FROM `wp_kukudushi_types` WHERE `main_type` = %d";
        $types = DataBase::select($sql, [$main_type_id]);

        return $types;
    }

    public function setKukudushiType($type_id, $kukudushi)
    {
        $this->logger->info("setKukudushiType, \$type_id = " . $type_id);
        if ($kukudushi->exists)
        {
            DataBase::update(
                'wp_kukudushi_items', 
                ['type_id' => $type_id],
                ['kukudushi_id' => $kukudushi->id]
            );
        }
        else
        {
            $data = array(
                'kukudushi_id' => $kukudushi->id,
                'type_id' => $type_id,
                'language' => 'EN'
            );
            $format = array('%s', '%d', '%s');
            $inserted_id = DataBase::insert('wp_kukudushi_items', $data, $format);
        }
    }

    public function changeLanguage($language_id, $kukudushi_id)
    {
        DataBase::update(
            'wp_kukudushi_items', 
            ['language' => $language_id],
            ['kukudushi_id' => $kukudushi_id]
        );
    }

    public function generateNewTemporaryId($kukudushi_id)
    {
        $this->logger->info(sprintf("generateNewTemporaryId() ] => PARAMETERS: 'kukudushi_id' = %s.", $kukudushi_id));
        
        //Set old temporary id to inactive
        DataBase::update(
            'wp_kukudushi_item_temporary_id', 
            ['is_active' => 0],
            ['kukudushi_id' => $kukudushi_id]
        );

        //Insert new temporary id
        $guid_manager = GUID_Manager::Instance();
        $new_temporary_id = $guid_manager->getGUID();

        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
        $dateTimeNowString = $dateTimeNow->format('Y-m-d H:i:s');
        $data = array(
            'kukudushi_id' => $kukudushi_id,
            'temporary_id' => $new_temporary_id,
            'date' => $dateTimeNowString
        );

        $format = array('%s', '%s', '%s');

        $inserted_id = DataBase::insert('wp_kukudushi_item_temporary_id', $data, $format);

        return $new_temporary_id;
    }
}
?>