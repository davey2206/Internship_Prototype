<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_logger);

//load wordpress
defined('WP_USE_THEMES') or define('WP_USE_THEMES', false);
require_once(dirname(__FILE__, 5) .'/wp-load.php');

class DataBase 
{
    public static $db_instance;
    public static $logger;

    // Change private to public for explicit initialization
    public static function initialize() 
    {
        if (!isset(self::$db_instance)) 
        {
            global $wpdb;
            self::$db_instance = $wpdb;   
        }
        if (!isset(self::$logger)) 
        {
            self::$logger = new Logger();   
        }

        // Set time zone here if it's a one-time global setting
        self::$db_instance->query("SET time_zone='America/Curacao';");
    }

    private static function sanitizeData($data, $allowRaw = false, $bypassFields = ['message', 'description']) 
    {
        $sanitizedData = [];
        foreach ($data as $key => $value) {
            // Check if this field is marked for bypass
            if (in_array($key, $bypassFields)) {
                $sanitizedData[$key] = $value;
                continue;
            }

            // Handle null values explicitly
            if (is_null($value)) {
                $sanitizedData[$key] = null;
                continue;
            }

            // Handle raw SQL expressions
            if ($allowRaw && is_array($value) && isset($value['raw'])) {
                $sanitizedData[$key] = $value['raw'];
                continue;
            }

            // Handle scalar values (including empty string)
            if (is_scalar($value)) {
                if (is_bool($value)) {
                    $sanitizedData[$key] = $value;
                } else if (is_int($value)) {
                    $sanitizedData[$key] = filter_var($value, FILTER_SANITIZE_NUMBER_INT);
                } else if (is_float($value)) {
                    $sanitizedData[$key] = filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
                } else if (is_string($value)) {
                    $sanitizedData[$key] = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                }
                continue;
            }

            // If we get here, we have an unsupported type
            throw new InvalidArgumentException("Unsupported value type " . gettype($value) . " encountered in sanitizeData for key '$key'");
        }

        return $sanitizedData;
    }

    public static function select($sql, $data = []) 
    {
        self::initialize();
        // Initial SQL remains unchanged
        $prepared_sql = $sql;

        if (!empty($data)) 
        {
            // Sanitize data
            $sanitized_data = self::sanitizeData($data, false);
            // Prepare SQL with sanitized data
            $prepared_sql = self::$db_instance->prepare($sql, array_values($sanitized_data));
        }

        // Execute the query
        $results = self::$db_instance->get_results($prepared_sql);
        
        // Error handling
        if ($results === false) 
        {
            $errorMsg = 'Database select failed: ' . self::$db_instance->last_error;
            self::$logger->error($errorMsg);
        }

        return $results;
    }

    // Updated insert function to utilize sanitizeData and inferDataFormat
    public static function insert($table_name, $data, $format = null, $bypassFields = null) 
    {
        self::initialize(); // Ensure the database is initialized

        // Use the sanitizeData method to clean the input data
        if (!empty($bypassFields))
        {
            $sanitized_data = self::sanitizeData($data, true, $bypassFields);
        }
        else
        {
            $sanitized_data = self::sanitizeData($data, true);
        }

        // If format array is not provided, use inferDataFormat to infer data types
        if (is_null($format)) 
        {
            $format = self::inferDataFormat($sanitized_data);
        }

        // Perform the insert operation
        if (self::$db_instance->insert($table_name, $sanitized_data, $format)) 
        {
            return self::$db_instance->insert_id; // Return the inserted row's ID
        } 
        else 
        {
            $last_error = self::$db_instance->last_error;
            if ($table_name != "wp_kukudushi_animals_locations" || !str_contains($last_error, "uniqueHash"))
            {
                $errorMsg = 'Database insert failed: ' . $last_error;
                self::$logger->error($errorMsg);
            }
            return false;
        }
    }

    public static function insertIgnore($table_name, $data, $format = null) 
    {
        self::initialize(); // Ensure the database is initialized

        $columns = [];
        $placeholders = [];
        $values = []; // Values to be prepared

        foreach ($data as $key => $value) 
        {
            $columns[] = "`$key`";
            if (is_array($value) && isset($value['raw'])) 
            {
                // If the value contains a 'raw' key, include it directly in the placeholders string
                $placeholders[] = $value['raw'];
            } 
            else 
            {
                // For regular values, use placeholders and add the value to the values array
                $placeholders[] = '%s';
                $values[] = $value;
            }
        }

        // Construct the SQL query for INSERT IGNORE
        $columns_string = implode(', ', $columns);
        $placeholders_string = implode(', ', $placeholders);
        $sql = "INSERT IGNORE INTO `$table_name` ($columns_string) VALUES ($placeholders_string)";

        // If there are values to prepare, use wpdb::prepare; otherwise, the query is ready as is
        if (!empty($values)) 
        {
            $prepared_sql = self::$db_instance->prepare($sql, $values);
        } 
        else 
        {
            // If there are no regular values (only raw expressions), no need to prepare
            $prepared_sql = $sql;
        }

        // Execute the query
        if (self::$db_instance->query($prepared_sql)) 
        {
            if (self::$db_instance->insert_id > 0) 
            {
                return self::$db_instance->insert_id; // Return the inserted row's ID if a new row was inserted
            } 
            else 
            {
                return true; // Return true if the row already exists (no new row inserted)
            }
        } 
        else 
        {
            $errorMsg = 'Database insertIgnore failed: ' . self::$db_instance->last_error;
            self::$logger->error($errorMsg);
            return false;
        }
    }




    // Update method
    public static function update($table_name, $data, $where, $format = null, $where_format = null) 
    {
        self::initialize();
        $sanitized_data = self::sanitizeData($data);
        $sanitized_where = self::sanitizeData($where);

        // Infer format if not provided
        if (is_null($format)) 
        {
            $format = self::inferDataFormat($sanitized_data);
        }

        // Infer where_format if not provided
        if (is_null($where_format))
        {
            $where_format = self::inferDataFormat($sanitized_where);
        }

        // Execute update operation
        $updateResult = self::$db_instance->update($table_name, $sanitized_data, $sanitized_where, $format, $where_format);


        if ($updateResult === false) 
        {
            $errorMsg = 'Database update failed: ' . self::$db_instance->last_error;
            self::$logger->error($errorMsg);
            return false;
        } 
        else 
        {
            return true; // Update successful
        }
    }

    public static function updateWithRaw($table_name, $data, $where) 
    {
        self::initialize();

        // Start building the SQL statement
        $sql = "UPDATE `$table_name` SET ";

        $setClauses = [];
        $values = [];
        foreach ($data as $column => $value) 
        {
            if (is_array($value) && isset($value['raw'])) 
            {
                // If the value is an array with a 'raw' key, treat it as raw SQL
                $setClauses[] = "`$column` = {$value['raw']}";
            } 
            else 
            {
                // For regular values, use placeholders and add the value to the $values array
                $setClauses[] = "`$column` = %s";
                $values[] = $value;
            }
        }
        $sql .= implode(', ', $setClauses);

        // Add WHERE conditions
        $whereClauses = [];
        foreach ($where as $column => $value) 
        {
            $whereClauses[] = "`$column` = %s";
            $values[] = $value;
        }
        if (!empty($whereClauses)) 
        {
            $sql .= " WHERE " . implode(' AND ', $whereClauses);
        }


        $prepared_sql = $sql;
        // Check if there are non-raw values to bind; if so, prepare the statement
        if (!empty($values)) 
        {
            $prepared_sql = self::$db_instance->prepare($sql, $values);
        } 

        // Execute the query
        if (self::$db_instance->query($prepared_sql) !== false) 
        {
            return true; // Update successful
        } 
        else 
        {
            $errorMsg = 'Database updateWithRaw failed: ' . self::$db_instance->last_error;
            self::$logger->error($errorMsg);
            return false;
        }
    }

    // Delete method
    public static function delete($table_name, $where, $where_format = null) 
    {
        self::initialize();
        $sanitized_where = self::sanitizeData($where);

        if (is_null($where_format)) 
        {
            $where_format = self::inferDataFormat($sanitized_where);
        }

        if (self::$db_instance->delete($table_name, $sanitized_where, $where_format)) 
        {
            return true; // Delete successful
        } 
        else 
        {
            $errorMsg = 'Database delete failed: ' . self::$db_instance->last_error;
            self::$logger->error($errorMsg);
            return false;
        }
    }

    /**
     * Performs a batch insert operation
     */
    public static function batchInsert($table_name, $data_array, $format = null) 
    {
        self::initialize();
        $inserted_ids = [];

        try {
            // Begin transaction for better performance
            self::$db_instance->query('START TRANSACTION');

            foreach ($data_array as $data) {
                $sanitized_data = self::sanitizeData($data);
                
                // Infer format if not provided
                $current_format = $format ?? self::inferDataFormat($sanitized_data);
                
                $result = self::$db_instance->insert($table_name, $sanitized_data, $current_format);
                if ($result) {
                    $inserted_ids[] = self::$db_instance->insert_id;
                } else {
                    // Log error but continue with other insertions
                    self::$logger->error("Failed to insert record in batch: " . self::$db_instance->last_error);
                }
            }

            // Commit transaction
            self::$db_instance->query('COMMIT');
            return $inserted_ids;

        } catch (Exception $e) {
            // Rollback on error
            self::$db_instance->query('ROLLBACK');
            self::$logger->error("Batch insert failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Updates multiple records that match the where clause
     */
    public static function batchUpdate($table_name, $data, $where_in_column, $where_in_values) 
    {
        self::initialize();
        
        try {
            // Sanitize inputs
            $sanitized_data = self::sanitizeData($data);
            $sanitized_values = array_map(function($value) {
                return self::$db_instance->prepare('%s', $value);
            }, $where_in_values);

            // Build SET clause
            $set_parts = [];
            foreach ($sanitized_data as $key => $value) {
                $set_parts[] = "`$key` = " . self::$db_instance->prepare('%s', $value);
            }
            $set_clause = implode(', ', $set_parts);

            // Build WHERE IN clause
            $where_values = implode(',', $sanitized_values);
            
            // Construct and execute query
            $sql = self::$db_instance->prepare(
                "UPDATE `$table_name` SET $set_clause WHERE `$where_in_column` IN ($where_values)"
            );

            $result = self::$db_instance->query($sql);
            
            if ($result === false) {
                self::$logger->error("Batch update failed: " . self::$db_instance->last_error);
                return false;
            }
            
            return true;

        } catch (Exception $e) {
            self::$logger->error("Batch update failed: " . $e->getMessage());
            return false;
        }
    }

    // Helper method to infer data format
    private static function inferDataFormat($data) 
    {
        $format = array();
        foreach ($data as $value) 
        {
            if (is_int($value)) 
            {
                $format[] = '%d';
            } 
            elseif (is_float($value)) 
            {
                $format[] = '%f';
            } 
            else 
            {
                $format[] = '%s';
            }
        }
        return $format;
    }
}

?>