<?php

class Logger {
    const LEVEL_DEBUG = 'DEBUG';
    const LEVEL_INFO = 'INFO';
    const LEVEL_ERROR = 'ERROR';

    // Define the current debug level here
    const CURRENT_DEBUG_LEVEL = self::LEVEL_DEBUG; // Change this to LEVEL_INFO or LEVEL_ERROR as needed

    private $logDirectory;
    private $sourceFileName;

    public function __construct() 
    {
        date_default_timezone_set('America/Curacao');
        $this->logDirectory = dirname(__FILE__, 2) . '/logs';

        if (!file_exists($this->logDirectory)) 
        {
            mkdir($this->logDirectory, 0777, true);
        }
        $this->sourceFileName = $this->getSourceFileName();
    }

    private function getSourceFileName() 
    {
        $basePath = dirname(__FILE__, 2);
        $filePath = debug_backtrace()[0]['file'];
        $relativePath = str_replace($basePath, '', $filePath);
        return trim($relativePath, '/');
    }

    private function getLogFileName() 
    {
        date_default_timezone_set('America/Curacao');
        $date = date('Y-m-d');
        $filePath = $this->sourceFileName;
        $directoryPath = dirname($filePath);

        $fullLogPath = "{$this->logDirectory}/{$directoryPath}";
        if (!file_exists($fullLogPath)) 
        {
            mkdir($fullLogPath, 0777, true);
        }

        return "{$fullLogPath}/" . basename($filePath, '.php') . "_{$date}.log";
    }

    private function shouldLog($level) 
    {
        $levels = [
            self::LEVEL_ERROR => 0,
            self::LEVEL_INFO => 1,
            self::LEVEL_DEBUG => 2,
        ];

        return $levels[$level] <= $levels[self::CURRENT_DEBUG_LEVEL];
    }

    private function log($level, $message, ...$context) 
    {
        if (!$this->shouldLog($level)) {
            return; // Do not log if the current level is below the threshold
        }

        date_default_timezone_set('America/Curacao');

        if (is_array($message) || is_object($message)) 
        {
            $message = json_encode($message, JSON_PRETTY_PRINT);
        }

        $contextString = '';
        if (!empty($context)) {
            $contextString = json_encode($context, JSON_PRETTY_PRINT);
        }

        $dateTime = date('Y-m-d H:i:s');
        $callerInfo = debug_backtrace();
        $callerFile = basename($callerInfo[1]['file']);
        $callerLine = $callerInfo[1]['line'];

        $logMessage = "[$dateTime] [$level] [$callerFile line: $callerLine] - $message";
        if ($contextString) {
            $logMessage .= " | Context: $contextString";
        }
        $logMessage .= "\n";

        // Add this to your logger.php file around line 90
        try {
            $logFile = $this->getLogFileName();
            
            if (!is_dir(dirname($logFile))) {
                // Try to create the directory if it doesn't exist
                @mkdir(dirname($logFile), 0755, true);
            }
            
            // Check if directory is writable before attempting to write
            if (is_writable(dirname($logFile))) {
                file_put_contents($logFile, $logMessage . PHP_EOL, FILE_APPEND);
            } else {
                // Fallback logging to PHP error log
                error_log("Logger: Cannot write to log file. Permission denied. Original message: " . $logMessage);
            }
        } catch (Exception $e) {
            error_log("Logger error: " . $e->getMessage());
        }
    }

    public function debug($message, ...$context) {
        $this->log(self::LEVEL_DEBUG, $message, ...$context);
    }

    public function info($message, ...$context) {
        $this->log(self::LEVEL_INFO, $message, ...$context);
    }

    public function error($message, ...$context) {
        $this->log(self::LEVEL_ERROR, $message, ...$context);
    }
}

?>
