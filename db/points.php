<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_points_type);

class Points_DB
{
    public function register($points_object)
    {
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));

        $data = array(
            'kukudushi_id' => $points_object->kukudushi_id,
            'amount' => $points_object->amount,
            'date' => $dateTimeNow->format('Y-m-d H:i:s'),
            'description' => $points_object->description,
        );

        $format = array('%s', '%d', '%s', '%s');

        // Execute the insert operation
        $inserted_id = DataBase::insert('wp_kukudushi_points', $data, $format);
        return $inserted_id;
    }

    public function getTotalPoints($kukudushi)
    {
        $sql = "SELECT SUM(amount) as total FROM wp_kukudushi_points WHERE kukudushi_id = %s";

        // Execute the query using the DataBase class
        $result = DataBase::select($sql, [$kukudushi->id]);

        if (!empty($result) && isset($result[0]->total)) {
            return $result[0]->total;
        } else {
            return 0;
        }
    }

    public function getAllPointsData($kukudushi)
    {
    
        $sql = "SELECT * FROM wp_kukudushi_points WHERE kukudushi_id = %s ORDER BY date DESC";
    
        // Execute the query using the DataBase class
        $result = DataBase::select($sql, [$kukudushi->id]);
    
        // Assuming `DataBase::select` method is adapted to correctly handle the result check internally,
        // and directly return NULL or the results based on the query execution outcome.
        return $result;
    }

    public function dayStreak($kukudushi_id)
    {
        $sql = "SELECT CAST(date AS DATE) as date FROM wp_kukudushi_points WHERE kukudushi_id = %s AND type = %d ORDER BY date DESC LIMIT 5;";

        // Execute the query using the DataBase class
        $result = DataBase::select($sql, [$kukudushi_id, pointType::DAILY_SCAN]);

        $concurrentDays = 0;
        if (!empty($result)) 
        {
            $date = new DateTime('now', new DateTimeZone('America/Curacao'));
            $currentDay = $date->format('Y-m-d');
            $lastDate = null;

            foreach ($result as $row) 
            {
                $dbDate = $row->date;
                // For the first iteration, check if the most recent record matches today's date
                if (is_null($lastDate) && $dbDate == $currentDay) 
                {
                    $concurrentDays = 1;
                }
                elseif ($lastDate && strtotime($dbDate) == strtotime($lastDate . ' -1 day')) 
                {
                    $concurrentDays++;
                }
                else if ($lastDate && strtotime($dbDate) != strtotime($lastDate . ' -1 day'))
                {
                    // If the dates are not consecutive anymore, break the loop
                    break;
                }
                $lastDate = $dbDate;
            }
        }
        return $concurrentDays;
    }

    public function spend_points($kukudushi_id, $amount, $description)
    {
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
        $data = array(
            'kukudushi_id' => $kukudushi_id,
            'amount' => $amount,
            'date' => $dateTimeNow->format('Y-m-d H:i:s'),
            'description' => $description
        );

        $format = array('%s', '%d', '%s', '%s');
        $point_success = DataBase::insert('wp_kukudushi_points', $data, $format);



        $data = array(
            'kukudushi_id' => $kukudushi_id,
            /*'user_guid' => $guid,*/
            'action' => $amount . " points spent -> " . $description, 
            'origin' => "Dashboard purchase",
            'dt' => $dateTimeNow->format('Y-m-d H:i:s')
        );

        $format = array('%s', '%s', '%s', '%s');
        $action_success = DataBase::insert('wp_kukudushi_actions_user', $data, $format);

        return $point_success;
    }

    public function removePoints($pointId) {
        $where = array('id' => $pointId);
        return DataBase::delete('wp_kukudushi_points', $where);
    }

    public function reset_points($kukudushi)
    {
        $table_name = 'wp_kukudushi_points';
        $where = array('kukudushi_id' => $kukudushi->id);
        $where_format = array('%s');

        // Call the delete function
        $result = DataBase::delete($table_name, $where, $where_format);

        // Check the result
        if ($result) 
        {
            return true;
        }
        return false;
    }
    

    public function can_receive_points($kukudushi_id)
    {
        $sql = "SELECT * FROM wp_kukudushi_points WHERE kukudushi_id = %s  AND amount > 0  AND CAST(date AS DATE) = CAST(NOW() AS DATE);";
        $result = DataBase::select($sql, [$kukudushi_id]);

        if (!empty($result)) 
        {
            return false;
        }

        return true;

    }

}
?>