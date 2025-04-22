<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once(dirname(__FILE__, 4) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_scan);

header('Content-Type: application/json');

try {
    // Get JSON data from POST request
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data');
    }

    // Initialize scan manager
    $scanManager = Scan_Manager::Instance();

    // Get parameters from POST data
    $fromDate = $data['from'] ?? date('Y-m-d', strtotime('-7 days'));
    $toDate = $data['to'] ?? date('Y-m-d');
    $zoom = isset($data['zoom']) ? (int)$data['zoom'] : 0;
    $bounds = $data['bounds'] ?? null;

    error_log("Received data - from: $fromDate, to: $toDate, zoom: $zoom");

    // Validate dates
    $fromDateTime = DateTime::createFromFormat('Y-m-d', $fromDate);
    $toDateTime = DateTime::createFromFormat('Y-m-d', $toDate);

    if (!$fromDateTime || !$toDateTime) {
        throw new Exception('Invalid date format. Expected format: YYYY-MM-DD');
    }

    // Format dates consistently
    $fromDate = $fromDateTime->format('Y-m-d');
    $toDate = $toDateTime->format('Y-m-d');

    // Validate bounds if provided
    if ($bounds !== null) {
        if (!isset($bounds['west']) || !isset($bounds['east']) || 
            !isset($bounds['north']) || !isset($bounds['south'])) {
            throw new Exception('Invalid bounds structure - missing required fields');
        }
        
        // Validate and normalize bounds values
        foreach (['west', 'east', 'north', 'south'] as $key) {
            if (!is_numeric($bounds[$key])) {
                throw new Exception('Invalid bounds values - non-numeric value found');
            }
            // Normalize longitude values
            if ($key === 'west' || $key === 'east') {
                while ($bounds[$key] < -180) $bounds[$key] += 360;
                while ($bounds[$key] > 180) $bounds[$key] -= 360;
            }
            // Clamp latitude values
            if ($key === 'north' || $key === 'south') {
                $bounds[$key] = max(-90, min(90, $bounds[$key]));
            }
        }
    }

    // Get clustered data
    $clusters = $scanManager->getClusteredScans($fromDate, $toDate, $zoom, $bounds);
    
    // Calculate statistics
    $totalScans = 0;
    $uniqueLocations = array();
    $countryStats = [];
    
    foreach ($clusters as $cluster) {
        $totalScans += $cluster['count'];
        
        foreach ($cluster['scans'] as $scan) {
            if (isset($scan->geo_latitude) && isset($scan->geo_longitude)) {
                $locationKey = $scan->geo_latitude . ',' . $scan->geo_longitude;
                $uniqueLocations[$locationKey] = true;
            }
            
            if (isset($scan->geo_country) && !empty($scan->geo_country)) {
                $countryStats[$scan->geo_country] = ($countryStats[$scan->geo_country] ?? 0) + 1;
            }
        }
    }
    
    // Find most active country
    arsort($countryStats);
    $mostActiveCountry = !empty($countryStats) ? array_key_first($countryStats) : 'N/A';

    echo json_encode([
        'success' => true,
        'data' => $clusters,
        'stats' => [
            'totalScans' => $totalScans,
            'uniqueLocations' => count($uniqueLocations),
            'mostActiveCountry' => $mostActiveCountry
        ],
        'dateRange' => [
            'from' => $fromDate,
            'to' => $toDate
        ],
        'metadata' => [
            'zoom' => $zoom,
            'bounds' => $bounds
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in get_scan_data.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => __FILE__,
        'line' => __LINE__,
        'debug' => [
            'received_data' => $data ?? null,
            'received_json' => $json ?? null,
            'json_error' => json_last_error_msg()
        ]
    ]);
}