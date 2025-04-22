<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Metadata_DB
{
    public function getAllMetaData($kukudushi_id)
    {
        $sql = "SELECT
                    m.id,
                    m.kukudushi_id,
                    m.type,
                    m.metadata,
                    m.is_default,
                    m.datetime_created,
                    m.datetime_last_edit,
                    t.type_name AS type_name,
                    tm.type_name AS main_type_name,
                    tm.id AS main_type_id
                FROM
                    wp_kukudushi_item_metadata m
                JOIN
                    wp_kukudushi_types t ON m.type = t.type_id
                JOIN
                    wp_kukudushi_types_main tm ON t.main_type = tm.id
                WHERE
                    m.kukudushi_id = %s";

        $allMetadataResult = DataBase::select($sql, [$kukudushi_id]);

        if (!empty($allMetadataResult))
        {
            return $allMetadataResult;
        }
        return [];
    }

    public function getAllMetadataWithKey($metadata_key)
    {
        $sql = "SELECT * FROM wp_kukudushi_item_metadata WHERE metadata LIKE %s";

        $allMetadataResult = DataBase::select($sql, [$metadata_key]);

        if (!empty($allMetadataResult))
        {
            return $allMetadataResult;
        }
        return null;
    }

    public function setToDefault($metadata_id, $kukudushi_id)
    {
        DataBase::update(
            'wp_kukudushi_item_metadata', 
            ['is_default' => 0],
            ['kukudushi_id' => $kukudushi_id, 'is_default' => 1]
        );
    
        DataBase::update(
            'wp_kukudushi_item_metadata', 
            ['is_default' => 1],
            ['id' => $metadata_id]
        );
    }

    public function save($metadata_object)
    {
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
        $table_name = 'wp_kukudushi_item_metadata';

        // Prepare the data array with all properties of $metadata_object
        $data = [
            'kukudushi_id' => $metadata_object->kukudushi_id,
            'type' => $metadata_object->type_id,
            'metadata' => $metadata_object->metadata,
            'is_default' => $metadata_object->is_default ? 1 : 0,
            'datetime_last_edit' => $dateTimeNow->format('Y-m-d H:i:s'), // Assuming you want to use the current time
        ];

        if (!empty($metadata_object->id)) // Existing metadata
        {
            // Update existing metadata
            $where = ['id' => $metadata_object->id]; // Assuming 'id' is the correct column name in your table

            $result = DataBase::update($table_name, $data, $where);
        }
        else // New metadata
        {
            $result = DataBase::insert($table_name, $data, null, ['type']);
            if ($result)
            {
                $metadata_object->id = $result;
            }
        }

        return $metadata_object;
    }

    public function removeAllMetadata($kukudushi)
    {
        $table_name = 'wp_kukudushi_item_metadata';
        $where = array('kukudushi_id' => $kukudushi->id);
        $where_format = array('%s');

        // Call the delete function
        $result = DataBase::delete($table_name, $where, $where_format);

        // Check the result
        if ($result) 
        {
            return true;
        }
        return false;
    }

    public function removeMetadata($metadataId) {
        $where = array('id' => $metadataId);
        return DataBase::delete('wp_kukudushi_item_metadata', $where);
    }

    public function getAllMetadataWithTypeId($type_id)
    {
        $sql = "SELECT * FROM wp_kukudushi_item_metadata WHERE type LIKE %d";

        $allMetadataResult = DataBase::select($sql, [$type_id]);

        if (!empty($allMetadataResult))
        {
            return $allMetadataResult;
        }
        return null;
    }

    public function getAllMetadataWithAnimalId($animal_id)
    {

        $sql = "SELECT * FROM wp_kukudushi_item_metadata WHERE metadata = %s";

        $metadata = "animal_id=". strval($animal_id) .";";

        $allMetadataResult = DataBase::select($sql, [$metadata]);

        if (!empty($allMetadataResult))
        {
            return $allMetadataResult;
        }
        return null;
    }

    private function reset_default_metadata($metadata_object)
    {
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
        $table_name = 'wp_kukudushi_item_metadata';

        // Prepare the data array with all properties of $metadata_object
        $data = [
            'type' => $metadata_object->type_id,
            'metadata' => $metadata_object->metadata,
            'is_default' => $metadata_object->is_default,
            'datetime_last_edit' => $dateTimeNow->format('Y-m-d H:i:s'), // Assuming you want to use the current time
        ];
        $where = ['id' => $metadata_object->id]; // Assuming 'id' is the correct column name in your table

        $result = DataBase::update($table_name, $data, $where);
        
        return $metadata_object;
    }
}
?>