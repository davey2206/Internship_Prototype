<?php
class Settings_Manager
{
    private static $instance = null;
    public $_kukudushi_base_url;
    public $_kukudushi_base_path;
    public $_kukudushi_custom_dir_path;
    public $_kukudushi_custom_dir_url;
    public $_kukudushi_custom_media_dir_path;
    public $_kukudushi_custom_media_dir_url;
    public $_kukudushi_user_media_upload_dir_path;
    public $_kukudushi_user_media_upload_dir_url;
    public $_kukudushi_animal_pictures_dir_path;
    public $_kukudushi_animal_pictures_dir_url;
    public $_kukudushi_javascript_dir_url;
    public $_kukudushi_form_handles_dir_url;

    /* Images */
    public $_kukudushi_logo_transparent;

    private function __construct()
    {
        $parentDirectoryName = basename(dirname(__FILE__, 5));
        $protocol = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://";
        $this->_kukudushi_base_url = $protocol . $parentDirectoryName;

        $this->_kukudushi_custom_dir_path = dirname(__FILE__, 2);
        $this->_kukudushi_custom_dir_url = $this->_kukudushi_base_url . "/wp-content/plugins/kukudushi-engine";

        $this->_kukudushi_custom_media_dir_path = $this->_kukudushi_custom_dir_path . "/media";
        $this->_kukudushi_custom_media_dir_url = $this->_kukudushi_custom_dir_url . "/media";

        $this->_kukudushi_user_media_upload_dir_path = $this->_kukudushi_custom_media_dir_path . "/custom_media_user_uploads";
        $this->_kukudushi_user_media_upload_dir_url = $this->_kukudushi_custom_media_dir_url . "/custom_media_user_uploads";
        
        $this->_kukudushi_animal_pictures_dir_path = $this->_kukudushi_custom_media_dir_path . "/animal_pictures";
        $this->_kukudushi_animal_pictures_dir_url = $this->_kukudushi_custom_media_dir_url . "/animal_pictures";

        $this->_kukudushi_javascript_dir_url = $this->_kukudushi_custom_dir_url . "/js";
        $this->_kukudushi_form_handles_dir_url = $this->_kukudushi_custom_dir_url . "/form_handles";

        /* Images */
        $this->_kukudushi_logo_transparent = $this->_kukudushi_base_url . "/wp-content/uploads/2023/10/cropped-Artboard-7-192x192.png";
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new Settings_Manager();
        }
        return self::$instance;
    }
}

?>