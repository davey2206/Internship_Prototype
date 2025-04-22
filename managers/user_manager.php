<?php
// Start output buffering
ob_start();

if(!session_id()) 
{
    @session_start();
}


//load wordpress
require_once(dirname(__FILE__, 5) . '/wp-load.php');

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_user);

class User_Manager
{
    private static $instance = null;
    public $current_user;
    public $setUserGuid_js = "";

    private function __construct()
    {
        //add_action('wp_loaded', array($this, 'initialize_user'));
        $this->initialize_user();
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new User_Manager();
        }
        return self::$instance;
    }

    public function initialize_user()
    {
        [$setUserGuid_js, $user] = $this->get_current_user();
        $this->setUserGuid_js = $setUserGuid_js;
        $this->current_user = $user;
    }

    public function get_current_user()
    {
        $user = new User();

        if (is_user_logged_in()) 
        {
            $wp_user = wp_get_current_user();
            $user->id = $wp_user->ID;
            $user->data = $wp_user->data;
            $user->roles = $wp_user->roles;
            $user->display_name = $wp_user->display_name;
        }
        else
        {
            $user->id = 0;
            $user->data = NULL;
            $user->roles = [];
            $user->display_name = "";
        }

        [$setUserGuid_js, $userGUID] = $this->getUserGuid();
        $user->cookie_GUID = $userGUID;

        return [$setUserGuid_js, $user];
    }

    public function getUserGuid()
    {
        $setUserGuid_js = "";
        $userGUID = "";

        if (!isset($_COOKIE["GUID"]))
        {
            $guidManager = GUID_Manager::Instance(); // Ensure GUID_Manager is defined elsewhere
            $guid = $guidManager->getGUID();

            $setUserGuid_js = 'document.cookie = "GUID=' . $guid . '; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT";';
            //setcookie("GUID", $guid, time() + 3600 * 24 * 365, "/"); // Removed domain parameter for simplicity
            
            $userGUID = $guid;
        }
        else
        {
            $userGUID = $_COOKIE["GUID"];
        }
        return [$setUserGuid_js, $userGUID];
    }
}

// End output buffering and flush output
ob_end_flush();
?>