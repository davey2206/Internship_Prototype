<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_metadata);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_metadata);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_metadata_property);

class MetaData_Manager
{
    private static $instance = null;
    private $metadata_db;

    private function __construct()
    {
        $this->metadata_db = new Metadata_DB();
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new MetaData_Manager();
        }
        return self::$instance;
    }

    public function getAllMetaData($kukudushi_id)
    {
        $allMetadataResult = $this->metadata_db->getAllMetaData($kukudushi_id);
        $allMetadata = [];

        foreach ($allMetadataResult as $metadata) 
        {
            $allMetadata[] = $this->getMetadataObjectFromDbResult($metadata);
        }

        return $allMetadata;
    }

    public function getAllMetadataWithKey($metadata_key)
    {
        $allMetadataResult = $this->metadata_db->getAllMetadataWithKey($metadata_key);
        $allMetadata = [];

        foreach ($allMetadataResult as $metadata) 
        {
            $allMetadata[] = $this->getMetadataObjectFromDbResult($metadata);
        }

        return $allMetadata;
    }

    public function setToDefault($metadata_id, $kukudushi_id)
    {
        return $this->metadata_db->setToDefault($metadata_id, $kukudushi_id);
    }

    public function save($metadata)
    {
        return $this->metadata_db->save($metadata);
    }

    public function removeAllMetadata($kukudushi)
    {
        return $this->metadata_db->removeAllMetadata($kukudushi);
    }

    public function getAllMetadataWithAnimalId($animal_id)
    {
        $result_metadata = $this->metadata_db->getAllMetadataWithAnimalId($animal_id);

        $allMetadata = [];

        foreach ($result_metadata as $metadata) 
        {
            $allMetadata[] = $this->getMetadataObjectFromDbResult($metadata);
        }

        return $allMetadata;
    }
    
    public function getAllMetadataWithTypeId($type_id)
    {
        $result_metadata = $this->metadata_db->getAllMetadataWithTypeId($type_id);

        $allMetadata = [];

        foreach ($result_metadata as $metadata) 
        {
            $allMetadata[] = $this->getMetadataObjectFromDbResult($metadata);
        }

        return $allMetadata;
    }

    public function removeMetadata($metadataId) {
        return $this->metadata_db->removeMetadata($metadataId);
    }

    public function getMetadataObjectFromDbResult($metadata)
    {
        $metadata_obj = new MetaData();
        $metadata_obj->id = $metadata->id;
        $metadata_obj->kukudushi_id = $metadata->kukudushi_id;
        $metadata_obj->type_id = $metadata->type;
        if (!empty($metadata->type_name))
        {
            $metadata_obj->type_name = $metadata->type_name;
        }
        if (!empty($metadata->main_type_name))
        {
            $metadata_obj->main_type_name = $metadata->main_type_name;
        }
        if (!empty($metadata->main_type_id))
        {
            $metadata_obj->main_type_id = $metadata->main_type_id;
        }
        $metadata_obj->metadata = $metadata->metadata;
        $metadata_obj->is_default = $metadata->is_default == 1;
        $metadata_obj->datetime_created = $metadata->datetime_created;
        $metadata_obj->datetime_last_edit = $metadata->datetime_last_edit;
        return $metadata_obj;
    }
}



?>