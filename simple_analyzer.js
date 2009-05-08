/*
 * SimpleAnalyzer
 * 「形態素解析もどきを改良してみた - エブログ」 2006-09-28
 * http://ablog.seesaa.net/article/24578324.html
 *
 * 2008-10-18 hgwrsgr@gmail.com が少しだけ修正
 */
function SimpleAnalyzer() {
    this.re = new RegExp("[一-龠々〆ヵヶ]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9]+|[ａ-ｚＡ-Ｚ０-９]+|[,.、。！!？?()（）「」『』]+|[ 　]+", "g");
    this.joshi = new RegExp("(でなければ|について|ならば|までを|までの|くらい|なのか|として|とは|なら|から|まで|して|だけ|より|ほど|など|って|では|は|で|を|の|が|に|へ|と|て)", "g");
}

SimpleAnalyzer.prototype.parse = function(str) {
    if (typeof(str) == "string") {
        var s = str.replace(this.joshi, "$1|");
        var ary = s.split("|");
        var result = [];
        for (var i = 0, max_i = ary.length; i < max_i; i++) {
            var token = ary[i].match(this.re);
            if (token) {
                for (var n = 0, max_n = token.length; n < max_n; n++) {
                    result.push(token[n]);
                }
            }
        }
        return result;
    }
};
