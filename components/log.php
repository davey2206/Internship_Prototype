<?php
// Define the log file path
$logFile = __DIR__ . '/tracker.log';

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Log raw POST data for debugging
    file_put_contents(__DIR__ . '/raw_post.log', print_r($_POST, true), FILE_APPEND);

    $logs = isset($_POST['logs']) ? json_decode($_POST['logs'], true) : null;

    if (!$logs || !is_array($logs)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid logs provided.']);
        exit;
    }

    $logMessages = array_map(function ($log) {
        return date('Y-m-d H:i:s') . ' - ' . $log;
    }, $logs);

    $logContent = implode(PHP_EOL, $logMessages) . PHP_EOL;

    // Append logs to the log file
    if (file_put_contents($logFile, $logContent, FILE_APPEND | LOCK_EX)) {
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Logs written successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to write logs.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
}
