<?php
require 'common.php';

$keywords = array();
if (isset($_POST['keywords']) and strlen($_POST['keywords']) < MAX_POST and trim($_POST['keywords']) !== "") {
    foreach (explode("\n", $_POST['keywords']) as $k) {
        if (strlen($k) < MAX_KEYLEN) {
            array_push($keywords, $k);
        }
    }
}

$ret = "";
foreach ($keywords as $k) {
    if (!isset($history[$k])) {
        $ret = $k;
        $history[$ret] = 1;
        break;
    }
}
if ($ret == "" and sizeof($keywords) > 0) {
    $ret = $keywords[array_rand($keywords, 1)];
    $history[$ret] += 1;
}
if ($ret == "" and sizeof($history) > 0) {
    $ret = array_rand($history, 1);
    $history[$ret] += 1;
}
$history = cutdown($history);
file_put_contents(HIST_DIR . "/" . $id, serialize($history));

if (rand(0, 100) < 10) {
    cleanup();
}

print $ret . "\n";
print $history[$ret] . "\n";
exit;
