<?php
class MetaData
{
    public $id;
    public $kukudushi_id;
    public $type_id;
    public $type_name;
    public $main_type_name;
    public $main_type_id;
    public $metadata;
    public $is_default;
    public $datetime_created;
    public $datetime_last_edit;

    public function __construct()
    {

    }

    public function getValue($key)
    {
        if ($this->metadata == NULL || empty($this->metadata)) {
            return NULL;
        }
        $vars = explode(";", $this->metadata);

        if (count($vars) > 0) {
            foreach ($vars as $var) {
                $splitted = explode("=", $var);
                if ($splitted[0] == $key) {
                    return $splitted[1];
                }
            }
        }

        return NULL;
    }
}

?>