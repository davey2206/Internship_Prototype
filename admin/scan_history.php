<?php

require_once(dirname(__FILE__, 5) . '/wp-load.php');

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);

class Scan_history
{
	public $_settings;
	
	public function __construct() 
	{
		$this->_settings = Settings_Manager::Instance();
    }
}

$user_manager = User_Manager::Instance();
$scanHistory = new Scan_History();

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
		<script src="https://cdn.datatables.net/datetime/1.5.1/js/dataTables.dateTime.min.js"></script>
		<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
		<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/datetime/1.5.1/css/dataTables.dateTime.min.css">
		<script>
			var table = null;

			jQuery(document).ready(function() 
			{

				// Create date inputs
				minDate = new DateTime('#date_from', {
					label: "From Date:",
					format: 'YYYY-MM-DD'
				});
				maxDate = new DateTime('#date_to', {
					label: "To Date:",
					format: 'YYYY-MM-DD'
				});

				table = jQuery('#table_scans').DataTable({
					'processing': true,
					'serverSide': true,
					'serverMethod': 'post',
					'ajax': { 
						'url': '/kukudushi_custom/admin/form_handles/get_scan_history.php', 
						"data": function ( d ) {
							return jQuery.extend( {}, d, {
							"date_from": jQuery("#date_from").val().toLowerCase(),
							"date_to": jQuery("#date_to").val().toLowerCase()
							} );
						},
					},
					'order': [[0, 'desc']],
					'pageLength': 25,
					'lengthMenu': [ 10, 25, 50, 75, 100 ],
					'scrollY': '70vh',
					'scrollCollapse': true,
					'columns' : [
						{data: 'id'}, 
						{data: 'valid',
						render: (data, type, row) =>
							type === 'display' ? '<input type="checkbox" class="scan_valid" disabled>' : data,
							className: 'dt-body-center'}, 
						{data: 'datetime'}, 
						{data: 'ip'}, 
						{data: 'kukudushi_id'}, 
						{data: 'browser'}, 
						{data: 'guid'}, 
						{data: 'metadata_id'}, 
						{data: 'window_functionality'}, 
						{data: 'username'}
					],
					rowCallback: function (row, data) {
						// Set the checked state of the checkbox in the table
						row.querySelector('input.scan_valid').checked = data.valid == 1;
    				},

				});

				// Redraw the table based on the custom input
				jQuery('#date_from, #date_to').bind("keyup change", function(){
					table.draw();
				});

				jQuery("#table_scans").on("click", "td", function() {
					//alert(jQuery(this).text());
					table.search(jQuery(this).text()).draw();
				});
			});

		</script>
	</head>
	<body>
		<div style="float:right;align-items:end;display:flex;flex-direction:column;">
			<label>From Date:
				<input type="text" id="date_from" name="date_from" style="margin-bottom:5px;"/>
			</label>
			<br>
			<label> Till Date: 
				<input type="text" id="date_to" name="date_to" />
			</label>
		</div>
		<table id="table_scans" class="display dataTable" style="width:100%;">
			<thead>
				<tr>
					<th>Scan Id</th>
					<th>Valid Uid</th>
					<th>Date & Time</th>
					<th>Ip</th>
					<th>Uid</th>
					<th>Browser</th>
					<th>User GUID</th>
					<th>metadata ID</th>
					<th>Functionality</th>
					<th>User WP</th>
				</tr>
			</thead>
			<tfoot>
				<tr>
					<th>Scan Id</th>
					<th>Valid Uid</th>
					<th>Date & Time</th>
					<th>Ip</th>
					<th>Uid</th>
					<th>Browser</th>
					<th>User GUID</th>
					<th>metadata ID</th>
					<th>Functionality</th>
					<th>User WP</th>
				</tr>
			</tfoot>
		</table>
	</body>
</html>