<?php
/*
 * Plugin Name:       [Kukudushi] Engine Vue
 * Plugin URI:        https://kukudushi.com
 * Description:       Complete environment for handling and managing NFC functionalities
 * Version:           1.1
 * Requires at least: 5.2
 * Requires PHP:      7.2
 * Author:            Nick Gruijters
 * Author URI:        https://kukudushi.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Update URI:        https://kukudushi.com/plugin/
 * Domain Path:       /
 */

// Include URL handler
require_once plugin_dir_path(__FILE__) . 'url_handler.php';
// Include the NFC Registration functionality
require_once plugin_dir_path(__FILE__) . 'kukudushi-nfc-registration.php';

// Get plugin version
$plugin_data = get_file_data(__FILE__, ['Version' => 'Version'], false);
define('KUKUDUSHI_ENGINE_VERSION', $plugin_data['Version']);

function enqueue_kukudushi_vue_widget() {
    // Common scripts needed for both scenarios
    wp_enqueue_script(
        'lodash',
        'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
        array(),
        '4.17.21',
        false
    );
    wp_script_add_data('lodash', 'integrity', 'sha512-WFN04846sdKMIP5LKNphMaWzU7YpMyCU245etK3g/2ARYbPK9Ub18eG+ljU96qKRCWh+quCY7yefSmlkQw1ANQ==');
    wp_script_add_data('lodash', 'crossorigin', 'anonymous');
    wp_script_add_data('lodash', 'referrerpolicy', 'no-referrer');
    
    // Enqueue Vue.js script
    wp_enqueue_script(
        'vue-js',
        'https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.prod.js',
        array(),
        null,
        true
    );

    // Add manager components and styles for logged-in managers
    if (is_user_logged_in() && current_user_can('kukudushi_manager')) {
        wp_enqueue_style(
            'manager-style',
            plugin_dir_url(__FILE__) . 'css/manager.css',
            array(),
            KUKUDUSHI_ENGINE_VERSION
        );

        // Enqueue the initialization script which will import other components
        wp_enqueue_script(
            'manager-init',
            plugin_dir_url(__FILE__) . 'components/manager-init.js',
            array('vue-js'),
            KUKUDUSHI_ENGINE_VERSION,
            true
        );

        // Pass necessary data to JavaScript
        wp_localize_script('manager-init', 'managerData', array(
            'plugin_url' => plugin_dir_url(__FILE__),
            'ajax_url' => admin_url('admin-ajax.php'),
            'current_user' => wp_get_current_user()->display_name,
            'nonce' => wp_create_nonce('kukudushi_manager_nonce')
        ));
    }

    if (is_page_template('animal_tracker_3d.php') || 
        ((isset($_GET['uid']) || isset($_GET['id'])) && strpos($_SERVER['REQUEST_URI'], 'animal-tracker-3d') !== false)) {
        
        // Enqueue Cesium.js and CSS
        wp_enqueue_script(
            'cesium-js',
            plugin_dir_url(__FILE__) . 'js/Cesium/Cesium.js',
            array(),
            KUKUDUSHI_ENGINE_VERSION,
            true
        );
        wp_enqueue_style(
            'cesium-css',
            plugin_dir_url(__FILE__) . 'js/Cesium/Widgets/widgets.css',
            array(),
            KUKUDUSHI_ENGINE_VERSION
        );

        // Enqueue custom CSS files
        $styles = array(
            'notification-css' => 'css/notification-manager.css',
            'tutorial-css' => 'css/tutorial-manager.css',
            'animal-tracker-css' => 'css/animal-tracker.css',
            'user-menu-css' => 'css/user-menu.css',
            'login-streak-css' => 'css/login-streak.css',
            'my-badges-css' => 'css/my-badges.css',
            'my-animals-css' => 'css/my-animals.css',
            'cesium-custom-infobox' => 'css/cesium-custom-infobox.css'
        );
        foreach ($styles as $handle => $path) {
            wp_enqueue_style($handle, plugin_dir_url(__FILE__) . $path, array(), KUKUDUSHI_ENGINE_VERSION);
        }

        // Enqueue animal tracker component
        wp_enqueue_script(
            'animal-tracker-3d',
            plugin_dir_url(__FILE__) . 'components/animal_tracker.js',
            array('vue-js', 'cesium-js', 'lodash'),
            KUKUDUSHI_ENGINE_VERSION,
            true
        );

        $cesiumAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiMzliYjI0Mi0zNWQ5LTRjOGYtODc5NS0yMDU4MzMwNTU2MDUiLCJpZCI6MjMyMjgyLCJpYXQiOjE3MjI1OTQwMDV9.2C9FgiQf4FuSDgoMN1_92A0T2tD2Gtwfr2vpVKBHvKM';

        wp_localize_script('animal-tracker-3d', 'kukudushiData', array(
            'plugin_url' => plugin_dir_url(__FILE__),
            'cesiumAccessToken' => $cesiumAccessToken
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_kukudushi_vue_widget', 0);

/**
 * Disable WordPress and Elementor stylesheets on the animal tracker page
 */
function kukudushi_disable_styles_on_tracker_page() {
    // Check if we're on the animal tracker page
    if (is_page_template('animal_tracker_3d.php') || 
        ((isset($_GET['uid']) || isset($_GET['id'])) && strpos($_SERVER['REQUEST_URI'], 'animal-tracker-3d') !== false)) {
        
        // Register the handler with a very late priority to ensure all other styles are registered
        add_action('wp_print_styles', 'kukudushi_remove_unwanted_styles', 999);
    }
}
add_action('wp_enqueue_scripts', 'kukudushi_disable_styles_on_tracker_page', 1);

/**
 * Remove unwanted WordPress and theme stylesheets on tracker page
 */
function kukudushi_remove_unwanted_styles() {
    global $wp_styles;
    
    // Essential styles to keep
    $essential_styles = array(
        // Our custom tracker styles
        'notification-css',
        'tutorial-css',
        'animal-tracker-css',
        'user-menu-css',
        'my-animals-css',
        'cesium-custom-infobox',
        'cesium-css',
        // WordPress functionality
        'admin-bar',
        'dashicons',
    );
    
    // Loop through all enqueued styles and remove non-essential ones
    foreach ($wp_styles->queue as $handle) {
        // Skip essential styles
        if (in_array($handle, $essential_styles)) {
            continue;
        }
        
        // If style is from Elementor or theme, remove it
        if (strpos($handle, 'elementor') !== false || 
            strpos($handle, 'theme') !== false || 
            strpos($handle, 'wp-') === 0 ||
            strpos($handle, 'wc-') === 0 ||
            strpos($handle, 'woo') === 0 ||
            strpos($handle, 'hello-') === 0) {
            wp_dequeue_style($handle);
        }
    }
}

// Preload assets when conditions are met
function preload_kukudushi_assets() 
{
    if (is_front_page() || is_page_template('animal_tracker_3d.php') || 
        ((isset($_GET['uid']) || isset($_GET['id'])) && strpos($_SERVER['REQUEST_URI'], 'animal-tracker-3d') !== false)) 
    {
        echo '<link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.prod.js?ver=' . KUKUDUSHI_ENGINE_VERSION . '">';
        echo '<link rel="preload" href="' . plugin_dir_url(__FILE__) . 'js/Cesium/Cesium.js?ver=' . KUKUDUSHI_ENGINE_VERSION . '" as="script">';
        echo '<link rel="preload" href="' . plugin_dir_url(__FILE__) . 'js/Cesium/Widgets/widgets.css?ver=' . KUKUDUSHI_ENGINE_VERSION . '" as="style">';
        echo '<link rel="preload" href="' . plugin_dir_url(__FILE__) . 'components/animal_tracker.js?ver=' . KUKUDUSHI_ENGINE_VERSION . '" as="script">';

    }
}
add_action('wp_head', 'preload_kukudushi_assets', 0);

// Add custom body class for animal tracker
function kukudushi_add_tracker_body_class($classes) {
    if (is_page_template('animal_tracker_3d.php') || 
        ((isset($_GET['uid']) || isset($_GET['id'])) && strpos($_SERVER['REQUEST_URI'], 'animal-tracker-3d') !== false)) {
        
        $classes[] = 'kukudushi-tracker-page';
    }
    return $classes;
}
add_filter('body_class', 'kukudushi_add_tracker_body_class');

// Add Vue mount point in body for animal tracker
function add_vue_widget_div() {
    if (is_front_page()) {
        echo '<div id="kukudushi-engine-widget"></div>';
    }
}
add_action('wp_body_open', 'add_vue_widget_div', 1);

// Add new mount point for manager component when user is manager
function add_manager_mount_point() {
    if (is_user_logged_in() && current_user_can('kukudushi_manager')) {
        echo '<div id="kukudushi-manager-root"></div>';
    }
}
add_action('wp_footer', 'add_manager_mount_point');

// Filter for adding type="module" to manager-init script
add_filter('script_loader_tag', function($tag, $handle) {
    if (in_array($handle, ['manager-init', 'animal-tracker-3d'])) {
        return str_replace('<script ', '<script type="module" ', $tag);
    }
    return $tag;
}, 10, 2);

// Register custom template
function register_animal_tracker_template($templates) {
    $templates['animal_tracker_3d.php'] = 'Animal Tracker 3D';
    return $templates;
}
add_filter('theme_page_templates', 'register_animal_tracker_template');

// Add custom template to page dropdown and use our custom template
function add_animal_tracker_template($template) {
    global $post;
    if ($post && get_page_template_slug($post) == 'animal_tracker_3d.php') {
        $template = plugin_dir_path(__FILE__) . 'animal_tracker_3d.php';
    }
    return $template;
}
add_filter('template_include', 'add_animal_tracker_template');