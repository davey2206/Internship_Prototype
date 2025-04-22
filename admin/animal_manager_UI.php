<?php

require_once(dirname(__FILE__, 5) . '/wp-load.php');

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_animal);

$settings = Settings_Manager::Instance();

$user_manager = User_Manager::Instance();
$animal_manager = Animal_Manager::Instance();

// Check if admin
if (!current_user_can('administrator')) 
{

	echo '<script>alert("Please login as an administrator!")</script>';
	sleep(2);
	echo '<script type="text/javascript">window.location.href="' . $settings->_kukudushi_base_url . '";</script>';
	exit;
}


?>
<html>
	<head>
		<script src="https://code.jquery.com/jquery-3.7.0.js"></script>
		<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.2/moment.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
		<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

		<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" />
		<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
		<style>
			.dataTables_wrapper {
				min-height: 75%;
			}
			.table_animal_image {
				margin: auto;
  				display: block;
			}

			.form-group {
				display: flex;
				flex-direction: column;
			}

			.center-and-border {
				border: 1px solid #ced4da;
  				text-align: center;
			}

			.active-checkbox {
				margin: 5px 0px 15px 0px;
			}

			.center-label {
				text-align: center;
			}

			.save-button {
				display: flex;
				justify-content: center;
				align-items: center;
				margin-top: 30px;
			}

			.center-button button {
				width: 25%;
			}

			#uploadFileLabel {
				position: relative;
				cursor: pointer;
				display: inline-block;
				margin-top: 10px;
			}

			#uploadFileLabel::after {
				content: 'Click to Change Image';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				color: white;
				background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
				padding: 10px;
				border-radius: 5px;
				display: none; /* Hidden by default */
				text-align: center;
			}

			#uploadFileLabel:hover::after {
				display: block; /* Show text on hover */
			}

			#uploadFileLabel img#animal-image {
				width: auto;
				height: auto;
				display: block;
				margin: auto;
			}

			#uploadFileLabel img#thumbnail-image {
				position: absolute;
				top: 10px;
				left: 10px;
				width: 20%;
				border: 1px solid #fff;
				box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
			}

			#uploadFileLabel span#checkmark {
				position: absolute;
				bottom: 10px;
				right: 10px;
				color: green;
				font-size: 48px;
				display: none;
			}

			.img-thumbnail {
				width: 100%; /* Adjust width as necessary */
				height: auto; /* Maintain aspect ratio */
			}

			.loading-spinner-centered-modal
			{

				display: none; /* Hidden by default */
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				justify-content: center;
 				align-items: center;
				background: rgba(255, 255, 255, 0.8); /* Semi-transparent white background */
				z-index: 999; /* Ensure it covers the content */
			}
			
			.loading-spinner-centered-modal::after {
				content: "";
				display: block;
				width: 50px;
				height: 50px;
				margin: 20% auto;
				border: 5px solid #ddd; /* Light grey border */
				border-top: 5px solid #3498db; /* Blue border top */
				border-radius: 50%;
				animation: spin 1s linear infinite;
			}

			.loading-spinner-centered
			{

				display: none; /* Hidden by default */
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				justify-content: center;
 				align-items: center;
				background: rgba(255, 255, 255, 0.8); /* Semi-transparent white background */
				z-index: 999; /* Ensure it covers the content */
			}
			
			.loading-spinner-centered::after {
				content: "";
				display: block;
				width: 50px;
				height: 50px;
				margin: 20% auto;
				border: 5px solid #ddd; /* Light grey border */
				border-top: 5px solid #3498db; /* Blue border top */
				border-radius: 50%;
				animation: spin 1s linear infinite;
			}
			
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}

			#manage_animal_Modal {
				overflow: auto !important;
			}

			#confirmationModal {
				background: #000C;
			}

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
		

		<script>
			var table = null;
			var thumbnailImageSet = false;

			jQuery(document).ready(function() 
			{
				//Upload field changed event
				var uploadField = jQuery("#animal_image_upload");
				var uploadImage = jQuery("#animal-image");
				var thumbnailImage = jQuery("#thumbnail-image");
				var checkmark = jQuery("#checkmark");

				if (uploadField.length) 
				{
					uploadField.on("change", function() 
					{
						if (this.files && this.files[0]) 
						{
							var reader = new FileReader();
							reader.onload = function(e) 
							{
								if (!thumbnailImageSet) 
								{
									var currentSrc = uploadImage.attr('src');
									thumbnailImage.attr('src', currentSrc);
									thumbnailImage.show();
									thumbnailImageSet = true;
								}

								uploadImage.attr('src', e.target.result);
								checkmark.show();
							};
							reader.readAsDataURL(this.files[0]); // Read the file as a Data URL
						}
					});
				}

				//Slider life-stage value changed event
				jQuery('#life-stage').on('input', function() 
				{
					const life_stages = ["Newborn", "Juvenile", "Adolescent", "Adult"];

					var currentValue = jQuery(this).val();
					jQuery('#life_stage_name').text(life_stages[currentValue - 1]);
				});

				// Handle the restart track checkbox toggle
                jQuery('#is_active').change(function() 
                {
                    if (this.checked) 
                    {
                        jQuery('#restart-track-container').show();
                    } 
                    else 
                    {
                        jQuery('#restart-track-container').hide();
                    }
                });

				// Handle the restart track checkbox toggle
                jQuery('#cbx_restart_track').change(function() 
                {
                    if (this.checked) 
                    {
						jQuery('#confirmationModal').modal('show');
						jQuery('#cbx_restart_track').prop('checked', false);
                        jQuery('#restart-track-information-container').show();
                    } 
                    else 
                    {
                        jQuery('#restart-track-information-container').hide();
                    }
                });

				// Button event for confirming the checkbox uncheck
				jQuery('#confirmButton').click(function() 
				{
					jQuery('#confirmationModal').modal('hide');
					jQuery('#cbx_restart_track').prop('checked', true);
				});
				// Button event for denying the checkbox uncheck
				jQuery('#denyButton').click(function() 
				{
					jQuery('#confirmationModal').modal('hide');
					jQuery('#cbx_restart_track').prop('checked', false);
					jQuery('#restart-track-information-container').hide();
				});

				function resetModal() 
				{
					var uploadImage = jQuery("#animal-image");
					var thumbnailImage = jQuery("#thumbnail-image");
					var checkmark = jQuery("#checkmark");
					
					// Reset images to default or hide them
					uploadImage.attr('src', ''); // Provide a default or placeholder image path
					thumbnailImage.hide();
					thumbnailImage.attr('src', ''); // Clear the thumbnail image source
					checkmark.hide();
					thumbnailImageSet = false; // Reset this flag so thumbnail can be set again when modal is reused
				}


				table = jQuery('#table_animals').DataTable({
					'processing': true,
					'serverSide': true,
					'serverMethod': 'post',
					'ajax': { 
						'url': '/kukudushi_custom/admin/form_handles/get_all_animal_information.php', 
					},
					'pageLength': 25,
					'lengthMenu': [ 10, 25, 50, 75, 100 ],
					'scrollY': '70vh',
					'scrollCollapse': true,
					'columns' : [
						{data: 'id'}, 
						{data: 'ext_id'}, 
						{data: 'name'}, 
						{data: 'imageurl',
							render: (data,type,row) => 
							{
								if (window.newImageUrl == data) 
								{
									return `<img name="table_animal_image" class="table_animal_image" id="table_animal_image" style="height:100px;" src="${data}?timestamp=${new Date().getTime()}" />`;
									window.newImageUrl = null;
									console.log("found");
								}
								else
								{
									return `<img name="table_animal_image" class="table_animal_image" id="table_animal_image" style="height:100px;" src="${data}" />`;
								}
								
							}
						}, 
						{data: 'species'}, 
						{data: 'description'}, 
						{data: 'is_active',
							render: (data, type, row) =>
								type === 'display' ? '<input type="checkbox" class="animal_active" disabled>' : data,
								className: 'dt-body-center'}, 
						{data: 'last_refresh'}, 
						{data: null,
							render: (data,type,row) => 
							{
								return `<input type="button" name="manage" value="Manage" id="${row.id}" class="btn btn-info btn-xs manage_animal" />`;
							}
						}
					],
					'order': [[6, 'desc']],
					rowCallback: function (row, data) 
					{
						/*
						if (window.newImageUrl && window.imageUrl) 
						{
							var found = false;
							if (data.imageurl == window.imageUrl)
							{
								data.imageurl = window.newImageUrl;
								found = true;
							}
							
							if (found)
							{
								jQuery('img[src*="' + window.imageUrl + '"]').each(function() 
								{
									jQuery(this).attr('src', window.newImageUrl);
									found = true;
								});

								window.newImageUrl = null;
								window.imageUrl = null;
							}
						}
						*/

						// Set the checked state of the checkbox in the table
						row.querySelector('input.animal_active').checked = data.is_active == 1;
					},

				});

				jQuery(document).on('click', '.manage_animal', function() 
				{  
					jQuery("#loadingSpinner").show();

					var animal_id = jQuery(this).attr("id");  
					jQuery.ajax({  
						url:"/kukudushi_custom/admin/form_handles/get_animal_information.php",  
						method:"POST",  
						data:{animal_id:animal_id},  
						dataType:"json",  
						success:function(data) 
						{  
							var active = data.is_active == 1;
							jQuery('#name').val(data.name);
							
							resetModal();
							jQuery('#animal-image').attr('src', data.imageurl + "?timestamp=" + new Date().getTime()); //Make sure to always get the newest image from server

							jQuery('#species').empty(); // Clear previous options
							data.all_species.forEach(function(species) 
							{
								var selected = (data.species == species.id) ? ' selected' : '';
								jQuery('#species').append(`<option value="${species.id}"${selected}>${species.name}</option>`);
							});
							jQuery('#species').select2(); // Initialize select2
							jQuery('#gender').val(data.gender);
							jQuery('#weight').val(data.weight);
							jQuery('#length').val(data.length);
							jQuery('#life-stage').val(data.life_stage);
							jQuery('#description').val(data.description);
							jQuery('#is_active').prop("checked", active);
							jQuery('#animal_id').val(data.id);
							jQuery('#insert').val("Update");

							jQuery('#life-stage').trigger('input');
							jQuery('#is_active').trigger('input');

							jQuery('#manage_animal_Modal').modal('show');

							jQuery("#loadingSpinner").hide();
						},
						error: function (xhr, ajaxOptions, thrownError) 
						{
							jQuery("#loadingSpinner").hide();
						}
					});  
				});  

				jQuery('#manage_form').on("submit", function(event)
				{  
					event.preventDefault();  
					if(jQuery('#name').val() == "")  
					{  
							alert("Name cannot be empty!");  
					}  
					else if(jQuery('#species').val() == '')  
					{  
							alert("Species cannot be empty!");  
					}  
					else if(jQuery('#description').val() == '')  
					{  
							alert("Description cannot be empty!");  
					}  
					else  
					{  
						jQuery("#loadingSpinner-modal").show();

						var formData = new FormData();  // Create a FormData object directly from the form element
						formData.append("animal_id", jQuery('#animal_id').val());
						formData.append("name", jQuery('#name').val());
						formData.append("species", jQuery('#species').val());
						formData.append("gender", jQuery('#gender').val());
						formData.append("weight", jQuery('#weight').val());
						formData.append("length", jQuery('#length').val());
						formData.append("life_stage", jQuery('#life-stage').val());
						formData.append("description", jQuery('#description').val());
						formData.append("is_active", jQuery('#is_active').is(':checked'));
						formData.append("restart_track", jQuery('#cbx_restart_track').is(':checked'));
						formData.append("start_steps", jQuery('#start_steps').val());
						formData.append("steps_interval", jQuery('#steps_interval').val());

						// Append file data from file input if needed
						let file_upload_control = jQuery('#animal_image_upload');
						if (file_upload_control.length && file_upload_control.prop("files").length)
						{
							var file_data = file_upload_control.prop("files")[0];
							formData.append("animal_image_upload", file_data);
						}

						jQuery.ajax({  
							url: "/kukudushi_custom/admin/form_handles/save_animal_information.php",  
							method: "POST",  
							data: formData,  
							dataType: "json",
							processData: false,
							contentType: false,
							beforeSend: function()
							{  
								jQuery('#insert').val("Inserting");  
							},  
							success: function(data)
							{  
								if (data.code == "200")
                            	{
									jQuery(".display-error").html("<ul style=\'padding: 15px;margin:auto;\'>Success: <br />" + data.message + "</ul>");
									jQuery(".display-error").css("display", "block");
									jQuery(".display-error").css("background-color", "green");
									jQuery(".display-error").css("color", "white");
									jQuery(".display-error").css("opacity", 1);
								}
								else
								{
									jQuery(".display-error").html("<ul style=\'padding: 15px;margin:auto;\'>" + data.message + "</ul>");
									jQuery(".display-error").css("display", "block");
									jQuery(".display-error").css("background-color", "red");
									jQuery(".display-error").css("color", "black");
									jQuery(".display-error").css("opacity", 1);
								}

								message_fade_time = 5000;
								jQuery(".display-error").delay(2500).fadeOut(message_fade_time, function()
								{
									// Animation complete.
									//jQuery(".display-error").css("opacity", 0);
								});

								jQuery('#manage_form')[0].reset();  
								jQuery('#manage_animal_Modal').modal('hide');  
								table.draw(false);
								jQuery("#loadingSpinner-modal").hide();

								jQuery('#insert').val("Save Animal!");  

								//reset modal animal image
								//jQuery("#animal-image").attr('src', "");

								if (data.new_image_url.length)
								{
									//window.imageUrl = data.new_image_url;
        							window.newImageUrl = data.new_image_url;
								}
							},
							error: function (xhr, ajaxOptions, thrownError) 
							{
								jQuery("#loadingSpinner-modal").hide();

								jQuery('#insert').val("Save Animal!");  
							}
						});  
					}  
				}); 

			});

		</script>
	</head>
	<body>
		<table id="table_animals" class="display dataTable" style="width:90%">
			<thead>
				<th>id</th>
				<th>ext_id</th>
				<th>name</th>
				<th>image</th>
				<th>species</th>
				<th>description</th>
				<th>is_active</th>
				<th>last_refresh</th>
				<th>save</th>
			</thead>
			<tfoot>
				<th>id</th>
				<th>ext_id</th>
				<th>name</th>
				<th>image</th>
				<th>species</th>
				<th>description</th>
				<th>is_active</th>
				<th>last_refresh</th>
				<th>save</th>
		</tfoot>
		</table>
		<div id="manage_animal_Modal" class="modal fade">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h4 class="modal-title">Manage Animal Information</h4>
						<button type="button" class="close" data-dismiss="modal">&times;</button>
					</div>
					<div class="modal-body">
						<form method="post" id="manage_form">
							<div class="form-group">
								<label for="name">Name:</label>
								<input type="text" name="name" id="name" class="form-control">
							</div>

							<div class="form-group">
								<label>Image:</label>
								<input type="file" name="animal_image_upload" id="animal_image_upload" class="form-control-file" accept="image/*,video/*" style="display:none;">
								<label for="animal_image_upload" id="uploadFileLabel">
									<img id="animal-image" src="" alt="Animal Image" class="img-thumbnail">
									<img id="thumbnail-image" src="" alt="Thumbnail" style="display: none;"> <!-- Hidden by default -->
    								<span id="checkmark" class="material-icons">check_circle</span> <!-- Using Material Icons for the checkmark -->
								</label>
							</div>

							<div class="form-group">
								<label for="species">Species:</label>
								<select name="species" id="species" class="form-control"></select>
							</div>

							<div class="form-group">
								<label for="gender">Gender:</label>
								<select name="gender" id="gender" class="form-control">
									<option value="Empty">Please select a gender.</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
								</select>
							</div>

							<div class="form-group">
								<label for="weight">Weight: (examples: "100 kg", "100 gr", "39 mt")</label>
								<input type="text" name="weight" id="weight" class="form-control"></input>
							</div>

							<div class="form-group">
								<label for="length">Length: (examples: "20 m", "20 cm", "20 mm")</label>
								<input type="text" name="length" id="length" class="form-control" ></input>
							</div>

							<div class="form-group">
								<label for="life-stage">Life Stage:</label>
								<input type="range" min="1" max="4" name="life-stage" id="life-stage" class="form-control" ></input>
								<div id="life_stage_name" class="life_stage_name center-label">Jeuvenile</div>
							</div>

							<div class="form-group">
								<label for="description">Description:</label>
								<textarea name="description" id="description" class="form-control" rows="6" data-lpignore="true"></textarea>
							</div>

							<div class="form-group">
								<label>Active:</label>
								<div class="center-and-border">
									<label for="is_active" class="center-label">Add to Manager</label>
									<br />
									<input class="active-checkbox" type="checkbox" name="is_active" id="is_active">
								</div>
							</div>

							<div id="restart-track-container" class="form-group" style="display:none;">
								<label for="cbx_restart_track" class="center-label">Restart track</label>
								<input type="checkbox" id="cbx_restart_track" name="cbx_restart_track">
							</div>
							<div id="restart-track-information-container" style="display:none;">
								<div class="form-group">
									<label for="start_steps">Starting locations:</label>
									<input type="number" id="start_steps" name="start_steps" class="form-control" min="1" value="5">
								</div>
								<div class="form-group">
									<label for="steps_interval"># days between locations:</label>
									<input type="number" id="steps_interval" name="steps_interval" class="form-control" min="1" value="1">
								</div>
							</div>

							<div class="form-group save-button">
								<input type="hidden" id="animal_id" name="animal_id" value="" />
								<button type="submit" name="insert" id="insert" value="Insert" class="btn btn-success">Save Animal!</button>
							</div>
						</form>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
			<div class="loading-spinner-centered-modal" id="loadingSpinner-modal"></div>
		</div>
		<div class="modal fade" id="confirmationModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
			<div class="modal-dialog" role="document">
				<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="modalLabel">Confirm Action</h5>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body">
					Are you sure you want to restart this animals track? If this animal was already being used (active), customers will notice that the track has suddenly restarted. Are you sure you wish to continue?
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" id="denyButton" data-dismiss="modal">No</button>
					<button type="button" class="btn btn-primary" id="confirmButton">Yes</button>
				</div>
				</div>
			</div>
		</div>
		<div class="loading-spinner-centered" id="loadingSpinner">
		</div>
		<div id="display-error" class="display-error" style="display:none;">
        </div>
	</body>
</html>
