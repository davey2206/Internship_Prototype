<?php
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);
	
	require_once(dirname(__FILE__, 5) . '/wp-load.php');

	require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
	Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
	Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);
	Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);
	Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_location);
	
	$settings = Settings_Manager::Instance();
	$user_manager = User_Manager::Instance();
	$animal_manager = Animal_Manager::Instance();
	$location_manager = Location_Manager::Instance();

	// Check if admin
	if (!current_user_can('administrator')) 
	{
	
		echo '<script>alert("Please login as an administrator!")</script>';
		sleep(2);
		echo '<script type="text/javascript">window.location.href="' . $settings->_kukudushi_base_url . '";</script>';
		exit;
	}


	$kukudushiImage = $settings->_kukudushi_logo_transparent;
	$turtleReleaseIcon = $settings->_kukudushi_custom_media_dir_url . "/release_turtle.webp";
	$turtleLastKnownLocationIcon = $settings->_kukudushi_custom_media_dir_url ."/last_known_location.png";
	$turtleSpeciesIcon = $settings->_kukudushi_custom_media_dir_url . "/species.png";
	$mapsCustomCloseIcon = $settings->_kukudushi_custom_media_dir_url . "/close.webp";
	$greenPhenixLogo = $settings->_kukudushi_custom_media_dir_url . "/green_phenix_logo.webp";
	$plasticOceanTurtleImage = $settings->_kukudushi_custom_media_dir_url . "/window_vanish_background_media/image_fade_plastic_ocean_turtle.webp";
	$plasticOceanDolphinImage = $settings->_kukudushi_custom_media_dir_url . "/window_vanish_background_media/image_fade_plastic_ocean_dolphin.webp";
	$allAnimals = NULL;
	$currentAnimal = NULL;
	$initialAnimalId = 0;

	$animalPicture = NULL;

	$allAnimals = $animal_manager->getAllAnimalsForAdminViewer();

	//Set current animal
	if (isset($_GET["id"]) && is_numeric($_GET["id"]) && intval($_GET["id"]) > 0)
    {
		$initialAnimalId = intval($_GET["id"]);
		foreach ($allAnimals as $animal)
        {
            if (intval($animal->id) == $initialAnimalId)
            {
				$currentAnimal = $animal;
            }
        }
    }
	if ($currentAnimal == null)
    {
        $currentAnimal = $allAnimals[0];
		$initialAnimalId = $allAnimals[0]->id;
    }

	//get Turtle picture
	$animalPicture = $settings->_kukudushi_custom_media_dir_url . "/animal_pictures/". $currentAnimal->id .".webp";

	if (!str_contains(strtolower($currentAnimal->species), "turtle"))
    {
		$turtleReleaseIcon = $settings->_kukudushi_custom_media_dir_url . "/release_animal.png";
    }

	//get positions
	$animal = $animal_manager->getAnimalById($currentAnimal->id);

	$optionsHtml = "";
	$firstTagNeeded = true;
	$lastGroup = "";
	//$isactiveGroup = true;
	$selected = "";
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

		
		if ($animal->id == $currentAnimal->id)
		{
			$selected = 'selected';
		}
		

		$textValue .= $animal->name . "\t (" . $animal->max_dt_move . " <- " . $animal->min_dt_move . ", locs: " . $animal->location_count . ")"; 
		$optionsHtml .= "<option value='". strval($animal->id) ."' ". $selected .">". $textValue ."</option>";
		$lastGroup = $currentGroup;
	}
	$optionsHtml .= "</optgroup>";
				

?>
<html>
	<head>
        <link rel="icon" href="https://i0.wp.com/nick-test.kukudushi.com/wp-content/uploads/2020/11/logo.png?fit=32%2C32&amp;ssl=1" sizes="32x32" />
        <link rel="icon" href="https://i0.wp.com/nick-test.kukudushi.com/wp-content/uploads/2020/11/logo.png?fit=120%2C120&amp;ssl=1" sizes="192x192" />
        <meta name="msapplication-TileImage" content="https://i0.wp.com/nick-test.kukudushi.com/wp-content/uploads/2020/11/logo.png?fit=120%2C120&amp;ssl=1" />
        <link rel="apple-touch-icon" href="https://i0.wp.com/nick-test.kukudushi.com/wp-content/uploads/2020/11/logo.png?fit=120%2C120&amp;ssl=1" />
        <!-- This site is optimized with the Yoast SEO plugin v20.6 - https://yoast.com/wordpress/plugins/seo/ -->
        <title>Kukudushi - the #1 souvenir of Curacao -</title>
        <meta name="description" content="Only found on the tropical island Curacao. Unique and handmade by a talented artist. This is what makes this beautiful peace of magical jewellery very special." class="yoast-seo-meta-tag" />
        <link rel="canonical" href="https://kukudushi.com/" class="yoast-seo-meta-tag" />
        <meta property="og:locale" content="nl_NL" class="yoast-seo-meta-tag" />
        <meta property="og:type" content="website" class="yoast-seo-meta-tag" />
        <meta property="og:title" content="Kukudushi - the #1 souvenir of Curacao -" class="yoast-seo-meta-tag" />
        <meta property="og:description" content="Only found on the tropical island Curacao. Unique and handmade by a talented artist. This is what makes this beautiful peace of magical jewellery very special." class="yoast-seo-meta-tag" />
        <meta property="og:url" content="https://kukudushi.com/" class="yoast-seo-meta-tag" />
        <meta property="article:publisher" content="https://www.facebook.com/Kukudushi-Cura%c3%a7ao-107510541186098" class="yoast-seo-meta-tag" />
        <meta property="article:modified_time" content="2022-10-17T09:44:12+00:00" class="yoast-seo-meta-tag" />
        <meta property="og:image" content="https://kukudushi.com/wp-content/uploads/2022/01/kukudushi-tekst-colorful-goede-kwaliteit.png" class="yoast-seo-meta-tag" />
        <meta name="twitter:card" content="summary_large_image" class="yoast-seo-meta-tag" />
        <meta name="twitter:label1" content="Geschatte leestijd" class="yoast-seo-meta-tag" />
        <meta name="twitter:data1" content="3 minuten" class="yoast-seo-meta-tag" />
        <script type="application/ld+json" class="yoast-schema-graph">{"@context":"https://schema.org","@graph":[{"@type":"WebPage","@id":"https://kukudushi.com/","url":"https://kukudushi.com/","name":"Kukudushi - the #1 souvenir of Curacao -","isPartOf":{"@id":"https://kukudushi.com/#website"},"about":{"@id":"https://kukudushi.com/#organization"},"primaryImageOfPage":{"@id":"https://kukudushi.com/#primaryimage"},"image":{"@id":"https://kukudushi.com/#primaryimage"},"thumbnailUrl":"https://kukudushi.com/wp-content/uploads/2022/01/kukudushi-tekst-colorful-goede-kwaliteit.png","datePublished":"2020-11-02T19:04:18+00:00","dateModified":"2022-10-17T09:44:12+00:00","description":"Only found on the tropical island Curacao. Unique and handmade by a talented artist. This is what makes this beautiful peace of magical jewellery very special.","breadcrumb":{"@id":"https://kukudushi.com/#breadcrumb"},"inLanguage":"nl","potentialAction":[{"@type":"ReadAction","target":["https://kukudushi.com/"]}]},{"@type":"ImageObject","inLanguage":"nl","@id":"https://kukudushi.com/#primaryimage","url":"https://i0.wp.com/kukudushi.com/wp-content/uploads/2022/01/kukudushi-tekst-colorful-goede-kwaliteit.png?fit=343%2C59&ssl=1","contentUrl":"https://i0.wp.com/kukudushi.com/wp-content/uploads/2022/01/kukudushi-tekst-colorful-goede-kwaliteit.png?fit=343%2C59&ssl=1","width":343,"height":59},{"@type":"BreadcrumbList","@id":"https://kukudushi.com/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home"}]},{"@type":"WebSite","@id":"https://kukudushi.com/#website","url":"https://kukudushi.com/","name":"","description":"","publisher":{"@id":"https://kukudushi.com/#organization"},"potentialAction":[{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://kukudushi.com/?s={search_term_string}"},"query-input":"required name=search_term_string"}],"inLanguage":"nl"},{"@type":"Organization","@id":"https://kukudushi.com/#organization","name":"Kukudushi","url":"https://kukudushi.com/","logo":{"@type":"ImageObject","inLanguage":"nl","@id":"https://kukudushi.com/#/schema/logo/image/","url":"https://kukudushi.com/wp-content/uploads/2020/12/logo-kukudushi-transparant-tbv-website-e1609425057320.png","contentUrl":"https://kukudushi.com/wp-content/uploads/2020/12/logo-kukudushi-transparant-tbv-website-e1609425057320.png","width":130,"height":131,"caption":"Kukudushi"},"image":{"@id":"https://kukudushi.com/#/schema/logo/image/"},"sameAs":["https://www.facebook.com/Kukudushi-Curaçao-107510541186098"]}]}</script>
        <meta name="msvalidate.01" content="BF804BC0EFB894F9A7DE0ABBBDCD4ED9" class="yoast-seo-meta-tag" />
        <meta name="google-site-verification" content="QQ0mLKu5rQoYljMXMHa65UgxC7fm4pMYwomD1TogUDo" class="yoast-seo-meta-tag" />
        <!-- / Yoast SEO plugin. -->

	    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
		<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
		<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
		<style>
			html, body{
			height: 100%;
			
			margin: 0;
			padding: 0;
			}
			.resp-iframe {
			height: inherit;
			}

			.display-error {
				position: fixed;

				width: 90%;
				margin: auto;
			    top: 50px;
			    left: 5%;
			    line-height: /*40px*/ normal;
			    text-align: center;
				z-index: 9999999;
				opacity: 0;
				border-radius: 30px;

				box-shadow: 0 60px 80px rgba(0,0,0,0.60), 0 45px 26px rgba(0,0,0,0.14);
				-webkit-box-shadow: 0 60px 80px rgba(0,0,0,0.60), 0 45px 26px rgba(0,0,0,0.14);

				transition: none;
			}
			
			.turtle_table {
			width: 100%;
			color: #fff;
			border-collapse: collapse;
			font-family: 'Mukta Malar', sans-serif;
			font-weight: 300; 
			font-size: 28px;
			}
			.table_turtleName {
			font-size: 34px;
			text-align: center;
			border-bottom:1px solid #f9e814;
			}
			.table_turtlePicture {
			padding: 0px;
			/*width:50%;*/
			height: 250px;
			max-width: 335px;
			/*overflow: hidden;*/
			}
			.turtlePicture {
			height: 100%;
			width: 100%;
			object-fit: cover;
			}
			.table_icon {
			width: 1px;
			text-align: center;
			white-space: nowrap;
			}
			.icon {
			height: 35px;
			}
			.table_iconValue {
			white-space: nowrap;
			padding: 0px 5px 0px 5px;
			}
			.table_description {
			max-width: 400px;
			padding: 1px 10px 10px;
			}
			
			/* Style image slowly vanish */
			#imageSlowlyVanish {
			  display: block;
			  position: fixed;
			  bottom: 0;
			  left: 0;
			  width: 100%;
			  min-height: 100%;
			  height: 100%;
			  opacity: 1;
			  z-index:100001;
			  margin: 0 auto;
			}
			#imageSlowlyVanish img {
			  width:100%;
			  height: 100%;
			  display:block;
			  margin:auto;
			}	
			
			/*Custom close icon*/
			button.gm-ui-hover-effect > span {
			display: none !important;
			}
			button.gm-ui-hover-effect {
			opacity: 1 !important;
			background: url('<?php echo $mapsCustomCloseIcon; ?>') center center !important;
			background-repeat: no-repeat !important;
			background-size: 50px 50px !important;
			/* above is a good size or uncomment the next line */
			/* background-size: contain !important; */
			position: absolute;
			right: 0px !important;
			top: 0px !important;
			}
			
			/*Maps InfoWindow style override*/
			.gm-style .gm-style-iw-c {
			padding: 0px !important;
			background-color: #002b7f !important; /* #002b7f */
			border: 2px solid #f9e814 !important; /* #f9e814 */
			max-width: 675px !important;
			width: 675px !important;
			max-height: 500px !important;
			/*height: 450px !important;*/
			}
			.gm-style-iw-d {
			max-height: 500px !important;
			}
			
			/*Maps InfoWindow bottom arrow style override*/
			.gm-style .gm-style-iw-tc::after {
			background-color: #f9e814 !important;
			}
			
			/*Fix android scroll bars*/
			.gm-style-iw div {
			overflow: hidden !important;
			line-height: 1.35em;
			}
			
			/*import google font */
			@import url('https://fonts.googleapis.com/css2?family=Mukta+Malar:wght@300&display=swap');
		</style>
		<script>
			//Initialize initial animal properties
			window.animal = <?php echo json_encode($currentAnimal); ?>;
			window.animalPositions = <?php echo json_encode($location_manager->getLocations($currentAnimal, true)); ?>;

			function getAnimalPicturePath()
			{
				const animal_image_path = "<?php echo $settings->_kukudushi_animal_pictures_dir_url; ?>";
				return animal_image_path + "/" + window.animal.id + ".webp";
			}

			function getAnimalIcon(species)
			{
				var image_directory = "<?php echo $settings->_kukudushi_custom_media_dir_url; ?>";

				if (species.toLowerCase().includes("dolphin"))
				{
					return image_directory + "/animal_tracking_icons/dolphin.webp";
				}
				else if (species.toLowerCase().includes("polar bear"))
				{
					return image_directory + "/animal_tracking_icons/polar_bear.webp";
				}
				else if (species.toLowerCase().includes("whale"))
				{
					return image_directory + "/animal_tracking_icons/whale_2.webp";
				}
				else if (species.toLowerCase().includes("shark"))
				{
					return image_directory + "/animal_tracking_icons/shark.webp";
				}
				else if (species.toLowerCase().includes("lion"))
				{
					return image_directory + "/animal_tracking_icons/lion.webp";
				}
				else if (species.toLowerCase().includes("penguin"))
				{
					return image_directory + "/animal_tracking_icons/penguin.webp";
				}
				else
				{
					return image_directory + "/animal_tracking_icons/turtle.webp";
				}
			}

		</script>

		<script>

			//Setup form handling
			//jQuery(window).on('load', function() {
			jQuery(document).ready(function() 
			{
				var messageHtml = document.createElement("div");
				messageHtml.className = "display-error";
				messageHtml.style.cssText = "display: none;";
				document.body.appendChild(messageHtml);

				//jQuery('#selected_animal').select2();
				//("#selected_animal").find('option:eq(0)').prop('selected', true);

				//jQuery('#selected_animal').select2().on('select2:open', function () {
					// After the dropdown is opened, select the first option
					//jQuery("#selected_animal").find('option:eq(0)').prop('selected', true).trigger('change');
				//});

				jQuery(document).on('click', '#save_changes_btn', function(e) 
				{
					e.preventDefault();

					if (new_markers.length < 1)
					{
						return
					}

					jQuery("#selected_animal").prop( "disabled", true );
					jQuery(".save_changes_btn").prop( "disabled", true );


					var animal_id = jQuery("#selected_animal").val();
					var new_locations_data = []

					new_markers.forEach(marker => 
					{
						var position_lat = marker.position.lat;
						var position_lon = marker.position.lng;
						var dt_move = marker.dt_move;
						var location_tuple = [[position_lat, position_lon], dt_move];
						new_locations_data.push(location_tuple);
					});

					jQuery.ajax({
						type: "POST",
						url: "/kukudushi_custom/admin/form_handles/save_animal_track.php",
						dataType: "json",
						data: 
						{
							animal_id: animal_id,
							new_locations_data: new_locations_data,
						},
						success: function(data) 
						{
							if (data.code == "200") 
							{
								jQuery(".display-error").html("<ul style=\'padding: 15px;margin:auto;\'>Success: <br />" + data.message + "</ul>");
								//jQuery(".display-error").html("<ul>Success: <br />" + data.message + "</ul>");
								jQuery(".display-error").css("display", "block");
								jQuery(".display-error").css("background-color", "green");
								jQuery(".display-error").css("color", "white");
								jQuery(".display-error").css("opacity", 1);
								jQuery(".display-error").delay(1000).fadeOut(1500, function() 
								{
									// Animation complete.
									window.animalPositions = data.animal_positions;
									window.animal = data.animal;
									appendMarkers();

            						//Change url parameter
									window.history.replaceState(null, null, '?id=' + data.animal.id);
								});

							} 
							else 
							{
								jQuery(".display-error").html("<ul style=\'padding: 15px;margin:auto;\'>" + data.message + "</ul>");
								jQuery(".display-error").css("display", "block");
								jQuery(".display-error").css("background-color", "red");
								jQuery(".display-error").css("color", "black");
								jQuery(".display-error").css("opacity", 1);

								jQuery(".display-error").delay(2500).fadeOut(1500);
							}
						},
						complete: function() 
						{
							jQuery("#selected_animal").prop( "disabled", false );
							jQuery(".save_changes_btn").prop( "disabled", false );
						}
					});

				});

				jQuery(document).on('change', '#selected_animal', function(e) 
				{
					e.preventDefault();
					var animal_id = jQuery("#selected_animal").val();

					jQuery("#selected_animal").prop( "disabled", true );
					//Change url parameter
					window.history.replaceState(null, null, '?id=' + animal_id);

					jQuery.ajax({
						type: "POST",
						url: "/kukudushi_custom/admin/form_handles/get_animal_track.php",
						dataType: "json",
						data: {
							animal_id: animal_id,
						},
						success: function(data) {
							if (data.code == "200") {
								jQuery(".display-error").html("<ul style=\'padding: 15px;margin:auto;\'>Success: <br />" + data.message + "</ul>");
								//jQuery(".display-error").html("<ul>Success: <br />" + data.message + "</ul>");
								jQuery(".display-error").css("display", "block");
								jQuery(".display-error").css("background-color", "green");
								jQuery(".display-error").css("color", "white");
								jQuery(".display-error").css("opacity", 1);
								jQuery(".display-error").delay(1000).fadeOut(1500, function() {
									// Animation complete.
									window.animalPositions = data.animal_positions;
									window.animal = data.animal;
									appendMarkers();

            						//Change url parameter
									window.history.replaceState(null, null, '?id=' + data.animal.id);
								});

							} 
							else 
							{
								jQuery(".display-error").html("<ul style=\'padding: 15px;margin:auto;\'>" + data.message + "</ul>");
								jQuery(".display-error").css("display", "block");
								jQuery(".display-error").css("background-color", "red");
								jQuery(".display-error").css("color", "black");
								jQuery(".display-error").css("opacity", 1);

								jQuery(".display-error").delay(2500).fadeOut(1500);
							}
						},
						complete: function() 
						{
							var previous_Window = null;
							var all_markers = [];
							var new_markers = [];
							var new_marker_in_edit = null;
							var new_info_window_in_edit = null;
							var marker_line = null;

							jQuery("#selected_animal").prop( "disabled", false );
						}
					});
				});

				//jQuery("#selected_animal").find('option:eq(0)').prop('selected', true);
				//if (jQuery("#selected_animal").val() == null || jQuery("#selected_animal").val.length < 1 )
				//{
				//	jQuery("#selected_animal").find('option:eq(0)').prop('selected', true);
				//}
				
			});
		</script>
		<script>
			//Last opened infowindow
			var previous_Window = null;
			var all_markers = [];
			var new_markers = [];
			var new_marker_in_edit = null;
			var new_info_window_in_edit = null;
			var marker_line = null;

			//import polyfill script
			var importScript = document.createElement("script");
			importScript.setAttribute("src","https://polyfill.io/v3/polyfill.min.js?features=default");
			document.head.appendChild(importScript);
			//import maps api key
			var importMapsScript = document.createElement("script");
			importMapsScript.setAttribute("src","https://maps.googleapis.com/maps/api/js?key=AIzaSyA2Ko7mCqiDmPZchikHuYzO6YoKOBL2nV4&callback=initMap&v=weekly");
			document.head.appendChild(importMapsScript);

			//Create Save Changes button to save newly added locations
			function createSaveChangesButton(map) 
			{
				const contentHolder = document.createElement("div");
				contentHolder.style.position = "relative";
				contentHolder.style.display = "flex";
				contentHolder.style.flexDirection = "column";

				contentHolder.style.backgroundColor = "rgb(255, 255, 255)";
				contentHolder.style.border = "2px solid rgb(255, 255, 255)";
				contentHolder.style.borderRadius = "3px";
				contentHolder.style.boxShadow = "rgba(0, 0, 0, 0.3) 0px 2px 6px";
				contentHolder.style.color = "rgb(25, 25, 25)";
				contentHolder.style.fontSize = "24px";
				contentHolder.style.margin = "8px 0px 0px";
				contentHolder.style.padding = "0px 5px";
				contentHolder.style.lineHeight = "38px";
				contentHolder.style.textAlign = "center";

				// Create a label for the number input field
				const numberInputLabel = document.createElement("label");
				numberInputLabel.htmlFor = "location_days_interval_ctrl";
				numberInputLabel.textContent = "Days interval:";
				numberInputLabel.style.marginRight = "10px"; // Optional, for spacing


				// Create a number input field for positive values
				const numberInput = document.createElement("input");
				numberInput.type = "number";
				numberInput.value = 1;
				numberInput.min = 1; 
				numberInput.max = 10;
				numberInput.className = "location_days_interval_ctrl";
				numberInput.id = "location_days_interval_ctrl";
				numberInput.style.marginBottom = "10px"; // Optional, for spacing

				const controlButton = document.createElement("input");
				controlButton.type = "submit";
				controlButton.value = "Save Changes!";
				controlButton.className = "save_changes_btn";
				controlButton.id = "save_changes_btn";
				controlButton.disabled = true;

				// Set CSS for the Green Phenix control.
				controlButton.style.backgroundColor = "#fff";
				controlButton.style.border = "2px solid #fff";
				controlButton.style.borderRadius = "3px";
				controlButton.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
				controlButton.style.color = "rgb(25,25,25)";
				controlButton.style.fontFamily = "Roboto,Arial,sans-serif";
				controlButton.style.fontSize = "24px";
				controlButton.style.lineHeight = "38px";
				controlButton.style.margin = "8px 0 0px";
				controlButton.style.padding = "0 5px";
				controlButton.style.textAlign = "center";

				contentHolder.appendChild(numberInputLabel);
				contentHolder.appendChild(numberInput);
				contentHolder.appendChild(controlButton);
				
				return contentHolder;
			}


			//Create Back to Kukudushi Home button
			function createReturnToKukudushiHomeControl(map)
			{
            	const selectControl = document.createElement("select");
                selectControl.id = "selected_animal";
				selectControl.class = "selected_animal";
				selectControl.style.height = "50px";
				/*selectControl.style.width = "150px";*/
				selectControl.style.fontWeight = "bold";
				selectControl.style.fontSize = "24px";
				
				selectControl.innerHTML += "<?php echo $optionsHtml;?>";
				selectControl.value = <?php echo $initialAnimalId; ?>;
				
				return selectControl;
			}
			
			// Initialize and add the map
			function initMap() 
			{
				
            	// The map, centered at Uluru
				window.map = new google.maps.Map(document.getElementById("map"), 
				{
					zoom: 12,
					/*center: { lat: parseFloat(animalPositions[0].lat), lng: parseFloat(animalPositions[0].lng)},*/
					mapTypeId: "hybrid",
					fullscreenControl: false,
				});
				
				appendMarkers();
				

				//Set maximum zoom level
            	window.map.setOptions({maxZoom: 16});
				
				//Create return to kukudushi home button
				// Create the DIV to hold the control.
				const centerControlDiv = document.createElement("div");
				centerControlDiv.style.cssText += 'display:flex;flex-direction:column';
				// Create the control.
				const centerControl = createReturnToKukudushiHomeControl(window.map);
				
				// Append the control to the DIV.
				centerControlDiv.appendChild(centerControl);


				window.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(centerControlDiv);
				
				
				//Create Thank you for supporting Green Phenix button
				// Create the DIV to hold the control.
				const centerControlDivGF = document.createElement("div");
				// Create the control.
				const centerControlGF = createSaveChangesButton(window.map);
				
				// Append the control to the DIV.
				centerControlDivGF.appendChild(centerControlGF);
				window.map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDivGF);

				// Add click event listener to the map
				google.maps.event.addListener(window.map, 'click', function(event) {
					addClickableMarker(event.latLng, window.map);
				});
				
				//Select animal from url parameter
            	//jQuery('select').prop('selectedIndex', 1);
			}

			function appendMarkers()
			{

				if (all_markers != null && all_markers.length > 0)
				{
					removeAllMarkersAndLines();
				}

				if (marker_line != null)
				{
					//DELETE ALL EXISTING LINES
				}

				var icon = {
					url: getAnimalIcon(window.animal.species), // url + image selector for css
					scaledSize: new google.maps.Size(96, 96), // scaled size
					origin: new google.maps.Point(0, 0), // origin
					anchor: new google.maps.Point(48, 48), // anchor
				};
				//Initiate map bounds
				var bounds = new google.maps.LatLngBounds();

				//////START FIRST ICON//////
				var firstMarker = new google.maps.Marker({
					position: { lat: parseFloat(window.animalPositions[0].lat), lng: parseFloat(window.animalPositions[0].lng)},
					dt_move: window.animalPositions[0].dt_move,
					icon: icon,
					map: window.map,
					zIndex: 1001,
					optimized: false,
				});


				const launchPosition = window.animalPositions[window.animalPositions.length - 1];
				//Add context menu to marker
				const contentFirstTurtlePoint =
				"<div><table class='turtle_table'>" +
				"<tr><td class='table_turtleName' colspan='3'><b>" + window.animal.name + "</b></td>" +
				"<tr><td class='table_turtlePicture' rowspan='5'><img class='turtlePicture' src='" + getAnimalPicturePath() + "'/></td><td></td><td></td></tr>" +
				"<tr style='height:83px;'><td class='table_icon'><img class='icon' src='<?php echo $turtleLastKnownLocationIcon; ?>' /></td><td class='table_iconValue' style='vertical-align:center;'>" + window.animalPositions[0].dt_move + "</td></tr>" +
				"<tr style='height:83px;'><td class='table_icon'><img class='icon' src='<?php echo $turtleReleaseIcon; ?>' /></td><td class='table_iconValue' style='vertical-align:center;'>" + launchPosition.dt_move + "</td></tr>" +
				"<tr style='height:83px;'><td class='table_icon'><img class='icon' src='<?php echo $turtleSpeciesIcon; ?>' /></td><td class='table_iconValue' style='vertical-align:center;'>" + window.animal.species + "</td></tr>" +
				"<tr><td></td><td></td></tr>" +
				"<tr><td class='table_description' rowspan='2' colspan='3'>" + window.animal.description + "</td></tr>" +
				"<tr></tr>" +
				"</table></div>";

				const firstMarkerInfoWindow = new google.maps.InfoWindow({
					content: contentFirstTurtlePoint,
					ariaLabel: "TurtlePoint",
            		closed: true
				});

				/*
				firstMarker.addListener("mouseover", () => {
					firstMarkerInfoWindow.open({
						anchor: firstMarker,
						window.map,
					});
				});

				firstMarker.addListener('mouseout', () => {
					firstMarkerInfoWindow.close();
				});
				*/

				firstMarker.addListener('click', () => {
					if (firstMarkerInfoWindow.get('closed')) {
						if (previous_Window) {
                            previous_Window.set('closed', true);
							previous_Window.close();
						}
						firstMarkerInfoWindow.open({
							anchor: firstMarker,
							map: window.map,
						});
						firstMarkerInfoWindow.set('closed', false);
						previous_Window = firstMarkerInfoWindow;
					}
					else
					{
						firstMarkerInfoWindow.close();
						firstMarkerInfoWindow.set('closed', true);
            			previous_Window = null;
					}
				});

            	google.maps.event.addListener(firstMarkerInfoWindow,'closeclick',function(){
            			firstMarkerInfoWindow.set('closed', true);
            			previous_Window = null;
				});


				//Open marker on page load
				/*
					firstMarkerInfoWindow.open({
					anchor: firstMarker,
					window.map,
					});
					previous_Window = firstMarkerInfoWindow;
				*/

				bounds.extend(firstMarker.getPosition());
				all_markers.push(firstMarker);
				//////END FIRST ICON//////

				//Get all turtle positions
				var positions = [{lat: parseFloat(window.animalPositions[0].lat), lng: parseFloat(window.animalPositions[0].lng)}];

				var icon = {
					path: google.maps.SymbolPath.CIRCLE,
					fillOpacity: 0.9,
					fillColor: "#0000FF",
					strokeOpacity: 1.0,
					strokeColor: "#FFF",
					strokeWeight: 1.0,
					scale: 10 //pixels
				};

				var boundsCount = 1;

				//Loop over all turtle positions (except the first one)
				for(var i = 1; i < window.animalPositions.length; i++)
				{
					//console.log(window.animalPositions[i]);
					//Check if position needs to be drawn
					var drawPosition = false;
					if (i < 20)
					{
						drawPosition = true;
					}
					else if (i % 2 == 0)
					{
						drawPosition = true;
					}

					if (drawPosition == true)
					{
						//console.log("DRAW");
						const marker = new google.maps.Marker({
							position: { lat: parseFloat(window.animalPositions[i].lat), lng: parseFloat(window.animalPositions[i].lng)},
							dt_move: window.animalPositions[i].dt_move,
							icon: icon,
							map: window.map,
							zIndex: 1000 - i,
							optimized: false,
						});

						//Add last 15 positions to map bounds
						if (i < window.animalPositions.length && boundsCount < 20)
						{
							bounds.extend(marker.getPosition());
							boundsCount += 1;
						}

						const contentTurtlePoint =
						"<div><table class='turtle_table'>" +
						"<tr><td class='table_turtleName'><b>" + window.animal.name + "</b></td>" +
						"<tr><td ><div style='text-align: center;white-space: nowrap;'><img class='icon' src='<?php echo $turtleLastKnownLocationIcon; ?>' /> " + window.animalPositions[i].dt_move + "</div></td></tr>" +
						"</table></div>";

						const infowindow = new google.maps.InfoWindow({
							content: contentTurtlePoint,
							ariaLabel: "TurtlePoint",
            				closed: true
						});

						marker.addListener('click', () => {
							if (infowindow.get('closed')) {
								if (previous_Window) {
                        			previous_Window.set('closed', true);
									previous_Window.close();
								}
								infowindow.open({
									anchor: marker,
									map: window.map,
								});
								infowindow.set('closed', false);
								previous_Window = infowindow;
							}
							else
							{
								infowindow.close();
								infowindow.set('closed', true);
								previous_Window = null;
							}
						});

            			google.maps.event.addListener(infowindow,'closeclick',function(){
                        		infowindow.set('closed', true);
            					previous_Window = null;
						});

						/*
                        marker.addListener('closeclick', () => {
							infowindow.set('closed', true);
            				console.log('clicked close cross button');
            				previous_Window = null;
						});
						*/

						positions.push(marker.getPosition());
						all_markers.push(marker);
					}
				}

				//Reverse the all_markers array so that the first marker is also the first one in the array
				all_markers.reverse()

				// Create the polyline, passing the symbol in the "icons" property.
				// Give the line an opacity of 0.
				// Repeat the symbol at intervals of 20 pixels to create the dashed effect.
				const line = new google.maps.Polyline({
					path: positions,
					strokeColor: "#FFFF00",
					strokeOpacity: 1.0,
					strokeWeight: 2.5,
					geodesic: true,
					map: window.map,
				});
				marker_line = line;

				map.setZoom(0);

				google.maps.event.addListenerOnce(window.map, "idle", function() {
					window.map.fitBounds(bounds);
				});
			}

			// Sets the map on all markers in the array.
			function removeAllMarkersAndLines()
			{
				for (var i = 0; i < all_markers.length; i++)
				{
					all_markers[i].setMap(null);
				}
				if (marker_line != null)
				{
					marker_line.setMap(null);
					marker_line = null;
				}
				all_markers = [];
			}

			function addDaysToDateManual(dateStr, count) {
				console.log("dateStr: " + dateStr);
				console.log("count: " + count);

				var parts = dateStr.split('-');
				var year = parseInt(parts[0], 10);
				var month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript
				var day = parseInt(parts[2], 10);

				// Create a date object
				var date = new Date(year, month, day);

				// Convert to milliseconds and add the required number of days in milliseconds
				var newDateInMs = date.getTime() + (count * 24 * 60 * 60 * 1000);

				// Convert back to a date object
				var newDate = new Date(newDateInMs);

				// Format and return the new date
				var formattedYear = newDate.getFullYear().toString();
				var formattedMonth = (newDate.getMonth() + 1).toString().padStart(2, '0'); // Convert back to 1-indexed and pad with zero if needed
				var formattedDay = newDate.getDate().toString().padStart(2, '0');

				var result = `${formattedYear}-${formattedMonth}-${formattedDay}`;
				console.log("new_date: " + result);
				return result;
			}
			

			function formatDate(dateString) 
			{
				var date = new Date(dateString);
				if (isNaN(date.getTime())) 
				{
					// The input is not a valid date
					return null;
				} 
				else 
				{
					var year = date.getFullYear();
					var month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-indexed, add 1
					var day = ('0' + date.getDate()).slice(-2);
					return year + '-' + month + '-' + day;
				}
			}

			// Function to add a marker and an InfoWindow at the clicked location
			function addClickableMarker(location, map) 
			{
				if (new_marker_in_edit != null)
				{
					return;
				}
				
				// Create a new marker
				new_marker_in_edit = new google.maps.Marker({
					position: location,
					map: map
				});

				// Create custom content for the InfoWindow
				var contentString = '<div id="infoWindowContent" class="infoWindowContent" style="text-align: center;">' +
                        '<div style="margin-bottom: 10px;">' +
                        '   <div style="float: left; width: 50%;">Lat: <span id="infoLat" class="infoLat">' + location.lat().toFixed(6) + '</span></div>' +
                        '   <div style="float: right; width: 50%;">Lng: <span id="infoLng" class="infoLng">' + location.lng().toFixed(6) + '</span></div>' +
                        '</div>' +
                        '<div style="clear: both;"></div>' +
                        '<input type="date" id="datepicker" class="datepicker" style="width: 100%; margin-bottom: 10px;" />' +
                        '<div style="margin-top: 10px;">' +
                        '   <button id="saveButton" class="saveButton" style="float: left; width: 50%;">Save</button>' +
                        '   <button id="deleteButton" class="deleteButton" style="float: right; width: 50%;">Delete</button>' +
                        '</div>' +
                        '</div>';

				// Create an InfoWindow
				new_info_window_in_edit = new google.maps.InfoWindow({
					content: contentString
				});

				// Open the InfoWindow when the marker is clicked
				new_marker_in_edit.addListener('click', function() 
				{
					new_info_window_in_edit.open(map, new_marker_in_edit);
					google.maps.event.addListener(new_info_window_in_edit, 'domready', function() 
					{
						addInfoWindowButtonListeners(new_info_window_in_edit, new_marker_in_edit, map);
						
						if (new_marker_in_edit.dt_move)
						{
							document.querySelector('.datepicker').value = newDate;
						}
						// Set the datepicker to one day after the last dt_move
						if (all_markers.length > 0) 
						{
							var lastMarkerDtMove = all_markers[all_markers.length - 1].dt_move; // Adjust based on how dt_move is stored
							console.log("lastMarkerDtMove: " + lastMarkerDtMove);
							var interval_setting = jQuery("#location_days_interval_ctrl").val();
							console.log("interval_setting: " + interval_setting);
							var newDate = addDaysToDateManual(lastMarkerDtMove, interval_setting);
							console.log("newDate: " + newDate);
							document.querySelector('.datepicker').value = newDate;
						}
					});
				});

				// Function to add event listeners to the buttons in the InfoWindow
				function addInfoWindowButtonListeners(infowindow, marker, map) 
				{
					
						//setTimeout(function() 
						//{
							var saveButton = document.querySelector('.saveButton');
    						var deleteButton = document.querySelector('.deleteButton');
							
							if (saveButton) 
							{
								saveButton.addEventListener('click', function() 
								{
									connectMarkers(marker, map);
									marker.dt_move = document.getElementById('datepicker').value;
									all_markers.push(marker);
									new_markers.push(marker);
									
									new_info_window_in_edit.close();
									new_marker_in_edit = null;
									new_info_window_in_edit = null;

									if (new_markers.length > 0)
									{
										jQuery(".save_changes_btn").prop( "disabled", false );
									}
									else
									{
										jQuery(".save_changes_btn").prop( "disabled", true );
									}

								});
							} 
							else 
							{
								console.error('Save button not found');
							}

							if (deleteButton) 
							{
								deleteButton.addEventListener('click', function() 
								{
									// Remove the marker from the map
									new_marker_in_edit = null;
									new_info_window_in_edit = null;
									marker.setMap(null);

									if (new_markers.length > 0)
									{
										jQuery(".save_changes_btn").prop( "disabled", false );
									}
									else
									{
										jQuery(".save_changes_btn").prop( "disabled", true );
									}
								});
							} 
							else 
							{
								console.error('Delete button not found');
							}
						//}, 500); // Delay of 100 ms
				}

				// Function to remove a marker from an array
				function removeFromArray(marker, array) 
				{
					var index = array.indexOf(marker);
					if (index > -1) 
					{
						array.splice(index, 1);
					}
				}
			}

			// Function to connect the new marker with the last existing marker
			function connectMarkers(newMarker, map) {
				// Assuming 'all_markers' is the array holding all existing markers
				if (all_markers.length > 0) {
					var lastMarker = all_markers[all_markers.length - 1];
					var linePath = [lastMarker.getPosition(), newMarker.getPosition()];

					var line = new google.maps.Polyline({
						path: linePath,
						geodesic: true,
						strokeColor: '#FF0000',
						strokeOpacity: 1.0,
						strokeWeight: 2,
					});

					line.setMap(map);
					// Optionally, you can store this line if you need to manipulate it later
				} else {
					console.log("No existing markers to connect to.");
				}
			}
			
			//Initialize map
			window.initMap = initMap;
		</script>
	</head>
	<body>
		<div id="notificationContainer">
		</div>
		<div class="resp-iframe" id="map"></div>
	</body>
</html>