<?php
error_reporting(E_ALL);
ini_set('display_errors', TRUE);
ini_set('display_startup_errors', TRUE);

require_once(dirname(__FILE__, 5) . '/wp-load.php');

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);

$settings = Settings_Manager::Instance();
$user_manager = User_Manager::Instance();

// Check if admin
if (!current_user_can('administrator')) 
{

	echo '<script>alert("Please login as an administrator!")</script>';
	sleep(2);
    echo '<script type="text/javascript">window.location.href="' . $settings->_kukudushi_base_url . '";</script>';
	exit;
}


function getTypeHtml()
{
    $active_animal_options = getAnimalOptions();
    $all_animal_options = getAnimalOptions(false);

    return '
            <div id="section_old_animal" class="form-group flex-item">
                <div>Select the animal you wish to deactivate:</div>
                <div>
                    <select name="old_animal_selection" id="old_animal_selection" class="select" style="width:100%;">
                        <option value="0">No animal selected..</option>
                        <?php echo getAnimalOptions(); ?>
                    </select>
                </div>
            </div>
            <div id="section_operation_type" class="form-group flex-item" style="display:none;">
                <div>Select what action you would likt to take:</div>
                <div>
                    <select name="operation_type_selection" id="operation_type_selection" class="select" style="width:100%;">
                        <option value="0">Please select an option.</option>
                        <option value="1">Deactivate animal.</option>
                        <option value="2">Deactivate animal & compensate users with x amount of points.</option>
                        <option value="3">Deactivate animal & replace the animal with another animal.</option>
                    </select>
                </div>
            </div>
            <div id="section_new_animal" class="form-group flex-item" style="display:none;">
                <div>Select a new animal:</div>
                <div>
                    <select name="new_animal_selection" id="new_animal_selection" class="select" style="width:100%;">
                        <option value="0">No animal selected..</option>
                        <?php echo getAnimalOptions(false); ?>
                    </select>
                </div>
            </div>
        ';
}

function getAnimalOptions($only_active = true)
{
    $allAnimals = [];
    $animal_manager = Animal_Manager::Instance();
    $allAnimals = $animal_manager->getAllAnimalsForAdminViewer($only_active);

    $optionsHtml = "";
	$firstTagNeeded = true;
	$lastGroup = "";

	foreach ($allAnimals as $animal) 
	{ 
		$currentGroup = $animal->is_active ? "Active (in use)" : $animal->species;
		if ($currentGroup != $lastGroup)
		{
			if (!$firstTagNeeded)
			{
				$optionsHtml .= "</optgroup>";
			}
			$optionsHtml .= "<optgroup label='". $currentGroup ."'>";

			$firstTagNeeded = false;
		}

		$textValue = "";
		if ($animal->is_active)
		{
			$textValue = $animal->species . " - ";
		}

		$textValue .= $animal->name . "\t (last loc: " . $animal->max_dt_move . ")";
		$optionsHtml .= "<option value='". strval($animal->id) ."'>". $textValue ."</option>";
		$lastGroup = $currentGroup;
	}

	$optionsHtml .= "</optgroup>";
    return $optionsHtml;
}

?>
<html>
    <head>
        <script src="https://code.jquery.com/jquery-3.7.0.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.2/moment.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
		<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" />

        <script>

            //Setup form handling
            jQuery(document).ready(function ()
            {

                //initialise select2
                jQuery('.select').select2();

                //Handle step 1: select animal to deactivate
                jQuery('#old_animal_selection').on('change', function() 
                {
                    // Get the value of the selected option
                    var selectedValue = jQuery(this).val();

                    // Check if the selected option value is other than '0'
                    if(selectedValue !== '0') 
                    {
                        jQuery('#section_operation_type').show();
                    } 
                    else 
                    {
                        jQuery('#section_operation_type').hide();
                        jQuery('#section_new_animal').hide();
                        jQuery('#restart_track_container').hide();
                        jQuery('#restart_information_container').hide();
                    }
                });

                //Handle step 2: select operation type
                jQuery('#operation_type_selection').on('change', function() 
                {
                    // Get the value of the selected option
                    var selectedValue = parseInt(jQuery(this).val());

                    console.log(selectedValue);

                    switch (selectedValue)
                    {
                        case 0: //No selection made
                            jQuery('#section_new_animal').hide();
                            jQuery('#points_award_container').hide();
                            jQuery('#customize_notification_container').hide();
                            jQuery('#notification_container').hide();
                            jQuery("#execute_changes").prop('disabled', true);
                            break;

                        case 1: //Deactivate
                            jQuery('#section_new_animal').hide();
                            jQuery('#points_award_container').hide();
                            jQuery('#customize_notification_container').show();
                            jQuery("#execute_changes").prop('disabled', false);
                            
                            jQuery('#cbx_custom_notification').trigger('change');
                            break;

                        case 2: //Deactivate + Points
                            jQuery('#section_new_animal').hide();
                            jQuery('#points_award_container').show();
                            jQuery('#customize_notification_container').show();
                            jQuery("#execute_changes").prop('disabled', false);

                            jQuery('#cbx_custom_notification').trigger('change');
                            break;

                        case 3: //Deactivate + Replace
                            jQuery('#section_new_animal').show();
                            jQuery('#points_award_container').hide();
                            jQuery('#customize_notification_container').show();
                            jQuery("#execute_changes").prop('disabled', false);

                            jQuery('#cbx_custom_notification').trigger('change');
                            break;

                    }
                });

                jQuery('#deactivate_animal_form').on("submit", function(event)
				{  
                    event.preventDefault();
                    
                    var formData = new FormData(this);

                    jQuery.ajax({
                        type: "POST",
                        url: "/kukudushi_custom/admin/form_handles/save_deactivate_production_animal.php",
                        data: formData,
                        contentType: false,
                        processData: false,
                        dataType: "json",
                        success: function (data)
                        {
                            var message_fade_time = 1500;
                            if (data.code == "200")
                            {
                                jQuery(".display-error").html("<ul style=\'padding: 15px;margin:auto;\'>Success: <br />" + data.message + "</ul>");
                                jQuery(".display-error").css("display", "block");
                                jQuery(".display-error").css("background-color", "green");
                                jQuery(".display-error").css("color", "white");
                                jQuery(".display-error").css("opacity", 1);

                                /*
                                jQuery("#type_selection").val(data.type_id).change();
                                jQuery("#animal_selection").val(data.animal_id).change();
                                */
                            }
                            else
                            {
                                message_fade_time = 5000;
                                jQuery(".display-error").html("<ul style=\'padding: 15px;margin:auto;\'>" + data.message + "</ul>");
                                jQuery(".display-error").css("display", "block");
                                jQuery(".display-error").css("background-color", "red");
                                jQuery(".display-error").css("color", "black");
                                jQuery(".display-error").css("opacity", 1);
                            }

                            jQuery(".display-error").delay(2500).fadeOut(message_fade_time, function()
                            {
                                // Animation complete.
                                //jQuery(".display-error").css("opacity", 0);
                            });

                        }
                    });
                });

                // Handle the customize notification checkbox toggle
                jQuery('#cbx_custom_notification').change(function() 
                {
                    if (this.checked) 
                    {
                        jQuery('#notification_container').show();
                    } 
                    else 
                    {
                        jQuery('#notification_container').hide();
                    }
                });

            });
        </script>
        <style>
            .display-error {
				position: fixed;

				width: 90%;
				margin: auto;
			    top: 50px;
			    left: 5%;
			    line-height: /*40px*/ normal;
			    text-align: center;
				z-index: 99999;
				opacity: 0;
				border-radius: 30px;

				box-shadow: 0 60px 80px rgba(0,0,0,0.60), 0 45px 26px rgba(0,0,0,0.14);
				-webkit-box-shadow: 0 60px 80px rgba(0,0,0,0.60), 0 45px 26px rgba(0,0,0,0.14);

				transition: none;
			}
            
            .steps_container {
                display: flex;
                flex-direction: column;
                margin: 15px;
                max-width: 25%;
                gap: 5px;
            }

            .flex-item {
                display:flex;
                flex-direction: column;
            }

            label {
                font-weight: bold;
            }

            .center {
				text-align: center;
			}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Select Animals</h2>
            <form id="deactivate_animal_form" class="form-horizontal" action="" method="post" enctype="multipart/form-data">
                <div id="section_old_animal" class="form-group">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <label for="points_amount">Select the animal you wish to deactivate:</label>
                                <select name="old_animal_selection" id="old_animal_selection" class="select" style="width:100%;">
                                    <option value="0">No animal selected..</option>
                                    <?php echo getAnimalOptions(); ?>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="section_operation_type" class="form-group" style="display:none;">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <label for="points_amount">Select what action you would like to take:</label>
                                <select name="operation_type_selection" id="operation_type_selection" class="select" style="width:100%;">
                                    <option value="0">Please select an option.</option>
                                    <option value="1">Deactivate animal.</option>
                                    <option value="2">Deactivate animal & compensate users with x amount of points.</option>
                                    <option value="3">Deactivate animal & replace the animal with another animal.</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="section_new_animal" class="form-group" style="display:none;">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <label for="points_amount">Select a new animal:</label>
                                <select name="new_animal_selection" id="new_animal_selection" class="select" style="width:100%;">
                                    <option value="0">No animal selected..</option>
                                    <?php echo getAnimalOptions(false); ?>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="points_award_container" class="form-group" style="display:none;">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <label for="points_amount">Points amount:</label>
                                <input type="number" id="points_amount" name="points_amount" class="form-control" min="1" value="1000">
                            </div>
                        </div>
                    </div>
                </div>
                <div id="customize_notification_container" class="form-group" style="display:none;">
                    <div class="col-md-12 center">
                        <label for="cbx_customize_notification" class="control-label col-md-12 center">Custom Notification (Only use if absolutely necessary)</label>
                        <input type="checkbox" id="cbx_custom_notification" name="cbx_custom_notification" class="center">
                    </div>
                </div>
                <div id="notification_container" class="form-group" style="display:none;">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <label for="points_amount">Notification Message:</label>
                                <textarea name="notification_message" id="notification_message" class="form-control" rows="6" maxlength="1024" data-lpignore="true"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="col-md-offset-2 col-md-10">
                        <input type="submit" value="Execute" name="execute_changes" id="execute_changes" class="btn btn-primary" disabled/>
                    </div>
                </div>
            </form>
        </div>
        <div id="display-error" class="display-error" style="display:none;">
        </div>
    </body>
</html>