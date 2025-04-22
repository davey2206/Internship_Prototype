<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Notification_DB
{
    public function getFirstNotification($kukudushi_id)
    {
        // Prepare the SQL statement with placeholders
        $sql = "SELECT * FROM wp_kukudushi_notifications WHERE is_active = 1 AND kukudushi_id = %s AND (view_count < max_view_count OR max_view_count = 0) AND expiration_date > CURDATE() AND active_date <= CURDATE() ORDER BY id ASC LIMIT 1";

        // Execute the select query with the sanitized data
        $result = DataBase::select($sql, [$kukudushi_id]);

        if (count($result) > 0) 
        {
            return $result[0];
        }
        return NULL;
    }

    public function getAllRemainingNotifications($kukudushi_id)
    {
        // Prepare the SQL statement with placeholders
        $sql = "SELECT * FROM wp_kukudushi_notifications WHERE is_active = 1 AND kukudushi_id = %s AND (view_count < max_view_count OR max_view_count = 0) AND expiration_date > CURDATE() AND active_date <= CURDATE() ORDER BY id ASC";

        // Execute the select query with the sanitized data
        $result = DataBase::select($sql, [$kukudushi_id]);

        if (count($result) > 0) 
        {
            return $result;
        }
        return NULL;
    }

    public function addNotificationInteraction($notification_id, $start_read, $end_read)
    {

        $this->setNotificationRead($notification_id);

        $data = array(
            'notification_id' => $notification_id,
            'start_read' => $start_read,
            'end_read' => $end_read, // Assuming empty string as a placeholder for image
        );

        $format = array('%d', '%s', '%s');
        $inserted_id = DataBase::insert('wp_kukudushi_notifications_interactions', $data, $format);
    }

    public function setNotificationRead($notification_id)
    {
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));

        $table_name = 'wp_kukudushi_notifications';

        $data = [
            'view_count' => ['raw' => 'view_count + 1'], // Indicate that 'view_count' should be incremented
            'read_datetime' => $dateTimeNow->format('Y-m-d H:i:s'),
        ];

        $where = [
            'id' => $notification_id,
        ];

        $result = DataBase::updateWithRaw($table_name, $data, $where);

        if ($result) {
            // Update was successful
        } else {
            // Handle the error
        }
    }

    public function insertNewNotification($kukudushi_id, $message, $image = "", $timeout = 0, $days_till_expire = 60)
    {
        // Initialize current date and calculate expiration date
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
        $expirationDate = new DateTime('now', new DateTimeZone('America/Curacao'));
        $expirationDate->add(new DateInterval('P'. strval($days_till_expire) .'D')); // Adds XX days to the current date

        $data = array(
            'kukudushi_id' => $kukudushi_id,
            'message' => $message,
            'image' => $image, // Assuming empty string as a placeholder for image
            'timeout' => $timeout,
            'is_active' => 1,
            'active_date' => $dateTimeNow->format('Y-m-d H:i:s'), // Use the current DateTime object
            'expiration_date' => $expirationDate->format('Y-m-d H:i:s') // Use the expiration DateTime object
        );

        $format = array('%s', '%s', '%s', '%d', '%d', '%s', '%s');
        $inserted_id = DataBase::insert('wp_kukudushi_notifications', $data, $format);

    }

    
}
?>