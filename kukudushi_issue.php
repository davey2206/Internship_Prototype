<?php
require_once('managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_guid);

$userGUID = "";

if (isset($_COOKIE["GUID"]))
{
    $userGUID = $_COOKIE["GUID"];
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Kukudushi - Issue Registration</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
    <style>
        body 
        {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f2f2f2;
        }
        .container 
        {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 400px;
        }
        input, textarea, button 
        {
            width: 100%;
            margin-bottom: 10px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button 
        {
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
        }
        button:hover 
        {
            background-color: #45a049;
        }
        .display-error 
        {
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
    </style>
    <script>
        //Setup form handling
		jQuery(document).ready(function ()
		{
			jQuery("#submit").click(function (e)
			{
				e.preventDefault();
				var issue_text = jQuery("#issue").val();
				var email = jQuery("#email").val();
                var cookie_guid = "<?php echo $userGUID; ?>";

				jQuery.ajax({
					type: "POST",
					url: "./backend/register_issue.php",
					dataType: "json",
					data:
					{
						issue_text: issue_text,
                        email: email,
                        cookie_guid: cookie_guid
					},
					success: function (data)
					{
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
							jQuery(".display-error").html("<ul style=\'padding: 15px;margin:auto;\'>" + data.message + "</ul>");
							jQuery(".display-error").css("display", "block");
							jQuery(".display-error").css("background-color", "red");
							jQuery(".display-error").css("color", "black");
							jQuery(".display-error").css("opacity", 1);
						}

						jQuery(".display-error").delay(2500).fadeOut( 1500, function()
						{
							// Animation complete.
							//jQuery(".display-error").css("opacity", 0);
						});

					}
				});
			});
		});
    </script>
</head>
<body>
    <div class="container">
        <h2>Report an Issue</h2>
        <label for="issue">Describe your issue:</label>
        <textarea id="issue" name="issue" rows="4" required></textarea>
        
        <label for="email">Email (optional):</label>
        <input type="email" id="email" name="email">
        
        <button id="submit" class="submit" type="submit">Send</button>
    </div>
    <div class="display-error">
    </div>
</body>
</html>