<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);

// Function to initialize payment with Pay.nl
function initiate_payment_with_paynl($amount, $kukudushi_id, $returnUrl) 
{
    global $logger;
    $settings = Settings_Manager::Instance();

    $logger->info("Initiating payment for amount: $amount, kukudushi_id: $kukudushi_id, returnUrl: $returnUrl");
    
    // Pay.nl API URL to initiate a transaction
    $apiUrl = 'https://rest-api.pay.nl/v14/Transaction/start/json';

    $serviceId = 'SL-3410-9231';

    // Convert amount to Pay.nl format (e.g., €10 = 1000)
    $amountInCents = $amount * 100;

    $finishUrl = $settings->_kukudushi_custom_dir_url .'/payments/payment-success.php?returnUrl=' . urlencode($returnUrl);
    $logger->info("finishUrl: " . $finishUrl);

    $orderExchangeUrl = $settings->_kukudushi_custom_dir_url .'/payments/payment-webhook.php'; //?amount='. strval($amount) .'&kukudushi_id='. $kukudushi_id
    $logger->info("orderExchangeUrl: " . $orderExchangeUrl);

    // Prepare the data
    $data = [
        'serviceId' => $serviceId,
        'amount' => $amountInCents,
        'ipAddress' => $_SERVER['REMOTE_ADDR'],
        'finishUrl' => $finishUrl,
        'transaction' => [
            'currency' => 'USD',
            'description' => 'Donation Payment',
            'orderExchangeUrl' => $orderExchangeUrl,
        ],
        'saleData' => [
            'orderData' => [
                'productId' => $kukudushi_id,
                'price' => $amountInCents,
            ],
        ],
        'statsData' => [
            'extra1' => $kukudushi_id,
            'extra2' => strval($amountInCents),
        ],
    ];

    // Haal de Authorization header op
    $authorizationHeader = get_pay_authorization_header();

    // Use cURL to send the request to Pay.nl
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded', $authorizationHeader, 'cache-control: no-cache']);

    // Execute the request
    $response = curl_exec($ch);
    if ($response === false) 
    {
        $error = curl_error($ch);
        $logger->error("cURL Error: " . $error);
        curl_close($ch);
        error_log("cURL Error: " . $error);
        return "cURL Error: " . $error; 
    }

    $logger->info("Pay.nl API Response: " . $response);

    curl_close($ch);

    // Decode the JSON response
    $responseData = json_decode($response, true);
    $success = false;
    $result = "";

    if ($responseData && isset($responseData['request']['result']) && $responseData['request']['result'] == 1) 
    {
        if (isset($responseData['transaction']['transactionId'], $responseData['transaction']['paymentURL'])) 
        {
            $success = true;
            $result = $responseData['transaction']['paymentURL'];
            $logger->info("Payment initiated successfully. Transaction ID: " . $responseData['transaction']['transactionId'] ." Payment URL: " . $responseData['transaction']['paymentURL']);
        } 
        else 
        {
            $result =  "Error: Transaction ID or Payment URL missing in the response.";
            $logger->error($result);
        }
    } 
    else 
    {
        $errorDetails = isset($responseData['request']['errorMessage']) && !empty($responseData['request']['errorMessage']) 
            ? $responseData['request']['errorMessage'] 
            : 'Unknown error or request was not successful.';

        error_log("API Error: " . $errorDetails);
        $logger->error("API Error: " . $errorDetails);
        $result = "Error initiating payment. Details: " . $errorDetails;
    }

    return json_encode(['success' => $success, 'result' => $result]);
}

function get_pay_authorization_header()
{
    $username = "AT-0061-4633";
    $password = "07b7545d9613e84287c2eb42f43cd33a70c8a564";
    $credentials = $username . ":" . $password;
    $encodedCredentials = base64_encode($credentials);
    $authorizationHeader = "Authorization: Basic " . $encodedCredentials;
    return $authorizationHeader;
}

function get_payment_status($orderId) 
{
    $logger = new Logger();
    $apiUrl = 'https://rest-api.pay.nl/v14/Transaction/info/json';
    $logger->info("Checking payment status for order ID: $orderId");

    $apiToken = '07b7545d9613e84287c2eb42f43cd33a70c8a564';
    $serviceId = 'SL-3410-9231';

    $data = [
        'token' => $apiToken,
        'serviceId' => $serviceId,
        'transactionId' => $orderId,
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    if ($response === false) 
    {
        $logger->error("cURL error while checking payment status: " . curl_error($ch));
    }

    curl_close($ch);

    $responseData = json_decode($response, true);

    if ($responseData && isset($responseData['paymentDetails']['stateName'])) 
    {
        $logger->info("Payment status for order ID $orderId: " . $responseData['paymentDetails']['stateName']);
        return $responseData['paymentDetails']['stateName'];
    } 
    else 
    {
        $logger->error("Failed to retrieve payment status for order ID $orderId or status missing in response.");
        return false;
    }
}

function addQueryParams($url, $params) 
{
    $parts = parse_url($url);
    $query = [];
    if (isset($parts['query'])) {
        parse_str($parts['query'], $query);
    }

    foreach ($params as $key => $value) 
    {
        $query[$key] = $value;
    }

    $parts['query'] = http_build_query($query);
    $newUrl = $parts['scheme'] . '://' . $parts['host'] . (isset($parts['path']) ? $parts['path'] : '');
    if (!empty($parts['query'])) 
    {
        $newUrl .= '?' . $parts['query'];
    }
    if (isset($parts['fragment'])) 
    {
        $newUrl .= '#' . $parts['fragment'];
    }

    return $newUrl;
}
?>