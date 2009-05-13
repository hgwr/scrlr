<?php
define(RND_TEXT, "i6/.MpZIZTWisQoT86faOytFwkA.fNlEVPiobdc");
define(CK_NAME, "scrlr");
define(CK_EXPIRE, 3600*24*5);
define(HIST_DIR, "histories");
define(MAX_POST, 10240);
define(MAX_KEYLEN, 64);
define(MAX_HIST, 10000);

if (! isset($_COOKIE[CK_NAME])) {
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

$keywords = array();
if (isset($_POST['keywords']) and strlen($_POST['keywords']) < MAX_POST and trim($_POST['keywords']) !== "") {
    $keywords = explode("\n", $_POST['keywords']);    
}

$ret = "";
foreach ($keywords as $k) {
    if (strlen($k) < MAX_KEYLEN and !isset($history[$k])) {
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
if (sizeof($history) > MAX_HIST) {
    $to_be_deleted = array_rand(array_keys($history), MAX_HIST / 10);
    foreach ($to_be_deleted as $k) {
        unset($history[$k]);
    }
}
file_put_contents(HIST_DIR . "/" . $id, serialize($history));

if (rand(0, 100) < 10) {
    foreach (scandir(HIST_DIR) as $f) {
        $fname = HIST_DIR . "/" . $f;
        if (is_file($fname) and filemtime($fname) < time() - CK_EXPIRE) {
            @unlink($fname);
        }
    }
}

print $ret . "\n";
print $history[$ret] . "\n";
exit;
