<?php
require 'common.php';

foreach (scandir(HIST_DIR) as $f) {
    $fname = HIST_DIR . "/" . $f;
    if (is_file($fname)) {
        $c = @file_get_contents($fname);
        if ($c !== FALSE) {
            $h = unserialize($c);
            $history = array_merge($h, $history);
        }
    }
}
$history = cutdown($history);
file_put_contents(HIST_DIR . "/" . $id, serialize($history));
