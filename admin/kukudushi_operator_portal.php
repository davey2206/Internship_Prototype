<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
session_start();

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

$portal = new OperatorPortal();

if (!isset($_SESSION['operator_logged_in']) || $_SESSION['operator_logged_in'] != true)
{
    if (isset($_GET['id']))
    {
        echo '<script type="text/javascript">window.location.href="' . $portal->_settings->_kukudushi_base_url . '/kukudushi_custom/admin/kukudushi_operator_login.php?id=' . $_GET['id'] . '";</script>';
    }
    else
    {
        echo '<script type="text/javascript">window.location.href="' . $portal->_settings->_kukudushi_base_url . '";</script>';
    }
}

if (isset($_POST["logout"]))
{
    $_SESSION['operator_logged_in'] = Null;
    session_destroy(); //destroy the session
    echo '<script type="text/javascript">window.location.href="' . $portal->_settings->_kukudushi_base_url . '/kukudushi_custom/admin/kukudushi_operator_login.php?id=' . $portal->_portal_id . '";</script>';
}
else if (isset($_POST["addMessage"]))
{
    $portal->addMessage($_POST);
}
else if (isset($_POST["editMessage"]))
{
    $portal->editMessage($_POST);
}
else if (isset($_POST["deleteMessage"]))
{
    $portal->deleteMessage($_POST);
}



class OperatorPortal
{
    public $_kukudushiImage = "https://kukudushi.com/wp-content/uploads/2021/06/logo-kukudushi-transparant-tbv-website.jpg";
    public $_settings;
    public $_sys_message;
    public $_portal_id;
    public $_operator_id;
    public $_operator_name;
    public $_title;
    public $_messages;


    function __construct()
    {
        $this->_settings = Settings_Manager::Instance();
        if (isset($_GET['id']))
        {
            $this->getOperatorDetails($_GET['id']);
        }
        else
        {
            echo '<script type="text/javascript">window.location.href="' . $this->_settings->_kukudushi_base_url . '";</script>';
        }
    }

    function getOperatorDetails($portal_id)
    {
        //get wordpress database
        global $wpdb;

        $result = DataBase::select("SELECT * FROM wp_kukudushi_ext_operators WHERE portal_code = '". $portal_id ."';");

        if ($wpdb->num_rows > 0)
        {
            $this->_portal_id = $portal_id;
            $this->_operator_id = $result[0]->id;
            $this->_operator_name = $result[0]->name;
            $this->_title = "Portal - ". $result[0]->name;
            $this->getOperatorMessages();
        }
        else
        {
            echo '<script type="text/javascript">window.location.href="' . $this->_settings->_kukudushi_base_url . '";</script>';
        }
    }

    function getOperatorMessages()
    {
        //get wordpress database
        global $wpdb;

        $result = DataBase::select("SELECT * FROM wp_kukudushi_ext_operators_messages WHERE operator_id = '" . $this->_operator_id . "' ORDER BY target_date DESC;");

        if ($wpdb->num_rows > 0)
        {
            $this->_messages = $result;
        }
        else
        {
            $this->_messages = NULL;
        }
    }

    function getMessageById($id)
    {
        foreach ($this->_messages as $message) {
            if ($message->id == $id) {
                return $message;
            }
        }
        return Null;
    }

    function messageDateAlreadyExists($date)
    {
        foreach ($this->_messages as $message) {
            if ($message->target_date == $date) {
                return true;
            }
        }
         return false;
    }

    function addMessage($post)
    {
        $date_now = date("Y-m-d");

        // HANDLE ERRORS
        if (!isset($post["messageContent"]) || !isset($post["targetDate"]))
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">Both the message and the date should be filled in.</h3>";
            return;
        }
        else if (empty($post["messageContent"]))
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">The message should not be empty.</h3>";
            return;
        }
        else if (strlen($post["messageContent"]) > 128)
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">The message cannot contain more than 128 characters.</h3>";
            return;
        }
        else if ($post["messageDate"] < $date_now)
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">The date cannot lie in the past.</h3>";
            return;
        }
        else if ($this->messageDateAlreadyExists($post["messageDate"]))
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">A message already exists with the selected date. Only one message can be created per date.</h3>";
            return;
        }

        $message = htmlspecialchars($post["messageContent"]);
        $date = $post["messageDate"];

        //get wordpress database
        global $wpdb;

        //Insert link in database
        //$insertMessageSql = "INSERT INTO wp_kukudushi_ext_operators_messages (operator_id , message, target_date, is_executed, created_datetime) VALUES (" . $this->_operator_id . ", '" . $message . "', '" . $date . "', 0, NOW() );";
        //$wpdb->query($insertMessageSql);
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
        $data = array(
            'operator_id' => $this->_operator_id, // Assuming this is an integer
            'message' => $message, // Assuming this is a string
            'target_date' => $date, // Assuming $date is already in 'Y-m-d H:i:s' format
            'is_executed' => 0, // Explicitly setting this as an integer
            'created_datetime' => $dateTimeNow->format('Y-m-d H:i:s') // Correctly formatted current datetime
        );

        // The format array is optional as your insert function auto-detects data types if not provided.
        // However, if you want to explicitly define it:
        $format = array('%d', '%s', '%s', '%d', '%s');

        // Execute the insert operation using DataBase::insert
        $inserted_id = DataBase::insert('wp_kukudushi_ext_operators_messages', $data, $format);


        $this->_sys_message = "<h3 style=\"text-align:center;color:green;\">Message added succesfully!</h3>";
        $this->getOperatorMessages();

    }

    function editMessage($post)
    {
        $new_message = "";
        $new_target_date = "";
        $message_id = $post["messageId"];
		$original_message = $this->getMessageById($message_id);
        $date_now = date("Y-m-d");

        // HANDLE ERRORS
        if (!isset($post["messageContent"]) && !isset($post["targetDate"]))
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">No changes detected.. Please make a change first before trying to save.</h3>";
            return;
        }
        else if (empty($post["messageContent"]))
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">The message should not be empty.</h3>";
            return;
        }
        else if (strlen($post["messageContent"]) > 128)
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">The message cannot contain more than 128 characters.</h3>";
            return;
        }
        else if (!empty($post["targetDate"]) && $post["targetDate"] < $date_now)
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">The date cannot lie in the past.</h3>";
            return;
        }
        else if ($this->messageDateAlreadyExists($post["targetDate"]))
        {
            $this->_sys_message = "<h3 style=\"text-align:center;color:red;\">A message already exists with the selected date. Only one message can be created per date.</h3>";
            return;
        }

        //Check which properties are altered

        if (isset($post["messageContent"]) && !empty($post["messageContent"]))
        {
            $new_message = htmlspecialchars($post["messageContent"]);
        }
        else
        {
            $new_message = $original_message->message;
        }
        if (isset($post["targetDate"]) && !empty($post["targetDate"]))
        {
            $new_target_date = $post["targetDate"];
        }
        else
        {
            $new_target_date = $original_message->target_date;
        }

        //get wordpress database
        global $wpdb;

        //Update message in DB
        $sql = "UPDATE wp_kukudushi_ext_operators_messages SET message = '". $new_message ."', target_date = '" . $new_target_date . "' WHERE id = '" . $message_id . "'";
        $wpdb->query($sql);

        $this->_sys_message = "<h3 style=\"text-align:center;color:green;\">Message edited succesfully!</h3>";
        $this->getOperatorMessages();
    }

    function deleteMessage($post)
    {
        $message_id = $post["messageId"];

        //get wordpress database
        global $wpdb;

        //Insert link in database
        $deleteMessageSql = "DELETE FROM wp_kukudushi_ext_operators_messages WHERE id = ". $message_id ."";
        $wpdb->query($deleteMessageSql);

        $this->_sys_message = "<h3 style=\"text-align:center;color:green;\">Message deleted succesfully!</h3>";
        $this->getOperatorMessages();
    }
}

?>
<html>
<head>
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <style>
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
        .login-window
        {
            margin: auto;
            width: 50%;
            margin-top: 15px;
            border: 1px solid #000;
            text-align: center;
            font-size: 1.2vw;
            
            position: relative;
            top: 50%;
            transform: translateY(-50%);
            -webkit-transform: translateY(-50%);
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

        function changeMessage()
        {
            var messageDiv = document.getElementById("mngMessage");

            if (messageDiv.children.length > 1) {

                messageDiv.children[1].style.display = 'inline';

                messageDiv.removeChild(messageDiv.children[0]);


            }
        }

        function changeTargetDate()
        {
            var targetDateDiv = document.getElementById("mngTargetDate");
            var value = targetDateDiv.children[0].innerText;
            
            let [day, month, year] = value.split('-');
            if (targetDateDiv.children.length > 1)
            {
                targetDateDiv.children[1].valueAsDate = new Date(+year, +month - 1, +day + 1);
                targetDateDiv.children[1].style.display = 'inline';
                targetDateDiv.removeChild(targetDateDiv.children[0]);
            }
        }

        document.addEventListener("DOMContentLoaded", function()
        {
            document.getElementById("defaultOpen").click();
            document.getElementById("messageDate").valueAsDate = new Date();
        });
    </script>
</head>
<body>
    <div class="container">

        <?php echo $portal->_sys_message; ?>

        <div class="login-window">
            <div class="header">
                <?php echo $portal->_title; ?>
            </div>
            <!-- Tab links -->
            <div class="tab">
                <button class="tablinks tabButton" id="defaultOpen" onclick="openTab(event, 'Add')">Add message</button>
                <button class="tablinks tabButton" onclick="openTab(event, 'Manage')">Manage messages</button>
                <form name="logoutForm" id="logoutForm" action="<?php echo $_SERVER['PHP_SELF'] . '?id=' . $_GET['id']; ?>" method="post">
                    <button class="tablinks tabButton" type="submit" name="logout" id="logout" form="logoutForm" value="Logout">Logout</button>
                </form>
            </div>

            <!-- ADD message -->
            <div id="Add" class="tabcontent">
                <p style="color:#5c5c5c">Add a new message below.</p>
                <div>
                    <form id="newMessage" name="newMessage" method="post">
                        <div>
                            <div>Message: </div>
                            <div>
                                <textarea name="messageContent" id="messageContent" form="newMessage" rows="4" cols="30" width="100%" maxlength="128" placeholder="Enter message here..."></textarea>
                            </div>
                            <br />
                            <div>Date: </div>
                            <div>
                                <input type="date" name="messageDate" id="messageDate" />
                            </div>
                            <br />
                            <input type="submit" id="addMessage" name="addMessage" value="Add message" />
                        </div>
                    </form>
                </div>
            </div>

            <!-- MANAGE messages -->
            <div id="Manage" class="tabcontent">
                <p style="color:#5c5c5c">Manage your messages here.</p>
                <table class="styled-table">
                    <thead>
                        <tr>
                            <th>Message</th>
                            <th>Target date</th>
                            <th>Created</th>
                            <th>Executed</th>
                            <th>Edit</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <?php
                        if (isset($portal->_messages) && count($portal->_messages) > 0)
                        {
                            foreach ($portal->_messages as $message)
                            {
                                $disabledHtml = "disabled";
                                $executedHtml = "Yes";
                                $changeMessageHtml = "";
                                $changeTargetDateHtml = "";

                                if ($message->is_executed != 1)
                                {
                                    $disabledHtml = "";
                                    $executedHtml = "No";
                                    $changeMessageHtml = " onclick=\"changeMessage()\"";
                                    $changeTargetDateHtml = " onclick=\"changeTargetDate()\"";
                                }

                                echo "<form name=\"manageForm\" id=\"manageForm\" method=\"post\"><tr>
                                          <td>
                                            <div id=\"mngMessage\"". $changeMessageHtml .">
                                                <div id=\"messageContent\">". $message->message ."</div>
                                                <textarea name=\"messageContent\" id=\"messageContent\" form=\"manageForm\" rows=\"4\ cols=\"30\" width=\"100%\" maxlength=\"128\" placeholder=\"Enter message here...\" style=\"display:none;\">" . $message->message . "</textarea>
                                            </div>
                                          </td>
                                          <td>
                                            <div id=\"mngTargetDate\"" . $changeTargetDateHtml . ">
                                                <div id=\"targetDate\">" . date_format(date_create($message->target_date), "d-m-Y") . "</div>
                                                <input type=\"date\" name=\"targetDate\" id=\"targetDate\" style=\"display:none;\" />
                                            </div>
                                          </td>
                                          <td>" . date_format(date_create($message->created_datetime), "d-m-Y H:i:s") . "</td>
                                          <td>" . $executedHtml . "</td>
                                          <td>
                                            <input type=\"hidden\" id=\"messageId\" name=\"messageId\" value=\"". $message->id ."\" />
                                            <input type=\"submit\" id=\"editMessage\" name=\"editMessage\" value=\"Save\" ". $disabledHtml ."\>
                                          </td>
                                          <td>
                                            <input type=\"submit\" id=\"deleteMessage\" name=\"deleteMessage\" value=\"Delete\" ". $disabledHtml ."\>
                                          </td>
                                      </tr>";
                            }
                        }
                        else
                        {
                            echo "<tr>
                                        <td colspan=\"6\" style=\"text-align:center;\">No messages created yet..</td>
                                    </tr>";
                        }
                    ?>
                </table>
            </div>
        </div>
    </div>
</body>
</html>