<?php

$ch = curl_init('https://api.openai.com/v1/models');

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$result = curl_exec($ch);

echo 'ERROR: '.curl_error($ch).PHP_EOL;
echo 'ERRNO: '.curl_errno($ch).PHP_EOL;
echo 'HTTP: '.curl_getinfo($ch, CURLINFO_HTTP_CODE).PHP_EOL;
