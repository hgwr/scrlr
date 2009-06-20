<?php
define(RND_TEXT, "i6/.MpZIZTWisQoT86faOytFwkA.fNlEVPiobdc");
define(CK_NAME, "scrlr");
define(CK_EXPIRE, 3600*24*5);
define(HIST_DIR, "histories");
define(MAX_POST, 10240);
define(MAX_KEYLEN, 64);
define(MAX_HIST, 10000);

function cleanup() {
    foreach (scandir(HIST_DIR) as $f) {
        $fname = HIST_DIR . "/" . $f;
        if (is_file($fname) and filemtime($fname) < time() - CK_EXPIRE) {
            @unlink($fname);
        }
    }
}

function cutdown($history) {
    if (sizeof($history) > MAX_HIST) {
        $to_be_deleted = array_rand(array_keys($history), MAX_HIST / 10);
        foreach ($to_be_deleted as $k) {
            unset($history[$k]);
        }
    }
    return $history;
}

if (! isset($_COOKIE[CK_NAME]) or !preg_match('/^[0-9a-f]{40}$/', $_COOKIE[CK_NAME])) {
    $id = sha1(rand() . RND_TEXT . time());
} else {
    $id = $_COOKIE[CK_NAME];
}
setcookie(CK_NAME, $id, time() + CK_EXPIRE);
header("Content-type: text/plain");
header("Cache-Control: no-store, no-cache");

$history = array();
$c = @file_get_contents(HIST_DIR . "/" . $id);
if ($c !== FALSE) {
    $history = unserialize($c);
}
