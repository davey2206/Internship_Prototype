<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Badges_DB
{
    public function createBadgeStats($kukudushi_id) {
        //to be changed to current amounts if not new account
        $data = array(
            'kukudushi_id' => $kukudushi_id,
            'coins' => 0,
            'animals' => 0,
            'facts' => 0,
        );

        $format = array('%s', '%d', '%d', '%d');

        $inserted_id = DataBase::insert('wp_kukudushi_badge_stats', $data, $format);
        return $inserted_id;
    }

    public function getBadgeStats($kukudushi_id)
    {
        $sql = "SELECT coins, animals, facts FROM wp_kukudushi_badge_stats WHERE kukudushi_id = %s";

        // Execute the query using the DataBase class
        $result = DataBase::select($sql, [$kukudushi_id]);

        if (empty($result)) {
            $this->createBadgeStats($kukudushi_id);

            $data = array(
                'coins' => 0,
                'animals' => 0,
                'facts' => 0,
            );

            $data = (object) $data;

            return $data;
        }
        else{
            return $result[0];
        }
    }

    public function updateBadgePoints($kukudushi_id, $amount) {
        $sql = "SELECT coins FROM wp_kukudushi_badge_stats WHERE kukudushi_id = %s";

        $result = DataBase::select($sql, [$kukudushi_id]);

        $amount = $amount + $result[0]->coins;
        
        DataBase::update(
            'wp_kukudushi_badge_stats', 
            ['coins' => $amount],
            ['kukudushi_id' => $kukudushi_id]
        );
    }

    public function updateBadgeAnimals($kukudushi_id, $amount) {
        $sql = "SELECT animals FROM wp_kukudushi_badge_stats WHERE kukudushi_id = %s";

        $result = DataBase::select($sql, [$kukudushi_id]);

        $amount = $amount + $result[0]->animals;
        
        DataBase::update(
            'wp_kukudushi_badge_stats', 
            ['animals' => $amount],
            ['kukudushi_id' => $kukudushi_id]
        );
    }

    public function updateBadgeFacts($kukudushi_id, $amount) {
        $sql = "SELECT facts FROM wp_kukudushi_badge_stats WHERE kukudushi_id = %s";

        $result = DataBase::select($sql, [$kukudushi_id]);

        $amount = $amount + $result[0]->facts;
        
        DataBase::update(
            'wp_kukudushi_badge_stats', 
            ['facts' => $amount],
            ['kukudushi_id' => $kukudushi_id]
        );
    }
}
?>