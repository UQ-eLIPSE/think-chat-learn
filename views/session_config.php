<?php
date_default_timezone_set('Australia/Brisbane');
//echo date('Y-m-d  H:i:s');
require_once "uq/auth.php";

$thursday_time = array('10','22');
$sunday_time = array('12','14');

$sessions = array( 1=>array('2016-04-08', $thursday_time),
				   2=>array('2015-08-02', $sunday_time),
				   3=>array('2015-08-06', $thursday_time),
				   4=>array('2015-08-09', $sunday_time),
				   5=>array('2015-08-13', $thursday_time),
				   6=>array('2015-08-16', $sunday_time),
				   7=>array('2015-08-20', $thursday_time),
				   8=>array('2015-08-23', $sunday_time),
				   9=>array('2015-08-27', $thursday_time),
				   10=>array('2015-08-30', $sunday_time),
				   11=>array('2015-09-03', $thursday_time),
				   12=>array('2015-09-06', $sunday_time)
				);

//var_dump($sessions[1][0]);
$date_today = date('Y-m-d');
//$time_hr_now = date('H');
$time_hr_now = date('H');
$session_started = 'no';
//echo $time_hr_now;
//echo '<br>';
//print_r($sessions[1][1][0]);

foreach ($sessions as $question => $val) {
	//print_r('Question: '.$question.'<br>');

	$session_no = $question;

	$session_date = $val[0];
	$session_start_time = $val[1][0];
	$session_end_time = $val[1][1];


	$next_session_date = date_create($sessions[$session_no][0]);

	$next_session_start_time = $sessions[$session_no][1][0] == '12' ? '12noon' : $sessions[$session_no][1][0].':00';
	$next_session_end_time = $sessions[$session_no][1][1];

	$diff =  date_diff(date_create($date_today),date_create($session_date));



	if ($diff->format('%R%a') > 0) {

		$next_session_text = "<h2>Next session is on ". date_format($next_session_date,'l, d/m/Y') ." from " .$next_session_start_time ." to ".$next_session_end_time.":00.</h2>";
		break;
	}
	else if ($diff->format('%R%a') == 0) {
		//print_r ('yes');
		if ($time_hr_now >= $session_start_time && $time_hr_now < $session_end_time) {
			$session_started = 'yes';

			break;

		}
		else if ($time_hr_now < $session_start_time) {
			$next_session_text = "<h2>Today's session will start at " .$session_start_time .":00  till ".$session_end_time.":00.</p></h2>";

			break;

		}
		else {
				$next_session_text = "<h2>Today's session is over.<p>Next session is on ". date_format($next_session_date,'l, d/m/Y') ." from " .$next_session_start_time ."  to ".$next_session_end_time.":00.</p></h2>";
				//break;
			}
		}

	else if ($diff->format('%R%a') < 0)  {

		$next_session_text = "<h2>There Are No Sessions Available</h2>";
		//continue;
	}

	$session_no = $session_no++;

}

//echo $session_no;





#if (date("Y-m-d") == "2014-09-07" && ((intval(date("H")) >= 12 && intval(date("H")) < 14) || (intval(date("H")) >= 19 && intval(date("H")) < 21))) {

?>
