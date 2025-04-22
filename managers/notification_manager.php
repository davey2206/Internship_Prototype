<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_notification);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_notification);

class Notification_Manager
{
    private $notification_db; // Assuming this is initialized somewhere, perhaps in the constructor
    private $notification;
    private $settings;

    // Constructor with an optional parameter for initializing notification_db
    public function __construct($kukudushi_id = null) 
    {
        $this->notification_db = new Notification_DB();
        $this->settings = Settings_Manager::Instance();
        if (!empty($kukudushi_id))
        {
            //get notifications
            $this->getFirstNotification($kukudushi_id);
        }
    }

    public function hasNotification()
    {
        return !empty($this->notification);
    }

	private function getFirstNotification($kukudushi_id)
	{
		$result = $this->notification_db->getFirstNotification($kukudushi_id);
        
		if (!empty($result))
		{
			$notification = new Notification();
			$notification->id = $result->id;
			$notification->message = $result->message;
			$notification->image = $result->image;
			$notification->timeout = $result->timeout;
			$notification->ext_operator_id = $result->ext_operator_id;
			$notification->operator_message_id = $result->operator_message_id;
			$notification->timeout = $result->timeout;
			$notification->max_view_count = $result->max_view_count;
			$notification->is_active = $result->is_active == 1;
			$notification->view_count = $result->view_count;
			$notification->read_datetime = $result->read_datetime;
			$notification->active_date = $result->active_date;
			$notification->expiration_date = $result->expiration_date;

			$this->notification = $notification;
		}
	}

	public function getAllRemainingNotifications($kukudushi_id)
	{
		$result = $this->notification_db->getAllRemainingNotifications($kukudushi_id);
        $remaining_notifications = array();
		if (!empty($result) && count($result) > 0)
		{
			foreach ($result as $notification_data)
			{
				$notification = new Notification();
				$notification->id = $notification_data->id;
				$notification->message = $notification_data->message;
				$notification->image = $notification_data->image;
				$notification->timeout = $notification_data->timeout;
				$notification->ext_operator_id = $notification_data->ext_operator_id;
				$notification->operator_message_id = $notification_data->operator_message_id;
				$notification->timeout = $notification_data->timeout;
				$notification->max_view_count = $notification_data->max_view_count;
				$notification->is_active = $notification_data->is_active == 1;
				$notification->view_count = $notification_data->view_count;
				$notification->read_datetime = $notification_data->read_datetime;
				$notification->active_date = $notification_data->active_date;
				$notification->expiration_date = $notification_data->expiration_date;
				$remaining_notifications[] = $notification;
			}
		}
		return $remaining_notifications;
	}

	
	public function addNotificationInteraction($notification_id, $start_read, $end_read)
	{
		$this->notification_db->addNotificationInteraction($notification_id, $start_read, $end_read);
	}

	public function setNotificationRead($notification_id)
	{
		$this->notification_db->setNotificationRead($notification_id);
	}

	public function insertNewNotification($kukudushi_id, $message, $image = "", $timeout = 0, $days_till_expire = 60)
	{
		$this->notification_db->insertNewNotification($kukudushi_id, $message, $image = "", $timeout = 0, $days_till_expire = 60);
	}



	public function show($kukudushi)
	{
		$this->getFirstNotification($kukudushi->id);

		if ($this->hasNotification()) 
        {
			echo '<script>' . $this->getNotificationCode($this->notification->message, $this->notification->timeout) . '</script>';
			$this->setNotificationRead($this->notification->id);
		}
	}

	public function showWithoutScript($kukudushi)
	{
		$this->getFirstNotification($kukudushi->id);

		if ($this->hasNotification()) 
        {
			$this->setNotificationRead($this->notification->id);
			return $this->getNotificationCode($this->notification->message, $this->notification->timeout);
		}
		return "";
	}

	public function getNotificationCode($message, $timeout)
	{
		$timeout_out = 99999999;
		if (intval($timeout) > 0) 
        {
			$timeout_out = intval($this->notification->timeout) * 1000;
		}

		// HTML with a placeholder for the URL
		if (strpos($message, '{current_kukudushi_dashboard_url}') !== false) 
		{
			$id = isset($_GET['id']) ? $_GET['id'] : "";
			$domain = "https://$_SERVER[HTTP_HOST]";
			$newUrl = $domain . "?id=" . $id . "&dashboard";

			$message = str_replace("{current_kukudushi_dashboard_url}", htmlspecialchars($newUrl, ENT_QUOTES, 'UTF-8'), $message);
		}

		return '
		var notificationHtml = `' . $this->getHtml() . '`
		// Your CSS as text
		var styles = `' . $this->getCss() . '`
		
		//Append popupHtml to target page
		if (jQuery("#notificationContainer").length)
		{
			jQuery("#notificationContainer").append(notificationHtml);
		}
		else
		{
			const notificationContainer = document.createElement("div");
			notificationContainer.innerHTML = notificationHtml;
			document.body.appendChild(notificationContainer);
		}

		//Create style node and append css to it
		var styleSheet = document.createElement("style");
		styleSheet.innerText = styles;
		document.head.appendChild(styleSheet);

		jQuery(".notification_close_button").on("click", function() {

			jQuery("#toast").removeClass("visible");
			setTimeout(function() {
				jQuery("#toast").remove();
			}, 1500);

		});

		jQuery("#toast-text").html(`' . nl2br($message) . '`);

		(function(jQuery){
			jQuery.event.special.destroyed = {
			remove: function(o) {
				if (o.handler) {
				o.handler()
				}
			}
			}
		})(jQuery);


		if (jQuery("#imageSlowlyVanish").length)
		{
			jQuery("#imageSlowlyVanish").bind("destroyed", function() {
				jQuery("#toast").addClass("visible");
				setTimeout(function() {
					if (jQuery("#toast").length)
					{
						jQuery("#toast").removeClass("visible");
						setTimeout(function() {
							jQuery("#toast").remove();
						}, 1500);
					}
				}, ' . strval($timeout_out) . ');
			});
		}
		else
		{
			jQuery("#toast").addClass("visible");
			setTimeout(function() {
				if (jQuery("#toast").length)
				{
					jQuery("#toast").removeClass("visible");
					setTimeout(function() {
						jQuery("#toast").remove();
					}, 1500);
				}
			}, ' . strval($timeout_out) . ');
		}

	';

	}

	private function getHtml()
	{
		$_notificationImagePath = $this->settings->_kukudushi_custom_media_dir_url . "/notification.png";

		$imageHtml = '';
		if (!empty($this->notification->image)) 
		{
			$imageHtml = '<div class="notification-image-container">
							<image class="notification-image" src="' . $this->notification->image . '" />
						  </div>
						';
		}
		
		return '
		<div class="toast" id="toast">
			<div class="toast-body" id="toast-body">
				<img class="notification-top-img" id="notification-top-img" src="' . $_notificationImagePath . '" />
				' . $imageHtml . '
				<div class="toast-text" id="toast-text">
				</div>
				<div class="notification-buttonHolder">
					<button class="notification_close_button" type="button">Close Notification</button>
				</div>
			</div>
		</div>
		';
	}

	private function getCss()
	{
		return "
		.toast {
			top: 0;
			bottom: 0;
			position: fixed;
			line-height: /*40px*/ normal;
			width: 100%;
			text-align: center;
			z-index: 9999999;
			opacity: 0;
			font-family: 'Philosopher' !important;
			transition: opacity 1500ms, transform 1500ms;

			background-color: rgba(0,0,0,0.6);
		}

		.toast.visible {
			transform: translateY(0);
			opacity: 1;
			animation: tilt-n-move-shaking 0.25s linear 4;
		}

		.toast-body {
			position: relative;
			display: flex;
  			flex-direction: column;
			
			margin: 4vh 3vw;
			font-size: 3.7vw;

			background-color: /*#fcf028*/ /*lightskyblue*/ #f9f3e0;
			color: black;

			max-height: 92%;

			-webkit-appearance: none;
			border-radius: 20px;
			border: 2px #D0A38D solid;
  			outline: 1px gold solid;

			-webkit-box-shadow: inset 0px 0px 3px 1px rgba(0,0,0,0.75), rgba(0, 0, 0, 0.65) -17px 20px 9px 1px;
			-moz-box-shadow: inset 0px 0px 3px 1px rgba(0,0,0,0.75), rgba(0, 0, 0, 0.65) -17px 20px 9px 1px;
			box-shadow: inset 0px 0px 3px 1px rgba(0,0,0,0.75), rgba(0, 0, 0, 0.65) -17px 20px 9px 1px;

		}

		@keyframes tilt-n-move-shaking {
			0% { transform: translate(0, 0) rotate(0deg); }
			25% { transform: translate(5px, 5px) rotate(5deg); }
			50% { transform: translate(0, 0) rotate(0eg); }
			75% { transform: translate(-5px, 5px) rotate(-5deg); }
			100% { transform: translate(0, 0) rotate(0deg); }
		}

		.toast-text {
			position: relative;
			padding: 1vh 2vw;
			overflow-y: auto;
			margin-right: 5px;
  			margin-left: 5px;
			/*color: #592e0a;*/
		}

		.toast-text a {
			text-decoration: underline;
			color: #d0a38d;
			font-weight: bold;
		}

		/* Custom scrollbar */
        .toast-text::-webkit-scrollbar {
            width: 16px; /* Increase the width here */
        }

        .toast-text::-webkit-scrollbar-track {
            background: #f1f1f1;
        }

        .toast-text::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 8px;
        }

        .toast-text::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

		.notification-image-container {
			/*width: calc(100% - 40px);*/
			padding: 20px 20px 0px 20px;
		}

		.notification-image {
			max-width: 100%;
			height: auto;
			margin-top: 15px;
  			margin-bottom: 15px;
		}

		.toast-shadow-body {
			position: absolute;
			width: 100%;
			height: 100%;
			border-radius: 20px;
			top: 0;
			left: 0;
			box-shadow: 0 0 10px 0 rgba(0,0,0,1) inset;
			-webkit-box-shadow: 0 0 10px 0 rgba(0,0,0,1) inset;
		}

		.notification-buttonHolder 
		{
			justify-content: center;
			display: flex;
	  	}

		.notification_close_button 
		{
			width: 100% !important;
			background: #D0A38D;
			outline: none;
			font-family: 'Philosopher' !important;
			font-size: 4vw !important;
			border-radius: 0px 0px 20px 20px !important;
			box-shadow: 0px -3px 2px #888;
			padding: 0.5vh !important;
			color: #f8f2f0;
			background-color: #d0a38d;
			border-style: solid;
			border-width: 0px 0px 0px 0px;
			border-color: #d0a38d;
		}

		.notification-top-img {
			width: 10vw;
  			margin-top: -7vw;
			position: absolute;
			left: calc(50% - 5vw);
			z-index: 101;
			/*
			-webkit-filter: drop-shadow(6px 10px 5px rgba(0, 0, 0, 0.5));
			filter: drop-shadow(6px 10px 5px rgba(0, 0, 0, 0.5));
			*/
		}

	";
	}
        
}
