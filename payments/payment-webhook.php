<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::misc_payment_functions);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_payment);

// Instantiate the Logger
$logger = new Logger();
$logger->info("payment-webhook.php START");

// Load WordPress environment
require_once(dirname(__FILE__, 5) . '/wp-load.php');

// Function to safely retrieve GET and POST data
function get_data($key) 
{
    $logger = new Logger();
    $data = '';

    if (isset($_GET[$key])) 
    {
        $data = htmlspecialchars($_GET[$key], ENT_QUOTES, 'UTF-8');
    } 
    elseif (isset($_POST[$key])) 
    {
        $data = htmlspecialchars($_POST[$key], ENT_QUOTES, 'UTF-8');
    }

    $logger->debug(sprintf("Retrieved data for key '%s': %s", $key, $data ? $data : "NULL"));
    return $data;
}

// Retrieve parameters from PAY.'s exchange call
$action = get_data('action');
$orderId = get_data('order_id');
$paymentSessionId = get_data('payment_session_id');
$ipAddress = get_data('ip_address');
$amount = get_data('amount');
// Assuming 'extra1' and 'extra2' are sent via POST or GET
$kukudushi_id = get_data('extra1');
$amountInCents = get_data('extra2');

$logger->info("Processing PAY. exchange call with order ID: $orderId, kukudushi_id: $kukudushi_id, amountInCents: $amountInCents");

// Process the result
$payment_manager = Payment_Manager::Instance();
$message = '';
$paymentStatus = get_payment_status($orderId);

if (!empty($paymentStatus) && $paymentStatus != false) 
{
    // Handle different transaction states
    if ($paymentStatus === 'PAID') 
    {
        // Payment was successful, update database accordingly
        $payment_manager->register_payment($kukudushi_id, $paymentStatus, $orderId, $paymentSessionId, $ipAddress, $amountInCents);

        $message = 'Order processed';
        $logger->info("Order processed for order ID $orderId.");
    } 
    elseif ($paymentStatus === 'CANCEL') 
    {
        $payment_manager->register_payment($kukudushi_id, $paymentStatus, $orderId, $paymentSessionId, $ipAddress, $amountInCents);
        
        $message = 'Order canceled';
        $logger->info("Order canceled for order ID $orderId.");
    }
    else
    {
        $logger->info("Transaction in state: " . $paymentStatus . " for order ID $orderId.");
    }
    // Additional handling for other states as needed
} 
else 
{
    $message = 'Error fetching transaction details';
    $logger->error("Error fetching transaction details for order ID $orderId.");
}

// Respond to PAY. to acknowledge the update
echo 'TRUE|' . $message;
