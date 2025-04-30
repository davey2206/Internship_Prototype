<?php
// File: kukudushi-nfc-registration.php - Place this in your plugin's root directory

function kukudushi_nfc_registration_menu() {
    // Only add menu for users with kukudushi_manager role
    if (current_user_can('kukudushi_manager')) {
        add_menu_page(
            'Kukudushi NFC Registration', 
            'NFC Registration', 
            'kukudushi_manager', 
            'kukudushi-nfc-registration',
            'kukudushi_nfc_registration_page',
            'dashicons-tag', // Use tag icon
            30
        );
    }
}
add_action('admin_menu', 'kukudushi_nfc_registration_menu');

function kukudushi_nfc_registration_page() {
    // Include our Vue-based registration interface
    ?>
    <div class="wrap">
        <h1>Kukudushi NFC Registration</h1>
        <div id="kukudushi-nfc-registration-app"></div>
    </div>
    <?php
}

// Enqueue scripts and styles for our registration page
function kukudushi_nfc_registration_scripts($hook) {
    // Only load on our page
    if ($hook != 'toplevel_page_kukudushi-nfc-registration') {
        return;
    }
    
    // Enqueue Vue.js
    wp_enqueue_script('vue-js', 'https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.prod.js', array(), KUKUDUSHI_ENGINE_VERSION, true);
    
    // Enqueue our registration app script
    wp_enqueue_script(
        'kukudushi-nfc-registration-app', 
        plugin_dir_url(__FILE__) . 'components/nfc_registration_app.js', 
        array('vue-js'), 
        null, 
        true
    );
    
    // Add script type="module" for ES modules
    add_filter('script_loader_tag', function($tag, $handle) {
        if ('kukudushi-nfc-registration-app' !== $handle) {
            return $tag;
        }
        return str_replace('<script ', '<script type="module" ', $tag);
    }, 10, 2);
    
    // Enqueue CSS
    wp_enqueue_style(
        'kukudushi-nfc-registration-styles', 
        plugin_dir_url(__FILE__) . 'css/nfc_registration.css',
        array(), 
        null
    );
    
    // Pass necessary data to JavaScript
    wp_localize_script('kukudushi-nfc-registration-app', 'kukudushiData', array(
        'plugin_url' => plugin_dir_url(__FILE__),
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('kukudushi_nfc_registration_nonce')
    ));
}
add_action('admin_enqueue_scripts', 'kukudushi_nfc_registration_scripts');