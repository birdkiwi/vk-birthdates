<?php
header('Content-Type: application/json');
$url = "https://api.vk.com/method/groups.getById?";
$params = http_build_query($_REQUEST);
$res = file_get_contents($url . $params );

echo $res;
