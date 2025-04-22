<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

// Include necessary files
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_notification);

header('Content-Type: application/json');

// Initialize input variables
$input = json_decode(file_get_contents('php://input'), true);
$kukudushi_id = $input['kukudushi_id'] ?? null;
$notification_id = $input['notification_id'] ?? null;
$start_read = $input['start_read'] ?? null;
$end_read = $input['end_read'] ?? null;
$new_user = $input['new_user'] ?? false;

$logger = new Logger();
$kukudushi_manager = Kukudushi_Manager::Instance();
$response = ['status' => 'error'];

// Validate Kukudushi ID
if (!$kukudushi_id) {
    $response['message'] = 'Missing kukudushi_id.';
    echo json_encode($response);
    exit;
}

$kukudushi = $kukudushi_manager->get_kukudushi($kukudushi_id);

if (!$kukudushi || !$kukudushi instanceof Kukudushi) {
    $response['message'] = 'Invalid Kukudushi.';
    echo json_encode($response);
    exit;
}

// Handle New User vs Existing User
try {
    if ($new_user) {
        // Mark new user as "not new"
        $kukudushi_manager->setKukudushiNewUser(false, $kukudushi);
        $response['status'] = 'success';
        $response['message'] = 'New user status updated successfully.';
    } else {
        // Handle existing user notification interaction
        if ($notification_id && $start_read && $end_read) {
            // Sanitize and format start/end read dates
            $start_read = date('Y-m-d H:i:s', strtotime($start_read));
            $end_read = date('Y-m-d H:i:s', strtotime($end_read));

            // Record the notification interaction
            $kukudushi_manager->notification_manager->addNotificationInteraction(
                $notification_id,
                $start_read,
                $end_read
            );
            $response['status'] = 'success';
            $response['message'] = "Notification {$notification_id} marked as read.";
        } else {
            $response['message'] = 'Missing required notification data.';
        }
    }
} catch (Exception $e) {
    $logger->error('Error handling notification: ' . $e->getMessage());
    $response['message'] = 'Internal server error.';
}

// Return JSON response
echo json_encode($response);
exit;
