<?php
require_once(dirname(__FILE__, 1) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_kukudushi);

class URL_Handler {
    private static $instance = null;

    public static function Instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function handle_request() {
        // Only process on front page
        if (!is_front_page()) {
            return;
        }

        $kukudushi_id = $this->get_kukudushi_id_from_url();

        // Check for HowToScan special case
        if ($kukudushi_id === 'HowToScan') {
            wp_redirect('https://kukudushi.com/instructions/');
            exit;
        }

        if ($kukudushi_id) {
            $kukudushi = $this->get_kukudushi_object($kukudushi_id);

            if (is_user_logged_in()) {
                $user = wp_get_current_user();

                if ($this->user_has_kukudushi_manager_role($user)) {
                    $this->handle_manager_logic($kukudushi);
                    return;
                }
            }

            $this->handle_default_logic($kukudushi_id, $kukudushi);
        }
    }

    private function get_kukudushi_id_from_url() {
        // Extract kukudushi_id from URL parameters
        if (isset($_GET['uid']) || isset($_GET['id'])) {
            return isset($_GET['uid']) ? $_GET['uid'] : $_GET['id'];
        }
        return null;
    }

    private function get_kukudushi_object($kukudushi_id) {
        // Retrieve the kukudushi object using the manager
        $kukudushi_manager = Kukudushi_Manager::Instance();
        return $kukudushi_manager->get_kukudushi($kukudushi_id);
    }

    private function user_has_kukudushi_manager_role($user) {
        // Check if the user has the kukudushi_manager role
        return in_array('kukudushi_manager', (array) $user->roles);
    }

    private function handle_manager_logic($kukudushi) {    
        add_action('wp_footer', function() use ($kukudushi) {
            echo '<div id="kukudushi-manager-root"></div>';
            
            // Prepare kukudushi data for JavaScript
            $kukudushi_data = [
                'id' => $kukudushi->id,
                'temporary_id' => $kukudushi->temporary_id,
                'exists' => $kukudushi->exists,
                'model_id' => $kukudushi->model_id,
                'type_id' => $kukudushi->type_id,
                'metadata' => $kukudushi->metadata
            ];
    
            ?>
            <script type="text/javascript">
                // Wait for manager to be available
                function waitForManager(callback, maxAttempts = 50) {
                    let attempts = 0;
                    
                    function checkManager() {
                        attempts++;
                        if (window.ManagerComponent) {
                            callback();
                        } else if (attempts < maxAttempts) {
                            setTimeout(checkManager, 100);
                        } else {
                            console.error('Failed to initialize Kukudushi Manager after', attempts, 'attempts');
                        }
                    }
                    
                    checkManager();
                }

                document.addEventListener('DOMContentLoaded', function() {
                    waitForManager(function() {
                        window.ManagerComponent.show(<?php echo json_encode($kukudushi_data); ?>);
                    });
                });
            </script>
            <?php
        });
    }

    private function handle_default_logic($kukudushi_id, $kukudushi) {
        // Default logic for non-manager users
        if (!is_page_template('animal_tracker_3d.php')) {
            // Use the temporary ID if available, otherwise fallback to the original ID
            $redirect_id = ($kukudushi && $kukudushi->exists && !empty($kukudushi->temporary_id)) 
                ? $kukudushi->temporary_id 
                : $kukudushi_id;

            // Redirect to animal tracker with appropriate ID
            $redirect_url = home_url('/animal-tracker-3d/') . '?id=' . urlencode($redirect_id);
            wp_redirect($redirect_url);
            exit;
        }
    }
}

// Initialize handler on WordPress init
add_action('template_redirect', [URL_Handler::Instance(), 'handle_request']);