<?php
	$text = "FAIL";
	if ($statefile = @fopen("state.txt", "r"))
	{
		$text = fread($statefile, filesize("state.txt"));
		fclose($statefile);
	}
	else
	{
		$statefile = fopen("state.txt", "w");
		$text = "O_________"; //X moves first!
		fwrite($statefile, $text);
		fclose($statefile);
	}
	//the echo values are return values of a php file
	echo $text;
?>