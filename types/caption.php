<?php
class Caption
{

    public $id; // Primary key, int(11)
    public $type; // int(11)
    public $caption_NL; // varchar(900), Dutch caption
    public $caption_EN; // varchar(900), English caption
    public $is_active; // tinyint(1)
    public $times_used; // tinyint(1), nullable
    public $used_date; // date
    public $added_datetime; // datetime

    //Constructor
    public function __construct()
    {
    }
}
?>