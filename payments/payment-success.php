<?php
// Start session - place this at the very top of the file
if (!session_id()) session_start();

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::misc_payment_functions);

// Instantiate the Logger
$logger = new Logger();
$paymentStatus = 'failed';

//TEMPORARY LOGGING, REMOVE AFTER FINISHED DEBUGGING
$logger->info("Logging \$_GET variables:");
foreach ($_GET as $key => $value) {
    $logger->info("Key: $key, Value: $value");
}

// Logging $_SESSION variables
$logger->info("Logging \$_SESSION variables:");
foreach ($_SESSION as $key => $value) {
    $logger->info("Key: $key, Value: $value");
}

// Assuming you receive the order ID as a query parameter
$orderId = isset($_GET['orderId']) ? htmlspecialchars($_GET['orderId'], ENT_QUOTES, 'UTF-8') : '';

if (!empty($orderId)) 
{
    $paymentStatus = get_payment_status($orderId);

    if ($paymentStatus === 'PAID') {
        // Set session or transient with success message
        $_SESSION['payment_message'] = "Thank you for your donation! Your payment was successful.";
        $logger->info("Payment for order ID $orderId was successful.");
        $paymentStatus = 'success';
    } 
    else 
    {
        // Set session or transient with failure message
        $_SESSION['payment_message'] = "There was a problem with your payment. Please contact support.";
        $logger->info("Payment for order ID $orderId failed or was not completed.");
    }
} 
else 
{
    $_SESSION['payment_message'] = "Invalid request. No order ID provided.";
    $logger->info("Invalid request received - No order ID provided.");
}

// Retrieve the return URL parameter
$returnUrl = (!empty($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/';
if (isset($_GET['returnUrl']))
{
    $returnUrl = urldecode($_GET['returnUrl']);
}

$logger->info("Return URL: $returnUrl");

// Append the payment_status and dashboard to the redirect URL variable
$paramsToAdd = array(
    'payment_status' => $paymentStatus,
    'dashboard' => '1'
);
$redirectUrl = addQueryParams($returnUrl, $paramsToAdd);


$logger->info("Redirecting to URL: $redirectUrl");

// Redirect the user back to the original page with status
echo '<script type="text/javascript">window.location.href="' . $redirectUrl . '";</script>';
exit();