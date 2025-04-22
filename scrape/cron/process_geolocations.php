<?php
// Set unlimited execution time for batch processing
set_time_limit(0);
ini_set('memory_limit', '1028M');

require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_scan);

class GeolocationProcessor 
{
    private $scanManager;
    private $logger;
    private $startTime;
    private $maxExecutionTime = 1800; // 30 minutes
    private $batchSize = 100;
    private $processedCount = 0;
    private $errorCount = 0;
    private $skippedCount = 0;

    public function __construct() 
    {
        $this->scanManager = Scan_Manager::Instance();
        $this->logger = new Logger();
        $this->startTime = time();
    }

    /**
     * Main processing method
     */
    public function process() 
    {
        $this->logger->info("Starting geolocation processing job");

        try {
            while (!$this->shouldStop()) {
                // Process a batch
                $stats = $this->scanManager->processUnprocessedIps($this->batchSize);
                
                // Update counters
                $this->processedCount += $stats['processed'];
                $this->errorCount += $stats['errors'];
                $this->skippedCount += $stats['skipped'];

                // If nothing was processed in this batch, we're done
                if (($stats['processed'] + $stats['errors'] + $stats['skipped']) == 0) {
                    $this->logger->info("No more IPs to process");
                    break;
                }

                // Log progress
                $this->logProgress();

                // Small delay between batches to prevent server overload
                usleep(500000); // 500ms delay
            }

            $this->logFinalStats();

        } catch (Exception $e) {
            $this->logger->error("Fatal error in geolocation processing: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Check if processing should stop
     */
    private function shouldStop() 
    {
        // Stop if we've exceeded max execution time
        if ((time() - $this->startTime) >= $this->maxExecutionTime) {
            $this->logger->info("Max execution time reached");
            return true;
        }

        return false;
    }

    /**
     * Log progress statistics
     */
    private function logProgress() 
    {
        $runtime = time() - $this->startTime;
        $this->logger->info("Progress update:", [
            'runtime_seconds' => $runtime,
            'processed' => $this->processedCount,
            'errors' => $this->errorCount,
            'skipped' => $this->skippedCount
        ]);
    }

    /**
     * Log final statistics
     */
    private function logFinalStats() 
    {
        $runtime = time() - $this->startTime;
        $this->logger->info("Geolocation processing completed", [
            'total_runtime_seconds' => $runtime,
            'total_processed' => $this->processedCount,
            'total_errors' => $this->errorCount,
            'total_skipped' => $this->skippedCount,
            'average_rate' => $runtime > 0 ? round($this->processedCount / $runtime, 2) . ' IPs/second' : 'N/A'
        ]);
    }
}

// Execute the processor
try {
    $processor = new GeolocationProcessor();
    $processor->process();
} catch (Exception $e) {
    // Log error and exit with non-zero status
    error_log("Error in geolocation processing: " . $e->getMessage());
    exit(1);
}

exit(0);