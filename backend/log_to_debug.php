<?php
// backend/log_to_debug.php
header('Content-Type: application/json');

// Get the raw POST data
$json = file_get_contents('php://input');

// Decode it to get the log information
$data = json_decode($json, true);

if (!$data || !isset($data['message'])) {
    error_log('[log_to_debug.php] Invalid log data received');
    echo json_encode(['success' => false, 'error' => 'Invalid log data']);
    exit;
}

// Extract log data
$message = $data['message'];
$level = $data['level'] ?? 'debug';
$context = $data['context'] ?? '{}';
$source = $data['source'] ?? 'unknown';

// Format the log message
$log_entry = sprintf('[%s][%s] %s - Context: %s', 
    date('Y-m-d H:i:s'),
    strtoupper($level),
    $message,
    $context
);

// Write to WordPress debug.log
error_log($log_entry);

echo json_encode(['success' => true]);