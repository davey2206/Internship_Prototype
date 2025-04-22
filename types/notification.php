<?php
class Notification
{
    public $id; // int(11), Primary Key, AUTO_INCREMENT
    public $ext_operator_id; // int(11)
    public $operator_message_id; // int(11)
    public $kukudushi_id; // varchar(256)
    public $message; // varchar(1024)
    public $image; // varchar(256)
    public $timeout; // int(11)
    public $max_view_count; // int(4)
    public $is_active; // tinyint(1)
    public $view_count; // int(4)
    public $read_datetime; // datetime, defaults to 0000-00-00 00:00:00
    public $active_date; // date
    public $expiration_date; // date

    public function __construct() 
    {
         
    }
        
}
