<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Media_Link_DB
{
    public function getLinkById(string $link_id)
    {
        //Get link
        $result = DataBase::select("SELECT * FROM wp_kukudushi_links WHERE id = " . $link_id . ";");

        if (count($result) > 0)
        {
            return $result[0];
        }
        else
        {
            return NULL;
        }
    }

    public function set_old_links_inactive($kukudushi_id)
    {
        $data = [
            'is_active' => 0,
        ];
        $where = [
            'kukudushi_id' => $kukudushi_id, // Condition to match the specific kukudushi_id
        ];
        $result = DataBase::update('wp_kukudushi_links', $data, $where);
        
        if ($result) {
            //Succesful
        } else {
            //Failed
        }
    }

    public function save($link_object)
    {
        $inserted_id = 0;
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
        $data = array(
            'kukudushi_id' => $link_object->kukudushi_id, // Assuming $kukudushi->id is a string or integer
            'url' => $link_object->url, // Assuming $url is a string
            'type' => $link_object->type, // Assuming $fileType is a string
            'datetime' => $dateTimeNow->format('Y-m-d H:i:s') // Formats the date in MySQL datetime format
        );

        // Optionally, specify the format for each field if you want to explicitly define data types.
        $format = array('%s', '%s', '%s', '%s'); // Adjust the format specifiers based on the actual data types of the fields

        // Execute the insert operation using DataBase::insert
        $inserted_id = DataBase::insert('wp_kukudushi_links', $data, $format, ['type']);

        $link_object->id = $inserted_id;
        return $link_object;
    }
}
?>