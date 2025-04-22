<?php

class Media_Link
{
    // Properties
    public $id; // Assuming id is an integer
    public $kukudushi_id; // Assuming kukudushi_id is a string
    public $url = ""; // Assuming url is a string
    public $type; // Assuming type is a string
    public $datetime; // Assuming datetime is a datetime
    public $is_active; // Assuming is_active is a boolean (tinyint(1))

    // Constructor with an optional parameter
    public function __construct($id = null) 
    {
    }
}
