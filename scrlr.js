var displaySearchStart = function(q) {
    document.getElementById("searchLog").innerHTML = "&ldquo;" + q + "&rdquo; was searched.";
    document.getElementById("spinner").style.display = "inline";
};

var flickrImgSearchJsonpRequest = null;
var flickrImgSearch = function(q) {
    displaySearchStart(q);
    var url = "http://www.flickr.com/services/rest/?method=flickr.photos.search&format=json&api_key=" + APPID_F +
        "&per_page=6&sort=relevance&text=" + encodeURIComponent(q);
    flickrImgSearchJsonpRequest = new JSONscriptRequest(url);
    flickrImgSearchJsonpRequest.buildScriptTag();
    flickrImgSearchJsonpRequest.addScriptTag();
};

var liveSearchJsonpRequest = null;
var liveSearch = function(q) {
    displaySearchStart(q);
    var url = "http://api.search.live.net/json.aspx?AppId=" + APPID_L +
        "&Market=ja-JP&Query=" + encodeURIComponent(q) +
        "&Sources=Web+Image&Web.Count=6&Image.Count=3&JsonType=callback&JsonCallback=liveSearchCallback";
    liveSearchJsonpRequest = new JSONscriptRequest(url);
    liveSearchJsonpRequest.buildScriptTag();
    liveSearchJsonpRequest.addScriptTag();
};

var yahooWebSearchJsonpRequest = null;
var yahooWebSearch = function(q) {
    displaySearchStart(q);
    var url = "http://search.yahooapis.jp/WebSearchService/V1/webSearch?appid=" + APPID_Y +
        "&query=" + encodeURIComponent(q) + "&results=6&output=json&callback=yahooWebSearchCallback";
    yahooWebSearchJsonpRequest = new JSONscriptRequest(url);
    yahooWebSearchJsonpRequest.buildScriptTag();
    yahooWebSearchJsonpRequest.addScriptTag();
};

var yahooImgSearchJsonpRequest = null;
var yahooImgSearch = function(q) {
    displaySearchStart(q);
    var url = "http://search.yahooapis.com/ImageSearchService/V1/imageSearch?appid=" + APPID_Y_US +
        "&query=" + encodeURIComponent(q) + "&results=3&output=json&callback=yahooImgSearchCallback";
    yahooImgSearchJsonpRequest = new JSONscriptRequest(url);
    yahooImgSearchJsonpRequest.buildScriptTag();
    yahooImgSearchJsonpRequest.addScriptTag();
};

var Scrlr = function() {
    this.interval = 12 * 1000;
    this.s = new SimpleAnalyzer();
    this.webQueue = [];
    this.imgQueue = [];
    this.webPanels = [];
    this.imgPanels = [];
    this.keywordHistory = [];
    this.lastQuery = { web : '', img : '', live : '' };
    this.lastQueryTime = { web : 0, img : 0, live : 0 };
    this.headerVisible = true;
    this.lastHeaderShowTime = new Date().getTime();
    this.mouseInHeader = false;
};
Scrlr.prototype = {
    onLoad : function() {
        this.canvas = document.getElementById("canvas");
        YUE.addListener("header", "click", this.onScrlrClick, this, true);
        YUE.addListener(["header", "mouseCaptureArea"], "mouseover", this.onMouseoverHeader, this, true);
        YUE.addListener(["header", "mouseCaptureArea"], "mouseout", this.onMouseoutHeader, this, true);
        this.polling = new Polling(this.tick.bind(this), this.interval);
        this.preparing = new Polling(this.prepareQueue.bind(this), this.interval / 2);
        this.runScrlr();
        document.getElementById("spinner").style.display = "inline";
        var p = new Polling(this.checkHideHeader.bind(this), 1000);
        p.run();
    },

    checkHideHeader : function() {
        if (!this.mouseInHeader && this.polling.running && this.headerVisible &&
            new Date().getTime() - this.lastHeaderShowTime >= 12000) {
            this.hideHeader();
        }
    },

    onScrlrClick : function(e) {
        if (this.polling.running) {
            this.stopScrlr();
        } else {
            this.runScrlr();
        }
    },

    onMouseoverHeader : function(e) {
        this.mouseInHeader = true;
        this.showHeader();
    },

    onMouseoutHeader : function(e) {
        this.mouseInHeader = false;
    },

    showHeader : function() {
        if (this.headerVisible) { return; }
        this.lastHeaderShowTime = new Date().getTime();
        this.headerVisible = true;
        var r = YAHOO.util.Dom.getRegion('header');
        var anim = new YAHOO.util.Motion('header', { points: { to: [0, 0] } }, 1);
        anim.animate();
    },

    hideHeader : function() {
        if (!this.headerVisible) { return; }
        this.headerVisible = false;
        var r = YAHOO.util.Dom.getRegion('header');
        var anim = new YAHOO.util.Motion('header', { points: { to: [0, r.top - r.bottom] } }, 1);
        anim.animate();
    },

    runScrlr : function() {
        if (this.polling.running) { return; }
        this.preparing.run();
        this.polling.run();
        var s = document.getElementById("status");
        s.style.color = "#fff";
        s.style.textDecoration = "none";
        s.innerHTML = "&gt;&gt;";
        s.title = "Click to PAUSE";
    },

    stopScrlr : function() {
        this.showHeader();
        if (! this.polling.running) { return; }
        this.preparing.stop();
        this.polling.stop();
        var s = document.getElementById("status");
        s.style.color = "#f00";
        s.style.textDecoration = "blink";
        s.innerHTML = "||";
        s.title = "Click to PLAY";
    },

    keywordFromPanels : function() {
        var text = "";
        var n = this.webPanels.length;
        for (var i = 0; i < n; i++) {
            text += " " + this.webPanels[i].title + " " + this.webPanels[i].snipet;
        }
        n = this.imgPanels.length;
        for (i = 0; i < n; i++) {
            text += " " + this.imgPanels[i].title + " " + this.imgPanels[i].snipet;
        }
        var keywords = shuffle(keywordFilter(this.s.parse(text).uniq()));
        if (USE_HIST_SERVER) {
            return this.selectKeywordUsingServer(keywords);
        } else {
            return this.selectKeyword(keywords);
        }
    },

    selectKeywordUsingServer : function(keywords) {
        var pars = 'keywords=' + encodeURIComponent(keywords.join("\n"));
        var req = Ajax.getTransport();
        req.open('POST', HIST_SERVER_URL, false);
        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.send(pars);
        if (req.status == 200) {
            var ret = req.responseText.split("\n");
            this.registerKeyword(ret[0]);
            return ret[0];
        }
        return this.selectKeyword(keywords);
    },

    selectKeyword : function(keywords) {
        var ret = null;
        var n = keywords.length;
        for (var i = 0; i < n; i++) {
            if (! this.usedKeyword(keywords[i])) {
                ret = keywords[i];
                this.registerKeyword(ret);
                break;
            }
        }
        return ret;
    },

    registerKeyword : function(k) {
        this.keywordHistory.push(k);
        if (this.keywordHistory.length > 1000) {
            this.keywordHistory.shift();
        }
    },

    usedKeyword : function(k) {
        var n = this.keywordHistory.length;
        for (var i = 0; i < n; i++) {
            if (this.keywordHistory[i] == k) {
                return true;
            }
        }
        return false;
    },

    prepareQueue : function () {
        var q = null;
        var shortWebQueue = (this.webQueue.length <= 3);
        var shortImgQueue = (this.imgQueue.length <= 3);
        if (shortWebQueue || shortImgQueue) {
            q = this.keywordFromPanels();
            if(q === undefined || q === null || q.replace(/^\s+|\s+$/g, "") === "") {
                var date = new Date();
                date.setTime(date.getTime() - 3 * 86400 * 1000);
                var y = date.getYear();
                var m = date.getMonth() + 1;
                var d = date.getDate();
                if (y < 2000) { y += 1900; }
                if (m < 10) { m = "0" + m; }
                if (d < 10) { d = "0" + d; }
                q = y + "-" + m + "-" + d;
            }
        }
        var now = new Date();
        if (shortWebQueue && now.getTime() - this.lastQueryTime.web >= 30000) {
            this.showHeader();
            this.lastQuery.web = q;
            yahooWebSearch(q);
        }
        if (shortImgQueue && now.getTime() - this.lastQueryTime.img >= 30000) {
            this.showHeader();
            this.lastQuery.img = q;
            flickrImgSearch(q);
            yahooImgSearch(q);
        }
        if ((shortWebQueue || shortImgQueue) && now.getTime() - this.lastQueryTime.live >= 30000) {
            this.showHeader();
            this.lastQuery.live = q;
            liveSearch(q);
        }
    },

    tick : function() {
        document.getElementById("spinner").style.display = "none";

        var webPanels = this.webPanels;
        if (webPanels.length > 0) {
            if (webPanels[0].bottom <= 0) {
                this.canvas.removeChild(webPanels[0].element);
                YUE.purgeElement(webPanels[0].element, true);
                webPanels.shift();
            }
        }
        var imgPanels = this.imgPanels;
        if (imgPanels.length > 0) {
            if (imgPanels[0].bottom <= 0) {
                this.canvas.removeChild(imgPanels[0].element);
                YUE.purgeElement(imgPanels[0].element);
                imgPanels.shift();
            }
        }

        this.viewportWidth = YDOM.getViewportWidth();
        this.viewportHeight = YDOM.getViewportHeight();
        var center = this.viewportWidth / 2;
        var panelWidth = center * 0.9;
        var left = (center * 0.1) / 2 ;
        var panel, page, top, scrollDelta, n, i, destY, anim;
        if (this.webQueue.length > 0) {
            panel = new Panel(this);
            this.canvas.appendChild(panel.element);
            page = this.webQueue.shift();
            top = (webPanels.length > 0 ? max(webPanels[webPanels.length-1].bottom+1, this.viewportHeight) :
                   this.viewportHeight);
            panel.init(page.query, page.searchUrl, panelWidth, left, top, page.title, page.snipet, page.url);
            webPanels.push(panel);
            scrollDelta = panel.getRealHeight();
            n = webPanels.length;
            i = 0;
            for (i = 0; i < n; i++) {
                destY = webPanels[i].top - scrollDelta;
                anim = new YAHOO.util.Motion(webPanels[i].element, { points: { to: [left, destY] } }, 3);
                anim.animate();
                webPanels[i].top -= scrollDelta;
                webPanels[i].bottom -= scrollDelta;
            }
        }
        if (this.imgQueue.length > 0) {
            panel = new Panel(this);
            this.canvas.appendChild(panel.element);
            page = this.imgQueue.shift();
            top = (imgPanels.length > 0 ? max(imgPanels[imgPanels.length-1].bottom+1, this.viewportHeight) :
                   this.viewportHeight);
            panel.init(page.query, page.searchUrl, panelWidth, center+left, top, page.title, page.snipet, page.url,
                       page.refererUrl, page.width, page.height);
            imgPanels.push(panel);
            scrollDelta = panel.getRealHeight();
            n = imgPanels.length;
            i = 0;
            for (i = 0; i < n; i++) {
                destY = imgPanels[i].top - scrollDelta;
                anim = new YAHOO.util.Motion(imgPanels[i].element, { points: { to: [center+left, destY] } }, 3);
                anim.animate();
                imgPanels[i].top -= scrollDelta;
                imgPanels[i].bottom -= scrollDelta;
            }
        }
    }
};

var scrlr = new Scrlr();

var liveSearchCallback = function(jsonData) {
    var ret = [];
    var results, n, i;
    try {
        results = jsonData.SearchResponse.Web.Results;
        n = results.length;
        for (i = 0; i < n; i++) {
            ret.push({ title : results[i].Title,
                       snipet : results[i].Description,
                       url : results[i].Url,
                       query : scrlr.lastQuery.live,
                       searchUrl : 'http://search.live.com/results.aspx?q=' + encodeURIComponent(scrlr.lastQuery.live)
                     });
        }
        scrlr.webQueue = scrlr.webQueue.concat(ret);
    } catch (e) { }

    try {
        ret = [];
        results = jsonData.SearchResponse.Image.Results;
        n = results.length;
        for (i = 0; i < n; i++) {
            ret.push({ title : results[i].Title,
                       snipet : '',
                       url : results[i].Thumbnail.Url,
                       refererUrl : results[i].Url,
                       height : parseInt(results[i].Thumbnail.Height, 10),
                       width : parseInt(results[i].Thumbnail.Width, 10),
                       query : scrlr.lastQuery.live,
                       searchUrl : ('http://search.live.com/images/results.aspx?scope=images&q=' +
                                    encodeURIComponent(scrlr.lastQuery.live))
                     });
        }
        scrlr.imgQueue = scrlr.imgQueue.concat(ret);
    } catch (ex) { }

    scrlr.lastQueryTime.live = new Date().getTime();
    liveSearchJsonpRequest.removeScriptTag();
};

var yahooWebSearchCallback = function(jsonData) {
    try {
        var ret = [];
        var results = jsonData.ResultSet.Result;
        var n = results.length;
        for (var i = 0; i < n; i++) {
            ret.push({ title : results[i].Title,
                       snipet : results[i].Summary,
                       url : results[i].Url,
                       query : scrlr.lastQuery.web,
                       searchUrl : ("http://search.yahoo.co.jp/search?ei=UTF-8&p=" +
                                    encodeURIComponent(scrlr.lastQuery.web))
                     });
        }
        scrlr.webQueue = scrlr.webQueue.concat(ret);
    } catch (e) { }
    scrlr.lastQueryTime.web = new Date().getTime();
    yahooWebSearchJsonpRequest.removeScriptTag();
};

var yahooImgSearchCallback = function(jsonData) {
    try {
        var ret = [];
        var results = jsonData.ResultSet.Result;
        var n = results.length;
        for (var i = 0; i < n; i++) {
            ret.push({ title : results[i].Title,
                       snipet : results[i].Summary,
                       url : results[i].Thumbnail.Url,
                       refererUrl : results[i].RefererUrl,
                       height : parseInt(results[i].Thumbnail.Height, 10),
                       width : parseInt(results[i].Thumbnail.Width, 10),
                       query : scrlr.lastQuery.img,
                       searchUrl : ("http://images.search.yahoo.com/search/images?ei=UTF-8&p=" +
                                    encodeURIComponent(scrlr.lastQuery.img))
                     });
        }
        scrlr.imgQueue = scrlr.imgQueue.concat(ret);
    } catch (e) { }
    scrlr.lastQueryTime.img = new Date().getTime();
    yahooImgSearchJsonpRequest.removeScriptTag();
};

var jsonFlickrApi = function(jsonData) {
    try {
        var ret = [];
        var results = jsonData.photos.photo;
        var n = results.length;
        for (var i = 0; i < n; i++) {
            ret.push({ title : results[i].title,
                       snipet : '',
                       url : ("http://farm" + results[i].farm + ".static.flickr.com/" +
                              results[i].server + "/" + results[i].id + "_" + results[i].secret + "_m.jpg"),
                       refererUrl : "http://www.flickr.com/photos/" + results[i].owner + "/" + results[i].id,
                       height : null,
                       width : null,
                       query : scrlr.lastQuery.img,
                       searchUrl : "http://www.flickr.com/search/?q=" + encodeURIComponent(scrlr.lastQuery.img)
                     });
        }
        scrlr.imgQueue = scrlr.imgQueue.concat(ret);
    } catch (e) { }
    scrlr.lastQueryTime.img = new Date().getTime();
    flickrImgSearchJsonpRequest.removeScriptTag();
};

YAHOO.util.Event.onDOMReady(scrlr.onLoad.bind(scrlr));
