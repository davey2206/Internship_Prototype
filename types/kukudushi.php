<?php
class Kukudushi {
    // Properties
    public $id;
    public $name;
    public $type_id;
    public $model_id;
    public $sell_loc_id;
    public $type_name;
    public $language;
    public $temporary_id;
    public $media;
    public $new_user;
    public $metadata;
    public $points;
    
    //Custom properties that do not exist in db
    public $exists;
    public $temporary_id_expired;

    //Constructor
    public function __construct()
    {
    }

    public function getDefaultMetaData()
    {
        foreach ($this->metadata as $metadata)
        {
            if ($metadata->is_default)
            {
                    return $metadata;
            }
        }
        return NULL;
    }

    public function hasDefaultMetaData()
    {
        if ($this->getDefaultMetaData() != NULL)
        {
            return true;
        }
        
        return false;
    }

    public function getMetadataFromType($main_type_name)
    {
        $typed_metadata = [];
        foreach ($this->metadata as $metadata)
        {
            if (strtolower($metadata->main_type_name) == strtolower($main_type_name))
            {
                    if ($metadata->is_default)
                    {
                        array_unshift($typed_metadata, $metadata);
                    }
                    else
                    {
                        array_push($typed_metadata, $metadata);
                    }
            }
        }
        return $typed_metadata;
    }

    public function getMetadataFromId($id)
    {
            foreach ($this->metadata as $metadata)
            {
                if ($metadata->id == $id)
                {
                    return $metadata;
                }
            }
            return NULL;
    }

}
?>