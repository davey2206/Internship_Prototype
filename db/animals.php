<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_animal);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Animals_DB
{

    public function getAllActiveAndAssociatedAnimals($kukudushi_id)
    {
        $sql = "SELECT DISTINCT 
                    a.*, 
                    s.species_name AS species, 
                    a.species AS species_id, 
                    m.species_name AS main_species, 
                    m.id AS main_species_id, 
                    s.conservation_description AS conservation_description, 
                    cs.name AS conservation_status, 
                    cs.rating AS conservation_rating
                FROM wp_kukudushi_animals a
                JOIN wp_kukudushi_animals_species s ON a.species = s.id
                JOIN wp_kukudushi_animals_species_main m ON s.main_species_id = m.id
                LEFT JOIN wp_kukudushi_animals_conservation_status cs ON s.conservation_status_id = cs.id
                LEFT JOIN wp_kukudushi_item_metadata meta ON meta.metadata LIKE CONCAT('animal_id=', a.id, ';')
                WHERE a.is_active = 1 
                OR (meta.kukudushi_id = %s)
                ORDER BY s.species_name ASC, a.name ASC;";

        $results = DataBase::select($sql, [$kukudushi_id]);
        
        if (!empty($results)) 
        {
            return $results;
        }

        return null;
    }

    public function getAllAnimals($only_active = false, $sort_species = false)
    {
        // Initialize parts of the query that can be dynamic
        $whereClauses = [];
        $orderByClauses = [];

        // Determine if we need to filter by active status
        if ($only_active) {
            $whereClauses[] = "a.is_active = 1";
        }

        // Determine sorting
        if ($sort_species) {
            $orderByClauses[] = "s.species_name ASC";
            $orderByClauses[] = "a.name ASC";
        }

        // Build the WHERE clause SQL, if needed
        $whereSql = !empty($whereClauses) ? " WHERE " . implode(' AND ', $whereClauses) : "";

        // Build the ORDER BY clause SQL, if needed
        $orderBySql = !empty($orderByClauses) ? " ORDER BY " . implode(', ', $orderByClauses) : "";

        $sql = "SELECT 
            a.id, 
            a.origin_type, 
            a.ext_site, 
            a.ext_id, 
            a.ext_data_id, 
            a.name, 
            a.imageurl, 
            s.species_name AS species, 
            a.species AS species_id, 
            m.species_name AS main_species, 
            m.id AS main_species_id, 
            a.gender, 
            a.weight, 
            a.length, 
            a.life_stage, 
            a.description, 
            a.is_active, 
            a.last_refresh, 
            a.ext_active, 
            a.track_step, 
            a.track_step_interval, 
            s.conservation_description, 
            cs.name AS conservation_status, 
            cs.rating AS conservation_rating
        FROM wp_kukudushi_animals a 
        JOIN wp_kukudushi_animals_species s ON a.species = s.id
        JOIN wp_kukudushi_animals_species_main m ON s.main_species_id = m.id
        LEFT JOIN wp_kukudushi_animals_conservation_status cs ON s.conservation_status_id = cs.id"
        . $whereSql . $orderBySql . ";";

        $results = DataBase::select($sql);

        if (!empty($results)) {
            return $results;
        }

        return null;
    }

    public function getAllAnimalsForAdminViewer($only_active = false)
    {
        // Start with the base SQL query
        $sql = "SELECT
            A.id, 
            A.origin_type, 
            A.ext_site, 
            A.ext_id, 
            A.ext_data_id, 
            A.name, 
            A.imageurl, 
            S.species_name AS species, 
            A.species AS species_id, 
            M.species_name AS main_species, 
            M.id AS main_species_id, 
            A.gender, 
            A.weight, 
            A.length, 
            A.life_stage, 
            A.description, 
            A.is_active, 
            A.last_refresh, 
            A.ext_active, 
            A.track_step, 
            A.track_step_interval, 
            L.dt_move_max AS max_dt_move, 
            L.dt_move_min AS min_dt_move,
            L.move_count AS location_count,
            S.conservation_description, 
            CS.name AS conservation_status, 
            CS.rating AS conservation_rating
        FROM
            wp_kukudushi_animals A
        RIGHT JOIN (
            SELECT
                ext_id,
                MAX(dt_move) AS dt_move_max,
                MIN(dt_move) AS dt_move_min,
                COUNT(dt_move) AS move_count
            FROM
                wp_kukudushi_animals_locations
            GROUP BY
                ext_id
        ) L ON A.id = L.ext_id
        JOIN wp_kukudushi_animals_species S ON A.species = S.id
        JOIN wp_kukudushi_animals_species_main M ON S.main_species_id = M.id
        LEFT JOIN wp_kukudushi_animals_conservation_status CS ON S.conservation_status_id = CS.id
        WHERE A.species != 0";

        // Append the only_active condition if necessary
        if ($only_active) {
            $sql .= " AND A.is_active = 1"; // Use a strict comparison for clarity and safety
        }

        // Append the ORDER BY clause
        $sql .= " ORDER BY A.is_active DESC, A.species ASC, L.move_count DESC, A.name ASC;";

        // Execute the query using the DataBase class
        $results = DataBase::select($sql);

        if (!empty($results)) {
            return $results;
        }

        return null;
    }

    public function getAllActiveAnimals()
    {
        $results = DataBase::select("SELECT 
                                a.*, 
                                s.species_name AS species, 
                                a.species AS species_id, 
                                m.species_name AS main_species, 
                                m.id AS main_species_id, 
                                s.conservation_description AS conservation_description, 
                                cs.name AS conservation_status, 
                                cs.rating AS conservation_rating
                            FROM wp_kukudushi_animals a
                            JOIN wp_kukudushi_animals_species s ON a.species = s.id
                            JOIN wp_kukudushi_animals_species_main m ON s.main_species_id = m.id
                            LEFT JOIN wp_kukudushi_animals_conservation_status cs ON s.conservation_status_id = cs.id
                            WHERE a.is_active
                            ORDER BY s.species_name ASC, a.name ASC;");
        
        if (!empty($results)) 
        {
            return $results;
        }

        return null;
    }

    public function getAnimalById($animal_id)
    {
        if (empty($animal_id))
        {
            return null;
        }
        
        $sql = "SELECT 
            a.id, 
            a.origin_type, 
            a.ext_site, 
            a.ext_id, 
            a.ext_data_id, 
            a.name, 
            a.imageurl, 
            s.species_name AS species, 
            a.species AS species_id, 
            m.species_name AS main_species, 
            m.id AS main_species_id, 
            a.gender, 
            a.weight, 
            a.length, 
            a.life_stage, 
            a.description, 
            a.is_active, 
            a.last_refresh, 
            a.ext_active, 
            a.track_step, 
            a.track_step_interval,
            s.conservation_description AS conservation_description, 
            cs.name AS conservation_status, 
            cs.rating AS conservation_rating
        FROM wp_kukudushi_animals a 
        JOIN wp_kukudushi_animals_species s ON a.species = s.id
        JOIN wp_kukudushi_animals_species_main m ON s.main_species_id = m.id
        LEFT JOIN wp_kukudushi_animals_conservation_status cs ON s.conservation_status_id = cs.id
        WHERE a.id = %d;"; // Using placeholder for prepared statement

        // Execute the query with the provided animal_id as a parameter
        $result = DataBase::select($sql, [$animal_id]);

        if (!empty($result)) 
        {
            return $result[0]; // Corrected variable name from $results to $result
        }

        return null;
    }

    public function setAnimalLastRefresh($animal_id)
    {
        // Ensure the animal ID is not empty and is a valid number
        if (empty($animal_id) || !is_numeric($animal_id)) {
            return false; // Return false or handle error as appropriate
        }

        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));

        // Prepare data for updating the last_refresh column
        $data = ['last_refresh' => $dateTimeNow->format('Y-m-d H:i:s')]; // Use WordPress's current_time function for MySQL format
        $where = ['id' => $animal_id];

        // Perform the update using DataBase class
        $result = DataBase::update('wp_kukudushi_animals', $data, $where);

        return $result; // The update method should return true on success, false on failure
    }


    public function setAnimalExtActive($animal_id, $active)
    {
        // Ensure the animal ID is not empty and is a valid number
        if (empty($animal_id) || !is_numeric($animal_id)) {
            return false; // Return false or handle error as appropriate
        }

        // Data to update: setting ext_active to false (0)
        $data = ['ext_active' => $active ? 1 : 0];
        $where = ['id' => $animal_id];

        // Perform the update using DataBase class
        $result = DataBase::update('wp_kukudushi_animals', $data, $where);

        return $result; // The update method should return true on success, false on failure
    }

    public function setAnimalActive($animal_id, $active)
    {
        if (empty($animal_id) || !is_numeric($animal_id)) 
        {
            return false;
        }

        $data = ['is_active' => $active ? 1 : 0];
        $where = ['id' => $animal_id];

        $result = DataBase::update('wp_kukudushi_animals', $data, $where);

        return $result;
    }

    public function save_animal_information($animal)
    {
        // Table name
        $table_name = "wp_kukudushi_animals";

        $data = [
            'name' => $animal->name,
            'species' => $animal->species,
            'gender' => $animal->gender,
            'weight' => $animal->weight,
            'length' => $animal->length,
            'life_stage' => $animal->life_stage,
            'description' => $animal->description,
            'is_active' => $animal->active
        ];
        $where = ['id' => $animal->id];

        $format = ['%s', '%d', '%s', '%s', '%s', '%d', '%s', '%d'];
        $where_format = ['%d'];

        //returns true or false
        return DataBase::update($table_name, $data, $where, $format, $where_format);
    }

    public function getAnimalsFromOriginType($origin_type)
    {
        // Prepare the data for the query
        $data = ['origin_type' => $origin_type];
        
        // Use the DataBase class to safely execute the select query
        $animalsArray = DataBase::select("SELECT * FROM wp_kukudushi_animals WHERE origin_type = %d", $data);
    
        if (!empty($animalsArray)) 
        {
            return $animalsArray;
        } 
    
        return null;
    }

    public function restartAnimalTrack($animal_id, $starting_steps_count, $steps_interval = 1)
    {
        // Table name
        $table_name = "wp_kukudushi_animals";

        $data = [
            'track_step' => $starting_steps_count,   
            'track_step_interval' => $steps_interval,
            'is_active' => 1,
        ];
        $where = ['id' => $animal_id];

        $format = ['%d', '%d', '%d'];
        $where_format = ['%d'];

        $result = DataBase::update($table_name, $data, $where, $format, $where_format);

        return $result;
    }
    


    public function getAnimalFunFacts($animal_species_id)
    {
        // Ensure the animal_species_id is not empty and is a valid number
        if (empty($animal_species_id) || !is_numeric($animal_species_id)) {
            return []; // Return an empty array or handle error as appropriate
        }

        // Prepare the SQL query using placeholders for parameters
        $sql = "SELECT * FROM wp_kukudushi_animals_trivia WHERE species_id = %d;";

        // Execute the query using the DataBase class with the parameterized query and parameters
        $animalFunFacts = DataBase::select($sql, [$animal_species_id]);

        return $animalFunFacts;
    }
}
?>