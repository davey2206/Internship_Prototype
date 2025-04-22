<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 5) . '/wp-load.php');

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_user);

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

?>
<html>
<head>
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <style>
        body
        {
            overflow-y: hidden;
        }
        .center
        {
            margin: auto;
            width: 50%;
        }
        .container
        {
            width: 100%;
            height: 100%;
        }
        .window
        {
            margin: auto;
            margin-top: auto;
            /*width: 95%;*/
            margin-top: 15px;
            border: 1px solid #000;
            text-align: center;
            font-size: 1.2vw;
            /*position: relative;*/
            /*height: 95%;*/
        }
        .iframe_page 
        {
            width:100%;
            height:87%
        }
        .header
        {
            font-size: 2vw;
            font-weight: bold;
            text-align: center;
            border-bottom: 1px solid #000;
        }

        /* Style the tab */
        .tab {
          overflow: hidden;
          border: 1px solid #ccc;
          background-color: #f1f1f1;
        }

        /* Style the buttons that are used to open the tab content */
        .tabButton {
          background-color: inherit;
          float: left;
          border: none;
          outline: none;
          cursor: pointer;
          padding: 7px 8px;
          transition: 0.3s;
        }

        /* Change background color of buttons on hover */
        .tab button:hover {
          background-color: #ddd;
        }

        /* Create an active/current tablink class */
        .tab button.active {
          background-color: #ccc;
        }

        /* Style the tab content */
        .tabcontent {
          display: none;
          padding: 6px 12px;
          border: 1px solid #ccc;
          border-top: none;
        } 

        /* Styles for the table */
        .styled-table {
            border-collapse: collapse;
            margin: 25px 0;
            font-size: 0.9em;
            font-family: sans-serif;
            /*min-width: 400px;*/
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
            margin: auto;
            width: 100%;
        }

        .styled-table thead tr {
            background-color: #009879;
            color: #ffffff;
            text-align: left;
        }

        .styled-table th,
        .styled-table td {
            padding: 5px 7px;
        }

        .styled-table tbody tr {
            border-bottom: 1px solid #dddddd;
        }

        .styled-table tbody tr:nth-of-type(even) {
            background-color: #f3f3f3;
        }

        .styled-table tbody tr:last-of-type {
            border-bottom: 2px solid #009879;
        }

        .styled-table tbody tr.active-row {
            font-weight: bold;
            color: #009879;
        }
        /* -------------------------------------*/

        @media only screen and (max-width: 768px)
        {
            .login-window
            {
                width: 80%;
                font-size: 2.4vw;
            }
            .header
            {
                font-size: 4vw;
            }
        }
    </style>
    <script>
        function openTab(evt, tabName) 
        {
            // Declare all variables
            var i, tabcontent, tablinks;

            // Get all elements with class="tabcontent" and hide them
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) 
            {
                tabcontent[i].style.display = "none";
            }

            // Get all elements with class="tablinks" and remove the class "active"
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) 
            {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }

            // Show the current tab, and add an "active" class to the button that opened the tab
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
        } 

        function openPreviewInNewTab()
        {
            window.open("<?php echo $settings->_kukudushi_custom_dir_url; ?>/admin/animal_tracker_full_viewer.php", '_blank').focus();
        }
        

        document.addEventListener("DOMContentLoaded", function()
        {
            document.getElementById("defaultOpen").click();
        });
    </script>
</head>
<body>
    <div class="container">    
        <div class="window">
            <div class="header">
                Administrator Portal
            </div>
            <!-- Tab links -->
            <div class="tab">
                <button class="tablinks tabButton" id="defaultOpen" onclick="openTab(event, 'Import')">Import Excel</button>
                <button class="tablinks tabButton" onclick="openPreviewInNewTab()">Preview Animals</button>
                <button class="tablinks tabButton" onclick="openTab(event, 'Manage_animals')">Manage Animals</button>
                <button class="tablinks tabButton" onclick="openTab(event, 'Decativate_animal')">Deactivate Animal</button>
                <button class="tablinks tabButton" onclick="openTab(event, 'Scan_cistory')">Show scan history</button>
            </div>

            <!-- Import Excel -->
            <div id="Import" class="tabcontent">
                <iframe src="import_excel_file.php" class="iframe_page"></iframe>
            </div>

            <!-- MANAGE animals -->
            <div id="Manage_animals" class="tabcontent">
                <iframe src="animal_manager_UI.php" class="iframe_page"></iframe>
            </div>

            <!-- Replace animal -->
            <div id="Decativate_animal" class="tabcontent">
                <iframe src="deactivate_production_animal.php" class="iframe_page"></iframe>
            </div>

            <!-- SHOW scan history -->
            <div id="Scan_cistory" class="tabcontent">
                <iframe src="scan_history.php" class="iframe_page"></iframe>
            </div>

        </div>
    </div>
</body>
</html>