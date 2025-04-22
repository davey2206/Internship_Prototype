<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Scan_DB
{
    private $logger;

    public function __construct() 
    {
        $this->logger = new Logger();
        $this->logger->debug('Scan_DB instance created');
    }

    public function register($scan_object)
    {

        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
        // Updated data array to include all relevant properties
        $data = array(
            'valid' => $scan_object->valid ? 1 : 0,
            'datetime' => $dateTimeNow->format('Y-m-d H:i:s'),
            'ip' => $scan_object->ip,
            'kukudushi_id' => $scan_object->kukudushi_id,
            'temporary_id' => $scan_object->temporary_id,
            'browser' => $scan_object->browser,
            'guid' => $scan_object->guid,
            'metadata_id' => $scan_object->metadata_id,
            'window_functionality' => $scan_object->window_functionality,
            'username' => $scan_object->username,
        );

        // Updated format array to match the new data structure
        // Assuming all string fields except 'valid', which is tinyint
        $format = array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s');

        // Execute the insert operation
        $inserted_id = DataBase::insert('wp_kukudushi_item_scans', $data, $format);

        $this->logger->info("Scan registered with ID {$inserted_id}");

        return $inserted_id;
    }

    public function get_duplicate_scan_count($kukudushi_id)
    {
        $this->logger->debug("Duplicate scan check for ID {$kukudushi_id}");

        // Check for an entry in the last 2 seconds
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
        $twoSecondsAgo = new DateTime('now', new DateTimeZone('America/Curacao'));
        $twoSecondsAgo->modify('-2 seconds');

        // Prepare the SQL statement with placeholders for safe insertion
        $sql = "SELECT COUNT(*) as count FROM wp_kukudushi_item_scans WHERE kukudushi_id = %s AND datetime BETWEEN %s AND %s";

        // Prepare the data array for sanitization and formatting
        $data = [
            $kukudushi_id,
            $twoSecondsAgo->format('Y-m-d H:i:s'),
            $dateTimeNow->format('Y-m-d H:i:s')
        ];

        // Execute the query using the DataBase class
        $result = DataBase::select($sql, $data);

        // Extract the count from the result
        $recentEntry = !empty($result) ? (int)$result[0]->count : 0;
        return $recentEntry;
    }

    public function get_scans_between_dates($from_date, $till_date = null)
    {
        // DateTime creation from the input parameters
        $fromDateTime = new DateTime($from_date, new DateTimeZone('America/Curacao'));
        $tillDateTime = null;

        if ($till_date === null) 
        {
            $tillDateTime = new DateTime('now', new DateTimeZone('America/Curacao'));
        } 
        else 
        {
            $tillDateTime = new DateTime($till_date, new DateTimeZone('America/Curacao'));

            // If only date is provided, set time to the end of the day
            if (!str_contains($till_date, ':')) 
            {
                $tillDateTime->setTime(23, 59, 59);
            }
        }

        // Ensuring the date format is appropriate for SQL queries
        $formattedFromDate = $fromDateTime->format('Y-m-d H:i:s');
        $formattedTillDate = $tillDateTime->format('Y-m-d H:i:s');

        $manager_guids_sql = "SELECT DISTINCT `guid` FROM `wp_kukudushi_item_scans` WHERE `guid` != '' AND `username` = %s;";
        $queryParams = ["KukudushiManager"];
        $manager_guids_results = DataBase::select($manager_guids_sql, $queryParams);

        // Extract GUIDs into an array
        $manager_guids = [];
        foreach ($manager_guids_results as $row) 
        {
            $manager_guids[] = $row->guid;
        }
        

        // SQL query using parameterized inputs for safety
        $sql = "SELECT * FROM `wp_kukudushi_item_scans` WHERE `kukudushi_id` NOT LIKE %s AND `datetime` >= %s AND `datetime` <= %s";
        $queryParams = ["%test%", $formattedFromDate, $formattedTillDate];

        // Execute the query using the DataBase class with parameterized inputs
        $scans = DataBase::select($sql, $queryParams);

        // Filter scans to exclude manager's GUIDs
        $filtered_scans = [];
        foreach ($scans as $scan) 
        {
            if (!in_array($scan->guid, $manager_guids)) 
            {
                $filtered_scans[] = $scan;
            }
        }

        return $filtered_scans;
    }

    /**
     * Get unprocessed IP addresses from scans
     * @param int $limit Maximum number of IPs to retrieve
     * @return array Array of unique IPs
     */
    public function getUnprocessedIps($batchSize = 100) {
        DataBase::initialize();
        
        // Simple SELECT first to verify we have data
        $sql = "
            SELECT DISTINCT s.ip
            FROM wp_kukudushi_item_scans s
            LEFT JOIN wp_kukudushi_item_scan_geolocations g ON s.ip = g.ip_address
            WHERE s.ip != ''
            AND g.ip_address IS NULL
            LIMIT %d";
    
        try {
            $ips = DataBase::select($sql, [$batchSize]);
            
            if (empty($ips)) {
                $this->logger->debug("No unprocessed IPs found");
                return [];
            }
    
            // For any IPs found, insert placeholder records
            DataBase::$db_instance->query('START TRANSACTION');
            
            $placeholders = implode(',', array_fill(0, count($ips), '(?, \'pending\', NOW())'));
            $values = array_map(function($row) { return $row->ip; }, $ips);
            
            $insertSql = "INSERT INTO wp_kukudushi_item_scan_geolocations 
                          (ip_address, status, last_updated)
                          VALUES " . $placeholders;
            
            DataBase::select($insertSql, $values);
            DataBase::$db_instance->query('COMMIT');
            
            return $ips;
    
        } catch (Exception $e) {
            if (isset(DataBase::$db_instance)) {
                DataBase::$db_instance->query('ROLLBACK');
            }
            $this->logger->error("Error in getUnprocessedIps: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Store geolocation data for an IP address
     * @param ScanGeolocation $geoData The geolocation data to store
     * @return bool Success status
     */
    public function storeGeolocationData($geoData) {
        $data = [
            'ip_address' => $geoData->ip_address,
            'hostname' => $geoData->hostname ?? null,
            'city' => $geoData->city ?? null,
            'region' => $geoData->region ?? null,
            'country' => $geoData->country ?? null,
            'latitude' => $geoData->latitude ?? null,
            'longitude' => $geoData->longitude ?? null,
            'organization' => $geoData->organization ?? null,
            'postal_code' => $geoData->postal_code ?? null,
            'timezone' => $geoData->timezone ?? null,
            'status' => 'active',
            'last_updated' => date('Y-m-d H:i:s')
        ];
    
        try {
            DataBase::initialize();
            return DataBase::insert(
                'wp_kukudushi_item_scan_geolocations', 
                $data,
                null,
                ['hostname']
            ) !== false;
        } catch (Exception $e) {
            $this->logger->error("Exception storing geolocation data: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get geolocation data for multiple IPs
     * @param array $ips Array of IP addresses
     * @return array Associative array of IP => geolocation data
     */
    public function getGeolocationData($ips) 
    {
        if (empty($ips)) {
            return [];
        }

        $placeholders = array_fill(0, count($ips), '%s');
        $sql = "
            SELECT * 
            FROM wp_kukudushi_item_scan_geolocations 
            WHERE ip_address IN (" . implode(',', $placeholders) . ")
            AND status = 'active'
        ";
        
        return DataBase::select($sql, $ips);
    }

    /**
     * Get scans with geolocation data
     * @param string $fromDate Start date
     * @param string $toDate End date
     * @return array Array of scan objects with geolocation data
     */
    public function getScansWithGeolocation($fromDate, $toDate) 
    {
        $sql = "
            SELECT s.*, 
                g.hostname as geo_hostname,
                g.city as geo_city,
                g.region as geo_region,
                g.country as geo_country,
                g.latitude as geo_latitude,
                g.longitude as geo_longitude,
                g.organization as geo_organization,
                g.postal_code as geo_postal,
                g.timezone as geo_timezone
            FROM wp_kukudushi_item_scans s
            LEFT JOIN wp_kukudushi_item_scan_geolocations g 
                ON s.ip = g.ip_address
            WHERE s.datetime BETWEEN %s AND %s
            AND g.status = 'active'
        ";

        return DataBase::select($sql, [$fromDate, $toDate]);
    }

    /**
     * Update geolocation status for an IP
     * @param string $ip IP address
     * @param string $status New status
     * @param string|null $errorMessage Optional error message
     * @return boolean Success status
     */
    public function updateGeolocationStatus($ip, $status, $errorMessage = null) 
    {
        $data = [
            'status' => $status,
            'error_message' => $errorMessage,
            'retry_count' => ['raw' => 'retry_count + 1']
        ];

        return DataBase::updateWithRaw(
            'wp_kukudushi_item_scan_geolocations',
            $data,
            ['ip_address' => $ip]
        );
    }
}
?>