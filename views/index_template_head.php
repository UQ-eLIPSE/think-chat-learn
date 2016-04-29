<?php
include('session_config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- From http://stackoverflow.com/questions/1341089/using-meta-tags-to-turn-off-caching-in-all-browsers -->
    <meta http-equiv="cache-control" content="max-age=0" />
    <meta http-equiv="cache-control" content="no-cache" />
    <meta http-equiv="expires" content="0" />
    <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
    <meta http-equiv="pragma" content="no-cache" />
    <!-- Fixes issue where buttons appear as rectangles and formatting is wrong and unusable occasionally in IE -->
    <!-- Suggested by http://stackoverflow.com/questions/13440230/why-does-the-ie-display-the-bootstrap-theme-wrong-what-could-i-change-in-the-st/ -->
    <meta http-equiv="X-UA-Compatible" content="IE=9" />

    <title>MOOCchat</title>

    <!-- Bootstrap Core CSS -->
    <link href="css/bootstrap-simplex.css" rel="stylesheet" />
	<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">

    <!-- MOOCchat Custom CSS -->
    <link href="css/moocchat.css" rel="stylesheet" />
    <!--[if lt IE 9]>
    <script src="./js/html5shiv.min.js"></script>
    <script src="./js/respond.min.js"></script>
    <![endif]-->
</head>

<body>
	<div id="header" class="text-left">

			<div class="row">
				<div class="col-md-7 col-md-offset-1">
					<h1>ENGG1200 - MoocChat <i class="fa fa-users"></i></h1>
				</div>
				<div class="col-md-4 text-align-right" style="top:14px">
					<img src="img/uq-logo.png" width="150">
				</div>

			</div>
	</div>
	<?php
	if ($session_started == "yes" || isset($_GET['tester'])) {
		$session_started = 'yes';
	?>



  <!-- TODO Add stuff within here -->



	
