var YDOM = YAHOO.util.Dom;
var YUE = YAHOO.util.Event;

function max(a, b) { return (a > b) ? a : b; }
function min(a, b) { return (a > b) ? b : a; }

function ignore_exception() {
    var args = Array.from(arguments), obj = args.shift(), func = args.shift();
    try {
        return func.apply(obj, args);
    } catch (e) {
        /* do nothing */
    }
}

var SYMBOLS_RE = new RegExp('^[ 　!-/\\[\\]\\\\\\^_`{|}~、。！？（）「」『』]+$');
var keywordFilter = function(keywords) {
    var ret = [];
    var n = keywords.length;
    for (var i = 0; i < n; i++) {
        var k = keywords[i];
        if (k.length >= 2 && ! k.match(SYMBOLS_RE)) {
            ret.push(k);
        }
    }
    return ret;
};

/*
 * 「JavaScript: Array.prototype.uniq - mayokara note」 2008-07-01
 * http://mayokara.info/note/view/251
 */
Array.prototype.uniq = function(){
    for (var i=0,l=this.length; i<l; i++) {
        for (var j=0; j<i; j++) {
            if (this[i] === this[j]) {
                this.splice(i--, l-- && 1);
            }
        }
    }
    return this;
};

/*
 * prototype.js からの抜粋
 * Prototype JavaScript framework, version 1.5.0 (c) 2005-2007 Sam Stephenson
 */
Array.from = function(iterable){
    if (!iterable) { return []; }
    if (iterable.toArray) {
        return iterable.toArray();
    } else {
        var results = [];
        for (var i = 0, length = iterable.length; i < length; i++) {
            results.push(iterable[i]);
        }
        return results;
    }
};
Function.prototype.bind = function() {
    var __method = this, args = Array.from(arguments), object = args.shift();
    return function() {
        return __method.apply(object, args.concat(Array.from(arguments)));
    };
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
// http://snippets.dzone.com/posts/show/849
// hgwrsgr@gmail.com がちょっと修正
var shuffle = function(o) { //v1.0
    for (var j, x, i = o.length; i; j = parseInt(Math.random() * i, 10), x = o[--i], o[i] = o[j], o[j] = x) { }
    return o;
};
