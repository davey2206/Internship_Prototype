<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

$errorMSG = "";

if (empty($_POST["issue_text"]))
{
    $errorMSG = "<li>Please describe what kind of issue you are experiencing!</li>";
}

// Check form message
if (empty($errorMSG))
{
    $issue_text = $_POST["issue_text"];
    $email = $_POST["email"];
    $cookie_guid = $_POST["cookie_guid"];
    
    $data = array(
        'description' => $issue_text,
        'email' => $email,
        'cookie_id' => $cookie_guid
    );

    // Optionally, specify the format for each field to explicitly define data types.
    $format = array('%s', '%s', '%s');

    // Execute the insert operation using DataBase::insert
    $inserted_id = DataBase::insert('wp_kukudushi_isues', $data, $format);




    $msg = "Issue registered. If you used an email address, await a reply from our team shortly...";
    echo json_encode(['code' => 200, 'message' => $msg]);
    sendmail($issue_text, $email, $cookie_guid);
    exit;
}

echo json_encode(['code' => 404, 'message' => $errorMSG]);


function sendMail($issue_text, $email, $cookie_guid)
{
    // specify multiple recipients
    $to = "n1ck1994@live.nl"; /* info@kukudushi.com, richel@kukudushi.com */ //Multiple mails like this: "n1ck1994@live.nl, admin@kukudushi.com"
    $subject = "User Issue Received!";
    $message = "A user just posted an issue:<br>" .
           "'" . htmlspecialchars($issue_text) . "'<br><br>" .
           "The user's email: '" . htmlspecialchars($email) . "'<br><br>" .
           "The user's cookie GUID: '" . htmlspecialchars($cookie_guid) . "'<br><br>" .
           "Please respond to the user.";

    // To send HTML mail, the Content-type header must be set
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-type: text/html; charset=iso-8859-1';

    // Additional headers
    //$headers[] = 'To: Nick <mary@example.com>, Patrick <kelly@example.com>';
    //$headers[] = 'From: Kukudushi auto scripts <info@kukudushi.com>';

    // send a mail
    mail($to, $subject, $message, implode("\r\n", $headers));
}
?>