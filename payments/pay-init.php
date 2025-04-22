<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::misc_payment_functions);

// Instantiate the Logger
$logger = new Logger();

// Ensure this script cannot be accessed directly for security reasons
/*
if (!defined('DASHBOARD_ENABLE_PAYMENT')) 
{
    $logger->error('Attempted direct access to the script.');
    exit; // Exit if accessed directly
}
*/

// Getting the posted data
$amount = !empty($_POST['amount']) ? floatval($_POST['amount']) : 2.99;
if ($amount < 2.99)
{
    $amount = 2.99;
    $logger->info("Amount posted is less then the minimum, reset to 2.99.");
}

//Kukudushi_id
$post_id = isset($_POST['id']) ? $_POST['id'] : '';
$kukudushi_id = preg_replace('/[^a-zA-Z0-9]/', '', $post_id);
if (!preg_match('/^[a-zA-Z0-9]+$/', $kukudushi_id)) 
{
    $kukudushi_id = '';
    $logger->info("Invalid kukudushi_id posted, reset to empty.");
}

// ReturnUrl
$returnUrl = '';

if (isset($_POST['returnUrl'])) {
    $sanitizedUrl = htmlspecialchars($_POST['returnUrl'], ENT_QUOTES, 'UTF-8');
    if (filter_var($sanitizedUrl, FILTER_VALIDATE_URL) !== false) {
        // The URL is both sanitized and valid
        $returnUrl = $sanitizedUrl;
    }
}


$logger->info("Initiate payment with posted data. Amount: $amount, returnUrl: $returnUrl, kukudushi_id: $kukudushi_id");

// Initiate payment with Pay.nl
echo initiate_payment_with_paynl($amount, $kukudushi_id, $returnUrl);
