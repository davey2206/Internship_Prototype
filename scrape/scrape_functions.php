<?php

function getPageContentsWithProxy($url)
{
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_PROXY, 'http://brd.superproxy.io:33335');
    curl_setopt($curl, CURLOPT_PROXYUSERPWD, 'brd-customer-hl_1dc67852-zone-data_center:a6m4r2jr27yd');
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    $content = curl_exec($curl);
    curl_close($curl);

    return $content;
}
?>