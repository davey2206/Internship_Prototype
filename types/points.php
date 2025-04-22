<?php

class Points
{
    public $id; // int(11), Primary Key, AUTO_INCREMENT
    public $kukudushi_id; // varchar(256)
    public $amount; // int(11)
    public $date; // datetime
    public $description; // varchar(256)

    public function __construct() 
    {
        
    }

    
}
