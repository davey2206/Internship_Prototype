<?php
// save_new_kukudushi.php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

// Start error logging
error_log("save_new_kukudushi.php started");

try {
    // Include necessary files
    Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
    Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);
    Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_points);
    Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_metadata);
    Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_kukudushi);

    header('Content-Type: application/json');

    // Get raw input first for logging
    $raw_input = file_get_contents('php://input');
    error_log("Raw input received: " . $raw_input);

    // Get JSON data from request
    $input = json_decode($raw_input, true);
    error_log("Decoded input: " . json_encode($input));

    if (!isset($input['uid']) || !isset($input['model_id'])) {
        $message = 'Missing required parameters';
        error_log($message);
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit;
    }

    $uid = $input['uid'];
    $model_id = $input['model_id'];
    $points_amount = $input['points_amount'] ?? 1500;
    $points_description = $input['points_description'] ?? "Starting points to choose you first animal. Enjoy!";

    error_log("Processing: UID=$uid, Model ID=$model_id, Points=$points_amount");

    $settings = Settings_Manager::Instance();
    $kukudushi_manager = Kukudushi_Manager::Instance();
    $points_manager = Points_Manager::Instance();
    
    // First, log all available methods for debugging
    $methods = get_class_methods($kukudushi_manager);
    error_log("All methods in Kukudushi_Manager: " . implode(", ", $methods));
    
    // Try the get_kukudushi method first - it might create if not found
    error_log("Attempting to get or create Kukudushi with UID: $uid");
    $kukudushi = $kukudushi_manager->get_kukudushi($uid);
    
    if (!$kukudushi) {
        error_log("get_kukudushi returned null, trying to create a new Kukudushi object directly");
        
        // If get_kukudushi didn't work, try creating a Kukudushi object directly
        $kukudushi = new Kukudushi();
        $kukudushi->temporary_id = $uid;
        
        // Check if there's a save method in the manager
        if (method_exists($kukudushi_manager, 'save')) {
            error_log("Using kukudushi_manager->save method");
            $kukudushi = $kukudushi_manager->save($kukudushi);
        } else {
            error_log("No save method found, searching for alternative save methods");
            
            // Look for methods with "save" in their name
            $save_methods = array_filter($methods, function($method) {
                return stripos($method, 'save') !== false;
            });
            
            if (!empty($save_methods)) {
                error_log("Potential save methods found: " . implode(", ", $save_methods));
                // Use first matching method as fallback
                $method = reset($save_methods);
                error_log("Using {$method} method");
                $kukudushi = $kukudushi_manager->$method($kukudushi);
            } else {
                error_log("No save methods found, trying manual database insert");
                
                // If no save methods are found, try to manually insert the Kukudushi
                global $wpdb;
                $table_name = $wpdb->prefix . 'kukudushi';
                
                $result = $wpdb->insert(
                    $table_name,
                    array(
                        'temporary_id' => $uid,
                        'created_date' => current_time('mysql')
                    )
                );
                
                if ($result) {
                    $kukudushi->id = $wpdb->insert_id;
                    $kukudushi->exists = true;
                    error_log("Manually inserted Kukudushi with ID: {$kukudushi->id}");
                } else {
                    throw new Exception("Failed to manually insert Kukudushi: " . $wpdb->last_error);
                }
            }
        }
    } else {
        error_log("get_kukudushi returned a Kukudushi object");
    }
    
    if (!$kukudushi) {
        throw new Exception("Failed to create Kukudushi - object is null after all attempts");
    }
    
    $kukudushi_id = $kukudushi->id ?? $kukudushi->temporary_id ?? $uid;
    error_log("Working with Kukudushi ID: $kukudushi_id");
    
    // Set the model ID
    error_log("Setting Kukudushi model ID to: $model_id");
    $result = $kukudushi_manager->setKukudushiModel($model_id, $kukudushi);
    error_log("setKukudushiModel result: " . ($result ? 'success' : 'failure'));
    
    // Check for existing points and remove them if found
    error_log("Checking for existing points for Kukudushi ID: $kukudushi_id");
    $existing_points = $points_manager->getAllPointsData($kukudushi);
    
    if (!empty($existing_points)) {
        error_log("Found existing points for UID: $kukudushi_id - removing before adding new points");
        $reset_result = $points_manager->reset_points($kukudushi);
        error_log("Points reset result: " . ($reset_result ? 'success' : 'failure'));
    } else {
        error_log("No existing points found for UID: $kukudushi_id");
    }
    
    // Add initial points
    error_log("Adding $points_amount points with description: $points_description");
    $points_result = $points_manager->give_points_amount(
        $kukudushi_id,
        $points_description,
        $points_amount
    );
    error_log("give_points_amount result: " . ($points_result ? 'success' : 'failure'));
    
    $response = [
        'success' => true,
        'message' => 'Kukudushi created successfully',
        'kukudushi_id' => $kukudushi_id,
        'points_added' => $points_result ? true : false
    ];
    error_log("Response: " . json_encode($response));
    echo json_encode($response);
    
} catch (Exception $e) {
    $error_message = $e->getMessage();
    $trace = $e->getTraceAsString();
    error_log("Exception: $error_message");
    error_log("Trace: $trace");
    
    echo json_encode([
        'success' => false,
        'message' => $error_message,
        'trace' => $trace
    ]);
}

error_log("save_new_kukudushi.php completed");
?>