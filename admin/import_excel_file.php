<?php
error_reporting(E_ALL);
ini_set('display_errors', TRUE);
ini_set('display_startup_errors', TRUE);

session_start();

require_once ($_SERVER["HOME"] .'/vendor/autoload.php');
use PhpOffice\PhpSpreadsheet\IOFactory;

require_once(dirname(__FILE__, 5) . '/wp-load.php');

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);

$user_manager = User_Manager::Instance();
$settings = Settings_Manager::Instance();

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
    $types = [[19, "Animal Tracker"],
                [1, "Certificate"],
                [9, "Horoscope"],
                [18, "Gospel"],
                [6, "Custom Media"],
                [22, "Wisdom"],
                [27, "LionsDive"],
                [8, "Lions Dive Beach Resort Cam"],
                [29, "BRANCH Coral Foundation"],
                [16, "PinkRibbon"]];
    $options = "";

    foreach ($types as $type)
    {
        $id = $type[0];
        $typeName = $type[1];
        $options = $options . '<option value="'. $id .'">'. $typeName .'</option>';
    }

    $animal_options = getAnimalOptions();
    $selected = '';

    if (!str_contains($animal_options, 'selected="selected"'))
    {
        $selected = 'selected="selected"';
    }

    return '
            <div id="section_type" style="display: flex; flex-direction: column;">
                <div>Type: </div>
                <div>
                    <select name="type_selection" class="select" id="type_selection" onchange="changeSelection()">
                        '. $options . '
                    </select>
                </div>
            </div>
            <div id="section_animal" style="display: flex; flex-direction: column;">
                <div>Animal:</div>
                <div>
                    <select name="animal_selection" id="animal_selection" class="select" style="width:75vw;">
                        <option value="0" '. $selected .'>No animal selected..</option>
                        ' . $animal_options . '
                    </select>
                </div>
            </div>
            <br />
            <br />
        ';
}

function getAnimalOptions()
{
    $animals_manager = Animal_Manager::Instance();
    $animals = $animals_manager->getAllActiveAnimals();
    $options = "";
    foreach ($animals as $animal) 
    {
        $options = $options . "<option value='" . $animal->id . "'>" . $animal->species . "&#9; - &#9;" . $animal->name . "</option>";
    }
    return $options;
}

function readExcel($filePath)
{
	//$inputFileName = __DIR__ . '/230905 certificaatjes.xlsx';
	$inputFileName = $filePath;
	$spreadsheet = IOFactory::load($inputFileName);

	for ($x = 1; $x <= 1000000; $x++) 
	{
		$value = $spreadsheet->getActiveSheet()->getCell('A' . strval($x));
		
		if (empty($value))
		{
			print("Total: ". strval($x - 1));
			break;
		}
		print($value);
		print("<br />");
	}
}


?>
<html>
    <head>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
        <script>
            function changeSelection()
            {
                var sel = document.getElementById("type_selection");
                var value = sel.value;
                var animalSelector = jQuery("#animal_selection");
                var animalSection = jQuery("#section_animal");

                if (value == 19)
                {
                    animalSelector.prop("disabled", false);
                    animalSelector.css("opacity", 1);
                    animalSection.css("display", "flex");

                }
                else
                {
                    animalSelector.prop("disabled", true);
                    animalSelector.prop("value", 0);
                    animalSelector.css("opacity", 0.5);
                    animalSection.css("display", "none");
                }
            }

            //Setup form handling
            jQuery(document).ready(function ()
            {
                jQuery("#submit").click(function (e)
                {
                    e.preventDefault();

                    //var type_id = jQuery("#type_selection").val();
                    //var animal_id = jQuery("#animal_selection").val();
                    //ar file = jQuery("#fileToUpload")[0].files[0];
                    
                    var formData = new FormData();
                    formData.append('file', jQuery("#fileToUpload")[0].files[0]);
                    formData.append('type_selection', jQuery("#type_selection").val());
                    formData.append('animal_selection', jQuery("#animal_selection").val());

                    jQuery.ajax({
                        type: "POST",
                        url: "/kukudushi_custom/admin/form_handles/save_upload_excel_file.php",
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
        </style>
    </head>
</body>
<form name="add_excel_data_form" id="add_excel_data_form" action="" method="post" enctype="multipart/form-data">
    <div>
        <div>
            Select excel file to upload:
        </div>
        <input type="file" name="fileToUpload" id="fileToUpload"/>
        <?php echo getTypeHtml(); ?>
        <input type="submit" value="Upload Image" name="submit" id="submit"/>
    </div>
</form>
<div id="display-error" class="display-error" style="display:none;">
</div>
</body>
</html>