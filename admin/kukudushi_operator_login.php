<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
session_start();

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);

$portal = new OperatorPortalLogin();

if (isset($_POST["submit"]))
{
    if (isset($_POST["password"]) && !empty($_POST["password"]))
    {
        if (!empty($portal->_passwordHash)) //Login
        {
             $portal->login($_POST["password"]);
        }
        else //Register
        {
            $portal->register($_POST["password"]);
        }
    }
}


class OperatorPortalLogin
{
    public $_kukudushiImage = "https://kukudushi.com/wp-content/uploads/2021/06/logo-kukudushi-transparant-tbv-website.jpg";
    public $_settings;
    public $_operator_id;
    public $_operator_name;
    public $_passwordHash;
    public $_mode = "Login";
    public $_title;
    public $help_text = "Please login with your own company password below.";


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

        $result = $wpdb->get_results("SELECT * FROM wp_kukudushi_ext_operators WHERE portal_code = '". $portal_id ."';");

        if ($wpdb->num_rows > 0)
        {
            $this->_operator_id = $portal_id;
            $this->_operator_name = $result[0]->name;
            $this->_title = "Portal Login - ". $result[0]->name;
            $this->_passwordHash = $result[0]->password_hash;
        }
        else
        {
            $this->_title = "Portal not found! Please contact the administrator!";
        }

        if (empty($this->_passwordHash))
        {
            $this->_mode = "Register & Login";
            $this->help_text = "Please register an administration password for your portal.";
        }
    }

    function login($password)
    {
        $input_pass_hash = md5($password);
        if ($input_pass_hash == $this->_passwordHash)
        {
            $_SESSION['operator_logged_in'] = true; //Put in has from operator_id and current date
            echo '<script type="text/javascript">window.location.href="' . $this->_settings->_kukudushi_base_url .'/kukudushi_custom/admin/kukudushi_operator_portal.php?id='. $this->_operator_id . '";</script>';
            echo "Login succesful";
        }
        else
        {
            echo "Wrong password!";
        }
    }

    function register($password)
    {
        if (strlen($password) < 8) //Login
        {
            echo "Password must have 8 or more characters";
        }
        else if (strlen($password) > 16) //Login
        {
            echo "Password cannot have more then 16 characters";
        }
        else
        {
            //Update password
            global $wpdb;
            $new_password_hash = md5($password);
            $sql = "UPDATE wp_kukudushi_ext_operators SET password_hash = '". $new_password_hash ."' WHERE portal_code = '" . $this->_operator_id ."'";
            $wpdb->query($sql);

            $this->_passwordHash = $new_password_hash;
            $this->login($password);
        }
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
            /*padding: 10px;*/
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
        .description
        {
            font-size: 1.6vw;
            font-style: italic;
        }

        label {
            display: block;
            padding-left: 15px;
            text-indent: -15px;
            font-size: 1vw;
            /*font-style: italic;*/
            margin-top: 5px;
            color: darkgray;
        }
        .pass-input {
            width: 13px;
            height: 13px;
            padding: 0;
            margin:0;
            vertical-align: middle;
            position: relative;
            top: -1px;
            *overflow: hidden;
        }
        
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
            .description
            {
                font-size: 3.2vw;
            }
            label 
            {
                font-size: 2vw;
            }
        }
    </style>
    <script>
        function showPassword() {
            var x = document.getElementById("password");
            if (x.type === "password") {
              x.type = "text";
            } else {
              x.type = "password";
            }
        } 
    </script>
</head>
<body>
    <div class="container">
        <div class="login-window">
            <div class="header">
                <?php echo $portal->_title; ?>
            </div>
            <br />
            <div class="description">
                <?php echo $portal->help_text; ?>
            </div>
            <br />
            <div class="login-details">
                <form method="post">
                    <div class="center">
                        <div>Portal Password: </div>
                        <div>
                            <input type="password" name="password" id="password"/>
                            <label><input type="checkbox" class="pass-input" onclick="showPassword()" /> - Show password</label>
                        </div>
                    </div>
                    <br />
                    <div class="center">
                        <input type="submit" name="submit" id="submit" value="<?php echo $portal->_mode?>" />
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>