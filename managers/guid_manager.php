<?php

    class GUID_Manager
    {
        private static $instance = null;

        private function __construct()
        {
        }

        public static function Instance()
        {
            if (self::$instance === null) 
            {
                self::$instance = new GUID_Manager();
            }
            return self::$instance;
        }

        public function getGUID()
        {
            if (function_exists('com_create_guid')) 
            {
                return com_create_guid();
            } 
            else 
            {
                mt_srand(intval(microtime(true) * 10000)); //optional for php 4.2.0 and up.
                $charid = strtoupper(md5(uniqid(rand(), true)));
                $hyphen = chr(45); // "-"
                $uuid = substr($charid, 0, 8) . $hyphen
                    . substr($charid, 8, 4) . $hyphen
                    . substr($charid, 12, 4) . $hyphen
                    . substr($charid, 16, 4) . $hyphen
                    . substr($charid, 20, 12);
                return $uuid;
            }
        }
    }

?>