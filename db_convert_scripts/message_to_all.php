<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_metadata);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_metadata);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_metadata_property);

$message = '
🎉 <b>Exciting News:</b> 🎉 

Kukudushi Just Got Better!
We\'ve completely redesigned our website and animal tracker.


🎁 <b>Special Offer: 15% OFF</b>

Click the coupon code to go to our shop and receive your
15% discount automatically: 
<u><a href="https://kukudushi.com/?append_coupon=NEWWEBSITE15" target="_blank" style="color:blue;text-decoration:underline;">NEWWEBSITE15</a></u>
(Valid until Februari 24th)


<b>What\'s New?</b>

⚡ <b>Faster Performance</b>
Lightning-quick loading for both website and tracker

🌍 <b>Enhanced Earth View</b>
Stunning 3D world map for immersive tracking

🎯 <b>Smoother Navigation</b>
Intuitive controls to follow your animal\'s journey


<center><i>Thank you for being part of the Kukudushi community, where technology meets nature. 🌿</i></center>
';

$image = "";
$active_date = "2025-02-16";
$expiration_date = "2025-02-24";

//$allKukudushisOfType = DataBase::select("SELECT * FROM `wp_kukudushi_items`;");

// Get all kukudushis of type
/*
$allKukudushisOfType = DataBase::select("SELECT a.*
FROM wp_kukudushi_item_metadata a
INNER JOIN (
    SELECT kukudushi_id, MIN(id) AS min_id
    FROM wp_kukudushi_item_metadata
    WHERE metadata = 'animal_id=18;'
    GROUP BY kukudushi_id
) b ON a.kukudushi_id = b.kukudushi_id AND a.id = b.min_id
WHERE a.metadata = 'animal_id=18;';");


$allKukudushisOfType = DataBase::select("SELECT a.*
FROM wp_kukudushi_item_metadata a
JOIN (
    SELECT kukudushi_id, MIN(id) AS min_id
    FROM wp_kukudushi_item_metadata
    WHERE metadata = 'animal_id=18;'
    GROUP BY kukudushi_id
) b ON a.kukudushi_id = b.kukudushi_id AND a.id = b.min_id;");
*/

$allKukudushis = DataBase::select("SELECT * FROM `wp_kukudushi_items`");

$kukudushi_count = count($allKukudushis);
$message_count = 0;
$failed_message_count = 0;

foreach ($allKukudushis as $item) 
{
    $insertResult = DataBase::insert(
        'wp_kukudushi_notifications',
        [
            'kukudushi_id' => $item->kukudushi_id,
            'message' => $message,
            'image' => $image,
            'active_date' => $active_date,
            'expiration_date' => $expiration_date,
            'is_active' => 1,
            'max_view_count' => 1
        ]
    );

    /*
    $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
    $insertResult = DataBase::insert(
        'wp_kukudushi_points',
        [
            'kukudushi_id' => $item->kukudushi_id,
            'amount' => 1200,
            'date' => $dateTimeNow->format('Y-m-d H:i:s'),
            'description' => "Compensation for antenna malfunction Patricia."
        ]
    );
    */
    

    if ($insertResult !== false) 
    {
        $message_count++;
    }
    else
    {
        $failed_message_count++;
    }
}

echo 'Total kukudushis found: ' . $kukudushi_count;
echo '<br />';
echo 'Total messages FAILED: ' . $failed_message_count;
echo '<br />';
echo 'Total messages created succesfully: ' . $message_count;
?>