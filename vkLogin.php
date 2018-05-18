<?php
include('config.php');

if (isset($_GET['code'])) {
    $url = "https://oauth.vk.com/access_token?";
    $query = array(
        'client_id' => VK_APP_CLIENT_ID,
        'client_secret' => VK_APP_CLIENT_SECRET,
        'redirect_uri' => LOGIN_URL,
        'code' => $_GET['code']
    );
    $params = http_build_query($query);
    $res = file_get_contents($url . $params );

    $res_json = json_decode($res);

    if (isset($res_json->access_token)) {
        $redirect_url = REDIRECT_URL . "/#access_token=$res_json->access_token&user_id=$res_json->user_id";
        header( "Location: $redirect_url", true, 303 );
    } else {
        echo 'Auth error...';
    }
}
