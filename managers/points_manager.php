<?php

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_points);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_points_type);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_points);

class Points_Manager
{
    private static $instance = null;
    private $settings;
    private $Points_DB;
    public $firstDailyScan;
    public $points_awarded;
    private $DEFAULT_POINT_PER_SCAN = 20;

    private function __construct()
    {
        $this->settings = Settings_Manager::Instance();
        $this->Points_DB = new Points_DB();
        $this->firstDailyScan = false;
    }

    public static function Instance()
    {
        if (self::$instance === null) {
            self::$instance = new Points_Manager();
        }
        return self::$instance;
    }

    public function register_points($kukudushi)
    {
        //award points if not received yet today
        if ($this->can_receive_points($kukudushi)) {
            $this->award_points($kukudushi);
        }
    }
    public function award_points($kukudushi)
    {
        $this->points_awarded = new Points();
        $this->points_awarded->kukudushi_id = $kukudushi->id;
        $this->points_awarded->description = "First scan of the day. ";

        // get day streak
        $streak = $this->dayStreak($kukudushi->id);
        if ($streak < 1) {
            $streak = 1;
        }

        $reward_points = $this->getStreakPointsAmount(($streak));
        $this->points_awarded->amount = $reward_points;


        // Append description based on the day streak
        if ($streak > 1 && $streak < 5) {
            $this->points_awarded->description .= "(" . strval($this->dayStreak($kukudushi->id)) . "-day streak Bonus)";
        } elseif ($streak >= 5) {
            $this->points_awarded->description .= "(" . strval($this->dayStreak($kukudushi->id)) . "-day streak Bonus, streak cap reached!)";
        }

        $this->Points_DB->register($this->points_awarded);
        $this->firstDailyScan = true;
    }

    public function getStreakPointsAmount($streak)
    {
        if ($streak % 5 == 0) {
            return 50;
        }
        else{
            return 10;
        }
    }

    public function give_points_amount($kukudushi_id, $description, $amount)
    {
        $points_awarded = new Points();
        $points_awarded->kukudushi_id = $kukudushi_id;
        $points_awarded->description = $description;
        $points_awarded->amount = $amount;

        $new_points_row_id = $this->Points_DB->register($points_awarded);

        return $new_points_row_id;
    }

    public function reset_points($kukudushi)
    {
        return $this->Points_DB->reset_points($kukudushi);
    }

    public function can_receive_points($kukudushi)
    {
        return $this->Points_DB->can_receive_points($kukudushi->id);
    }


    public function getTotalPoints($kukudushi)
    {
        return $this->Points_DB->getTotalPoints($kukudushi);
    }


    public function getAllPointsData($kukudushi)
    {
        return $this->Points_DB->getAllPointsData($kukudushi);
    }

    public function spend_points($kukudushi_id, $amount, $description)
    {
        return $this->Points_DB->spend_points($kukudushi_id, $amount, $description);
    }

    public function removePoints($pointId) {
        return $this->Points_DB->removePoints($pointId);
    }

    public function dayStreak($kukudushi_id)
    {
        return $this->Points_DB->dayStreak($kukudushi_id);
    }


    public function showPoints()
    {
        if ($this->firstDailyScan) {
            echo '<script>' . $this->getPointsCode(false) . '</script>';
        }
    }

    public function showPointsWithoutScript($biggerFontSize)
    {
        if ($this->firstDailyScan) {
            return $this->getPointsCode($biggerFontSize);
        }
        return "";
    }

    public function getPointsCode($biggerFontSize)
    {
        return '
        var pointsHtml = `' . $this->getHtml() . '`;
        var pointsStyles = `' . $this->getCss($biggerFontSize) . '`;
    
        // Append popupHtml to target page
        if (jQuery("#notificationContainer").length) {
            jQuery("#notificationContainer").append(pointsHtml);
        } else {
            const pointsContainer = document.createElement("div");
            pointsContainer.innerHTML = pointsHtml;
            document.body.appendChild(pointsContainer);
        }
        
        // Create style node and append css to it
        var styleSheet = document.createElement("style");
        styleSheet.innerText = pointsStyles;
        document.head.appendChild(styleSheet);
        
        // Calculate the starting position and endpoint dynamically
        var kukusImgContainer = document.querySelector(".kukus-img-container");
        var pointsElement = document.querySelector("#points");
        
        if (kukusImgContainer && pointsElement) {
            var rect = kukusImgContainer.getBoundingClientRect();
            var viewportHeight = window.innerHeight;
        
            // Set the starting position (33% up from the bottom of the screen)
            var startBottom = viewportHeight * 0.33;
        
            // Set the endpoint (centered on the footer image)
            var endBottom = viewportHeight - rect.top - rect.height / 2;
        
            // Apply dynamic CSS variables
            pointsElement.style.setProperty("--dynamic-start-bottom", `${startBottom}px`);
            pointsElement.style.setProperty("--dynamic-start-left", `${rect.left + rect.width / 2}px`);
            pointsElement.style.setProperty("--dynamic-end-bottom", `${endBottom}px`);
        }
        
        // Trigger the animation
        jQuery("#points").addClass("visible");
        
        // Add points to kukus-amount after the animation completes
        setTimeout(function () {
            // Ensure the coin stays at the footer
            jQuery("#points").removeClass("visible");
        
            // Add points to kukus-amount
            var kukusAmountElement = document.querySelector(".kukus-amount");
            if (kukusAmountElement) {
                var currentAmount = parseInt(kukusAmountElement.innerText.replace(/\./g, "")) || 0; // Remove dots for parsing
                var pointsToAdd = ' . $this->points_awarded->amount . ';
                var newAmount = currentAmount + pointsToAdd;
        
                // Animate the count-up and change styles
                kukusAmountElement.style.transition = "color 0.3s, font-size 0.3s";
                kukusAmountElement.style.color = "green !important"; // Highlight the text
                kukusAmountElement.style.fontSize = "6vw"; // Increase font size (scale up from 5vw)
                animateCounter(kukusAmountElement, currentAmount, newAmount);

                // Revert styles after animation completes
                setTimeout(function () {
                    kukusAmountElement.style.color = ""; // Revert to original color
                    kukusAmountElement.style.fontSize = "5vw"; // Revert to original size
                }, 1000); // Match animation duration
            }
        
            // Remove the coin after the animation is complete
            setTimeout(function () {
                jQuery("#points").remove();
            }, 500);
        }, 2500); // Coin animation duration
        
        // Function to animate the counter
        function animateCounter(element, start, end) {
            var duration = 1000; // 1 second
            var stepTime = Math.abs(Math.floor(duration / (end - start)));
            var current = start;
        
            function updateCounter() {
                if (current < end) {
                    current++;
                    element.innerText = formatNumber(current);
                    setTimeout(updateCounter, stepTime);
                } else {
                    element.innerText = formatNumber(end); // Ensure the final value is correct
                }
            }
        
            updateCounter();
        }
        
        // Function to format numbers with dots
        function formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }';
    }



    private function getHtml()
    {
        $_pointsImagePath = "/wp-content/plugins/kukudushi-engine-vue/media/plus_points_coin.webp";

        return '
        <div class="points" id="points">
            <div class="points-image">
                <image class="img" id="coinImage" src="' . $_pointsImagePath . '" />
                <div class="img-text">
                    +' . strval($this->points_awarded->amount) . '
                </div>
            </div>
        </div>
        ';
    }

    private function getCss($map)
    {
        $fontSize = 16;
        $imgWidth = 32;
        $imgHeight = 32;

        if ($map) {
            $fontSize = 40;
            $imgWidth = 128;
            $imgHeight = 128;
        }

        return "
        .points {
            position: fixed;
            bottom: var(--dynamic-start-bottom, 33%); /* Start at 33% up from the bottom of the screen */
            left: var(--dynamic-start-left, 50%); /* Dynamically calculate the horizontal position */
            transform: translate(-50%, 0); /* Center horizontally */
            z-index: 99999999;
            opacity: 0;
            transition:
                opacity 500ms ease-in,
                bottom 1500ms ease-out,
                transform 1500ms ease-out;
        }

        .points.visible {
            opacity: 1;
            bottom: var(--dynamic-end-bottom, 0); /* Move down to the footer */
            transform: translate(-50%, 0); /* Smooth downward transition */
        }

        .img-text {
            font-size: " . $fontSize . "px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%); /* Center horizontally and vertically */
            font-weight: bold;
            color: white;
            -webkit-text-stroke-width: 0.6px;
            -webkit-text-stroke-color: black;
            font-family: Arial Black, sans-serif;
            line-height: 1; /* Ensures proper vertical centering */
            text-align: center; /* Centers text inside the container */
        }

        .points-image {
            width: " . $imgWidth . "px;
            height: " . $imgHeight . "px;
        }

        .points-image .img {
            -webkit-filter: drop-shadow(5px 5px 5px #222);
            filter: drop-shadow(5px 5px 5px #222);
        }
    ";
    }
}
