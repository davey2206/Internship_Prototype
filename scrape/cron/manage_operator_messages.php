<?php
require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
$manager = new AutomaticOperatorMessageManager();

class AutomaticOperatorMessageManager
{
    public $messages;

    public function __construct()
    {
        print("Runnning AutomaticOperatorMessageManager");
        $this->disableOldMessages();
        $this->createNewMessages();
    }

    function disableOldMessages()
    {
        //get wordpress database
        global $wpdb;
        $messagesToDisable = [];
        //Set timezone Curacao
        date_default_timezone_set('America/Curacao');

        $result = DataBase::select("SELECT * FROM wp_kukudushi_ext_operators_messages WHERE is_handled = 0 AND target_date < CONVERT(NOW(), DATE)");

        if ($wpdb->num_rows > 0)
        {
            $messagesToDisable = $result;


            foreach ($messagesToDisable as $message)
            {
                //Update message in DB
                $sql = "UPDATE wp_kukudushi_notifications SET is_active = 0 WHERE operator_message_id = '" . $message->id . ", '";
                $wpdb->query($sql);
            }

            $sql = "UPDATE wp_kukudushi_ext_operators_messages SET is_handled  = 1 WHERE id = '" . $message->id . ", '";
            $wpdb->query($sql);
        }
    }

    function createNewMessages()
    {
        //get wordpress database
        global $wpdb;
        $messagesToCreate = [];
        $operator = null;
        //Set timezone Curacao
        date_default_timezone_set('America/Curacao');

        $result = DataBase::select("SELECT * FROM wp_kukudushi_ext_operators_messages WHERE target_date = CONVERT(NOW(), DATE) AND is_executed = 0");

        if ($wpdb->num_rows > 0) {

            $messagesToCreate = $result;

            foreach ($messagesToCreate as $message)
            {
                $resultoperator = DataBase::select("SELECT * FROM wp_kukudushi_ext_operators WHERE id = " . $message->operator_id . "");
                $operator = $resultoperator[0];

                $resultTypeMetadata = DataBase::select("SELECT * FROM wp_kukudushi_item_metadata WHERE type = " . $operator->type_owner . "");
                foreach ($resultTypeMetadata as $metadata)
                {
                    $kukudushiMessageSql = "INSERT IGNORE INTO wp_kukudushi_notifications (kukudushi_id, ext_operator_id, operator_message_id, message, image, timeout, is_active, active_date, expiration_date) VALUES ('" . $metadata->kukudushi_id . "', " . $message->operator_id . ", " . $message->id . ", '" . $message->message . "', '" . $operator->image_url . "', 0, 1, '" . $message->target_date . "', date_add(NOW(), INTERVAL 1 DAY));";
                    $wpdb->query($kukudushiMessageSql);
                }

                $sql = "UPDATE wp_kukudushi_ext_operators_messages SET is_executed = 1 WHERE id = '" . $message->id . "';";
                $wpdb->query($sql);
            }
        }
    }
}

?>