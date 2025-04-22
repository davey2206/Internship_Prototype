<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

// Include necessary managers
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_metadata);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_points);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_metadata);

header('Content-Type: application/json');

// Get raw POST data
$input = json_decode(file_get_contents('php://input'), true);

// Initialize response
$response = [
    'success' => false,
    'message' => '',
    'updates' => [
        'metadata' => [],
        'points' => []
    ]
];

try {
    // Validate input
    if (!isset($input['kukudushi']) || !isset($input['kukudushi']['id'])) {
        throw new Exception('Invalid input: Missing kukudushi data');
    }

    // Get manager instances
    $kukudushi_manager = Kukudushi_Manager::Instance();
    $metadata_manager = MetaData_Manager::Instance();
    $points_manager = Points_Manager::Instance();

    // Start transaction if available
    if (method_exists('DataBase', 'beginTransaction')) {
        DataBase::beginTransaction();
    }

    // 1. Handle Kukudushi changes
    $kukudushi = $kukudushi_manager->get_kukudushi($input['kukudushi']['id']);
    
    // Track if type was changed
    $type_changed = false;
    $new_type_id = null;
    
    if ($input['kukudushi']['model_id']) {
        $kukudushi_manager->setKukudushiModel($input['kukudushi']['model_id'], $kukudushi);
    }
    
    if ($input['kukudushi']['type_id']) {
        $new_type_id = $input['kukudushi']['type_id'];
        $type_changed = true;
        
        // Update kukudushi type
        $kukudushi_manager->setKukudushiType($new_type_id, $kukudushi);

        // Update type_id for all existing metadata
        if ($kukudushi->exists) {
            $existing_metadata = $metadata_manager->getAllMetaData($kukudushi->id);
            foreach ($existing_metadata as $metadata) {
                $metadata->type_id = $new_type_id;
                $metadata_manager->save($metadata);
            }
        }
    }

    if (isset($input['metadata'])) {
        // Handle additions
        if (!empty($input['metadata']['add'])) {
            foreach ($input['metadata']['add'] as $metadata) {
                $metadata_obj = new MetaData();
                $metadata_obj->kukudushi_id = $kukudushi->id;
                
                if ($type_changed) {
                    $metadata_obj->type_id = $new_type_id;
                } elseif (isset($kukudushi->type_id)) {
                    $metadata_obj->type_id = $kukudushi->type_id;
                } else {
                    throw new Exception('No type_id available for new metadata');
                }
                
                $metadata_obj->metadata = sprintf("animal_id=%s;", $metadata['animal_id']);
                $metadata_obj->is_default = false;
        
                $saved_metadata = $metadata_manager->save($metadata_obj);
                
                // Return mapping of temporary ID to real ID
                if ($saved_metadata && isset($metadata['tempId'])) {
                    $response['updates']['metadata'][$metadata['tempId']] = $saved_metadata->id;
                }
            }
        }

        // Handle updates
        if (!empty($input['metadata']['update'])) {
            foreach ($input['metadata']['update'] as $metadata) {
                $metadata_obj = new MetaData();
                $metadata_obj->id = $metadata['metadata_id'];
                $metadata_obj->kukudushi_id = $kukudushi->id;
                
                // Use the new type_id if it was changed
                if ($type_changed) {
                    $metadata_obj->type_id = $new_type_id;
                } else {
                    $metadata_obj->type_id = $kukudushi->type_id;
                }
                
                $metadata_obj->metadata = sprintf("animal_id=%s;", $metadata['animal_id']);
                $metadata_obj->is_default = isset($metadata['is_default']) ? $metadata['is_default'] : false;

                $saved_metadata = $metadata_manager->save($metadata_obj);
            }
        }

        if (!empty($input['metadata']['remove'])) {
            foreach ($input['metadata']['remove'] as $metadataId) {
                if ($metadata_manager->removeMetadata($metadataId)) {
                    // Add to updates to confirm removal
                    $response['updates']['metadata']['removed'][] = $metadataId;  // Add this line
                }
            }
        }
    }

    // 3. Handle Points changes
    if (isset($input['points'])) {
        // Handle additions
        if (!empty($input['points']['add'])) {
            foreach ($input['points']['add'] as $point) {
                $saved_point = $points_manager->give_points_amount(
                    $kukudushi->id,
                    $point['description'],
                    $point['amount']
                );
    
                // Store the ID mapping for the response
                if ($saved_point && isset($point['tempId'])) {
                    $response['updates']['points'][$point['tempId']] = $saved_point;
                }
            }
        }
    
        // Handle removals
        if (!empty($input['points']['remove'])) {
            $removed_points = [];
            foreach ($input['points']['remove'] as $pointId) {
                if ($points_manager->removePoints($pointId)) {
                    $removed_points[] = $pointId;
                }
            }
            if (!empty($removed_points)) {
                $response['updates']['points']['removed'] = $removed_points;
            }
        }
    }

    // Commit transaction if available
    if (method_exists('DataBase', 'commit')) {
        DataBase::commit();
    }

    $response['success'] = true;
    $response['message'] = 'Changes saved successfully';

} catch (Exception $e) {
    // Rollback transaction if available
    if (method_exists('DataBase', 'rollback')) {
        DataBase::rollback();
    }

    $response['success'] = false;
    $response['message'] = 'Error saving changes: ' . $e->getMessage();
    error_log('Error in save_manager_changes.php: ' . $e->getMessage());
} finally {
    echo json_encode($response);
}