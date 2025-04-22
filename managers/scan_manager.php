<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

require_once(dirname(__FILE__, 2) . '/admin/scan_overview/geo_location_service.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_scan);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_scan);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);

class Scan_Manager
{
    private static $instance = null;
    public $guidManger;
    public $Scan_DB;
    public $user_manager;
    private $logger;
    private $geoLocationService;

    private function __construct()
    {
        $this->logger = new Logger();
        $this->user_manager = User_Manager::Instance();
        $this->Scan_DB = new Scan_DB();
        $this->geoLocationService = GeoLocationService::Instance();
        $this->logger->debug("Scan_Manager initialized");
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new Scan_Manager();
        }
        return self::$instance;
    }

    public function registerScan($kukudushi, $metadata_id = 0, $window_functionality = "")
    {
        $this->logger->info("Attempting to register a scan");

        // If a recent entry exists, do not insert a new one
        if ($this->duplicate_scan_found($kukudushi->id)) 
        {
            $this->logger->debug("Duplicate scan found, registration aborted");
            return;
        }

        //If jetpack plugin checks page
        $browser = $_SERVER['HTTP_USER_AGENT'];
        if (str_contains(strtolower($browser), "jetpack site uptime monitor") || str_contains(strtolower($browser), "jetmon"))
        {
            $this->logger->debug("Request from Jetpack site uptime monitor detected, registration aborted");
            return;
        }

        [$setUserGuid_js, $user] = $this->user_manager->get_current_user();

        $uid = "";
		$temporary_id = "";
        $valid = false;

        if ($kukudushi->exists)
        {
            $uid = $kukudushi->id;
            $temporary_id = $kukudushi->temporary_id;
            $valid = true;
            $this->logger->debug("Existing kukudushi processed: ID $uid");
        }
        else
        {
            $getpoints = false;
            $valid = false;

            if (!empty($_GET['uid']))
            {
                $uid = $_GET['uid'];
                $this->logger->debug("NON-Existing kukudushi processed: UID ". $_GET['uid']);
            }
            if (!empty($_GET['id']))
            {
                $temporary_id = $_GET['id'];
                $this->logger->debug("NON-Existing kukudushi processed: ID ". $_GET['id']);
            }

            $this->logger->debug("No kukudushi UID/ID given..");

        }

        $scan = new Scan();
        $scan->browser = $browser;
        $scan->username = $user->display_name;
        $scan->guid = $user->cookie_GUID;
        $scan->valid = $valid;
        $scan->ip = $_SERVER['REMOTE_ADDR'];
        $scan->kukudushi_id = $uid;
        $scan->temporary_id = $temporary_id;
        $scan->metadata_id = $metadata_id;
        $scan->window_functionality = $window_functionality;

        $scan_id = $this->Scan_DB->register($scan);
        $this->logger->info("Scan registered successfully!");
    }

    public function duplicate_scan_found($kukudushi_id)
    {
        $duplicate_count = $this->Scan_DB->get_duplicate_scan_count($kukudushi_id);
        $this->logger->debug("Duplicate scan check: $duplicate_count duplicate scans found.");
        return $duplicate_count > 0;
    }

    /**
     * Get scans with geolocation data for date range
     * @param string $fromDate Start date
     * @param string $toDate End date
     * @param bool $includeGeoData Whether to include geolocation data (default false for backward compatibility)
     * @return array Array of scan objects
     */
    public function get_scans_between_dates($fromDate, $toDate = null, $includeGeoData = false)
    {
        if ($toDate === null) {
            $toDate = date('Y-m-d H:i:s');
        }

        if ($includeGeoData) {
            return $this->Scan_DB->getScansWithGeolocation($fromDate, $toDate);
        } else {
            // Use original method for backward compatibility
            return $this->Scan_DB->get_scans_between_dates($fromDate, $toDate);
        }
    }

    /**
     * Process a batch of unprocessed IP addresses
     * @param int $batchSize Number of IPs to process in one batch
     * @return array Processing statistics
     */
    public function processUnprocessedIps($batchSize = 100) {
        $stats = [
            'processed' => 0,
            'errors' => 0,
            'skipped' => 0
        ];
    
        $unprocessedIps = $this->Scan_DB->getUnprocessedIps($batchSize);
        if (empty($unprocessedIps)) {
            $this->logger->info("No unprocessed IPs found");
            return $stats;
        }
    
        foreach ($unprocessedIps as $row) {
            $ip = $row->ip;
            try {
                $locationData = $this->geoLocationService->getLocationData($ip);
                if ($locationData) {
                    $geoData = ScanGeolocation::fromApiResponse($ip, $locationData);
                    if ($this->Scan_DB->storeGeolocationData($geoData)) {
                        $this->logger->debug("Successfully stored geolocation data for IP: {$ip}");
                        $stats['processed']++;
                    } else {
                        $stats['skipped']++;
                    }
                } else {
                    $stats['errors']++;
                }
            } catch (Exception $e) {
                $this->logger->error("Error processing IP {$ip}: " . $e->getMessage());
                $stats['errors']++;
            }
        }
    
        $this->logger->info("Batch processing completed", $stats);
        return $stats;
    }

    public function getClusteredScans($fromDate, $toDate, $zoom, $bounds) {
        // Get raw scan data
        $scans = $this->Scan_DB->getScansWithGeolocation($fromDate, $toDate);
        
        // Calculate clustering grid based on zoom level
        $gridSize = $this->calculateGridSize($zoom);
        
        // Group scans into clusters
        $clusters = [];
        foreach ($scans as $scan) {
            if (!isset($scan->geo_latitude) || !isset($scan->geo_longitude)) {
                continue;
            }
            
            // If bounds are provided, check if point is within bounds
            if ($bounds !== null) {
                if ($scan->geo_longitude < $bounds['west'] || 
                    $scan->geo_longitude > $bounds['east'] ||
                    $scan->geo_latitude < $bounds['south'] || 
                    $scan->geo_latitude > $bounds['north']) {
                    continue;
                }
            }
            
            // Calculate grid cell for this point
            $cellX = floor($scan->geo_longitude / $gridSize);
            $cellY = floor($scan->geo_latitude / $gridSize);
            $cellKey = "{$cellX}_{$cellY}";
            
            if (!isset($clusters[$cellKey])) {
                $clusters[$cellKey] = [
                    'center' => [
                        'lat' => $scan->geo_latitude,
                        'lng' => $scan->geo_longitude
                    ],
                    'count' => 1,
                    'scans' => [$scan]
                ];
            } else {
                $clusters[$cellKey]['count']++;
                $clusters[$cellKey]['scans'][] = $scan;
                // Recalculate center
                $clusters[$cellKey]['center'] = [
                    'lat' => ($clusters[$cellKey]['center']['lat'] * ($clusters[$cellKey]['count'] - 1) + $scan->geo_latitude) / $clusters[$cellKey]['count'],
                    'lng' => ($clusters[$cellKey]['center']['lng'] * ($clusters[$cellKey]['count'] - 1) + $scan->geo_longitude) / $clusters[$cellKey]['count']
                ];
            }
        }
        
        return array_values($clusters);
    }
    
    private function calculateGridSize($zoom) {
        // Base grid size (in degrees) that changes with zoom level
        // At zoom level 0, grid size is 360/4 = 90 degrees
        // Each zoom level divides this by 2
        $baseGridSize = 90;
        return $baseGridSize / pow(2, $zoom);
    }

}