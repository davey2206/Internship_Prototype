<?php
class User
{
    public $id;
    public $data;
    public $display_name;
    public $roles;
    public $cookie_GUID;

    public function __construct() 
    {
        $this->id = 0;
        $this->data = null;
        $this->display_name = "";
        $this->roles = [];
        $this->cookie_GUID = "";
    }

    public function is_kukudushi_manager()
    {
        return $this->has_role("kukudushi_manager");
    }

    public function is_admin()
    {
        return $this->has_role("administrator");
    }

    private function has_role($role_name)
    {
        if ( in_array( $role_name, (array) $this->roles ) ) 
        {
            return true;
        }
        return false;
    }
}
