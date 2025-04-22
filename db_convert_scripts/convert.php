<?php
require_once(dirname(__FILE__, 2) . "/kukudushi_settings.php");

$settings = Settings_Manager::Instance();
$user_manager = User_Manager::Instance();
$current_user = $user_manager->get_current_user();

// Check if admin
if (!$current_user->is_admin())
{
    echo '<script>alert("Please login as an administrator!")</script>';
    sleep(2);
    echo '<script type="text/javascript">window.location.href="' . $settings->_kukudushi_base_url . '";</script>';
    exit;
}

// Get all kukudushis
$allKukudushis = DataBase::select("SELECT * FROM wp_kukudushi_items");

foreach ($allKukudushis as $item) {
    $kuku_id = $item->kukudushi_id;
    $t_id = $item->type_id;

    // Get type details
    $type = DataBase::select("SELECT * FROM wp_kukudushi_types WHERE type_id = %d", [$t_id]);
    $main_type_id = $type[0]->main_type;
    $extra_param = $type[0]->extra_parameter;

    if (strlen($extra_param) > 0) {
        $animal_id = DataBase::select("SELECT * FROM wp_kukudushi_animals WHERE ext_id = %s", [$extra_param]);
        if (!empty($animal_id)) {
            $extra_param = "animal_id=" . $animal_id[0]->id . ";";
        }
    }

    // Insert metadata
    $data = [
        'kukudushi_id' => $kuku_id,
        'type' => $t_id,
        'metadata' => $extra_param
    ];

    // Use the DataBase class to insert the metadata
    $result = DataBase::insert('wp_kukudushi_item_metadata', $data);

    if ($result !== false) {
        echo "Insert query executed successfully for kukudushi_id: $kuku_id<br />";
    } else {
        echo "Failed to execute insert query for kukudushi_id: $kuku_id<br />";
    }
}
?>