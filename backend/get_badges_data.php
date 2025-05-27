<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_badges);

header('Content-Type: application/json');

$logger = new Logger();
$kukudushi = null;
$settings = Settings_Manager::Instance();
$kukudushi_manager = Kukudushi_Manager::Instance();
$badges_manager = Badges_Manager::Instance();

// Get Kukudushi from uid or id
if (!empty($_GET['uid'])) {
    $kukudushi_id = htmlspecialchars($_GET['uid'], ENT_QUOTES, 'UTF-8');
    $kukudushi = $kukudushi_manager->get_kukudushi($kukudushi_id);
} else if (!empty($_GET['id'])) {
    $kukudushi_id = htmlspecialchars($_GET['id'], ENT_QUOTES, 'UTF-8');
    $kukudushi = $kukudushi_manager->get_kukudushi($kukudushi_id);
}

// Check if $kukudushi is an instance of Kukudushi and not null
if ($kukudushi && $kukudushi instanceof Kukudushi) {
    $kukudushi->exists = true; // Example of setting a custom property
}

$badge_data = $badges_manager->getAllBadges($kukudushi->id);

$CoinBadgeRanks = array(1000, 2000, 5000, 10000, 15000);
$FactBadgeRanks = array(1, 5, 10, 15, 20);
$AnimalBadgeRanks = array(1, 2, 3, 4, 5);

$CoinUnlocked = 0;
$FactUnlocked = 0;
$AnimalUnlocked = 0;

foreach ($CoinBadgeRanks as $CoinRank) {
    if ($badge_data->coins >= $CoinRank) {
        $CoinUnlocked++;
    }
}

foreach ($FactBadgeRanks as $FactRank) {
    if ($badge_data->facts >= $FactRank) {
        $FactUnlocked++;
    }
}

foreach ($AnimalBadgeRanks as $AnimalRank) {
    if ($badge_data->animals >= $AnimalRank) {
        $AnimalUnlocked++;
    }
}

$data = [
    'Badges' => [
        [
            'Name' => 'Coin Badge',
            'Unlocked' => $CoinUnlocked, //calculate based on coins collected
            'Collected' => $badge_data->coins, //get from $bedge_data
            'BadgeRanks' => $CoinBadgeRanks, //unlock amounts
        ],
        [
            'Name' => 'Fact Badge',
            'Unlocked' => $FactUnlocked, //calculate based on facts collected
            'Collected' => $badge_data->facts, //get from $bedge_data
            'BadgeRanks' => $FactBadgeRanks, //unlock amounts
        ],
        [
            'Name' => 'Animal Badge',
            'Unlocked' => $AnimalUnlocked, //calculate based on facts collected
            'Collected' => $badge_data->animals, //get from $bedge_data
            'BadgeRanks' => $AnimalBadgeRanks, //unlock amounts
        ]
    ]
];

// Debugging: Check if the data is properly formatted
error_log(json_encode($data));

echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);