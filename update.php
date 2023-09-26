<?php 
$text = $_GET["data"];
if (strlen($text) != 10) echo "FAIL";
$statefile = fopen("state.txt", "w");
fwrite($statefile, $text);
fclose($statefile);
echo $text
?>