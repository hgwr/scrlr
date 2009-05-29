var displaySearchStart = function(q) {
    document.getElementById("search_log").innerHTML = "&ldquo;" + encode_entities(q.q) + "&rdquo; was searched.";
    document.getElementById("spinner").style.display = "inline";
};

var flickrImgSearchJsonpRequest = null;
var flickrImgSearch = function(q) {
    displaySearchStart(q);
    var url = "http://www.flickr.com/services/rest/?method=flickr.photos.search&format=json&api_key=" + APPID_F +
        "&per_page=6&page=" + q.count + "&sort=relevance&text=" + encodeURIComponent(q.q);
    flickrImgSearchJsonpRequest = new JSONscriptRequest(url);
    flickrImgSearchJsonpRequest.buildScriptTag();
    flickrImgSearchJsonpRequest.addScriptTag();
};

var liveSearchJsonpRequest = null;
var liveSearch = function(q) {
    displaySearchStart(q);
    var url = "http://api.search.live.net/json.aspx?AppId=" + APPID_L +
        "&Market=ja-JP&Query=" + encodeURIComponent(q.q) +
        "&Sources=Web+Image&Web.Count=6&Image.Count=3" +
        "&Web.Offset=" + q.count + "&Image.Offset=" + q.count +
        "&JsonType=callback&JsonCallback=liveSearchCallback";
    liveSearchJsonpRequest = new JSONscriptRequest(url);
    liveSearchJsonpRequest.buildScriptTag();
    liveSearchJsonpRequest.addScriptTag();
};

var yahooWebSearchJsonpRequest = null;
var yahooWebSearch = function(q) {
    displaySearchStart(q);
    var url = "http://search.yahooapis.jp/WebSearchService/V1/webSearch?appid=" + APPID_Y +
        "&query=" + encodeURIComponent(q.q) +
        "&start=" + (q.count * 6 + 1) +
        "&results=6&output=json&callback=yahooWebSearchCallback";
    yahooWebSearchJsonpRequest = new JSONscriptRequest(url);
    yahooWebSearchJsonpRequest.buildScriptTag();
    yahooWebSearchJsonpRequest.addScriptTag();
};

var yahooImgSearchJsonpRequest = null;
var yahooImgSearch = function(q) {
    displaySearchStart(q);
    var url = "http://search.yahooapis.com/ImageSearchService/V1/imageSearch?appid=" + APPID_Y_US +
        "&query=" + encodeURIComponent(q.q) +
        "&start=" + (q.count * 6 + 1) +
        "&results=3&output=json&callback=yahooImgSearchCallback";
    yahooImgSearchJsonpRequest = new JSONscriptRequest(url);
    yahooImgSearchJsonpRequest.buildScriptTag();
    yahooImgSearchJsonpRequest.addScriptTag();
};

var Scrlr = function() {
    this.interval = 12 * 1000;
    this.s = new SimpleAnalyzer();
    this.webQueue = [];
    this.imgQueue = [];
    this.clockPanels = [];
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
        YUE.addListener(["header", "mouse_capture_area"], "mouseover", this.onMouseoverHeader, this, true);
        YUE.addListener(["header", "mouse_capture_area"], "mouseout", this.onMouseoutHeader, this, true);
        this.polling = new Polling(this.tick.bind(this), this.interval);
        this.preparing = new Polling(this.prepareQueue.bind(this), this.interval / 2);
        this.runScrlr();
        document.getElementById("spinner").style.display = "inline";
        var p = new Polling(this.checkHideHeader.bind(this), 1000);
        p.run();
        p = new Polling(this.tickClock.bind(this), 1000);
        p.run();
    },

    checkHideHeader : function() {
        if (!this.mouseInHeader && this.polling.running && this.headerVisible &&
            new Date().getTime() - this.lastHeaderShowTime >= 12000) {
            this.hideHeader();
        }
    },

    tickClock : function() {
        var n = this.clockPanels.length;
        if (n > 0) {
            var tp = this.clockPanels[n-1];
            var now = new Date();
            tp.titleElement.innerHTML = convertDateToString(now) + '&nbsp;(' + convertDateToDoW(now) + ')';
            tp.snipetElement.innerHTML = '<span class="time">' + convertDateToHM(now) + '</span>:' +
                convertDateToSec(now);
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
        var ret = null;
        try {
            req.send(pars);
            if (req.status == 200) {
                ret = req.responseText.split("\n");
                ret = { q:ret[0], count:ret[1] };
                this.registerKeyword(ret);
            }
        } catch (e) { }
        if (ret !== null) {
            return ret;
        }
        return this.selectKeyword(keywords);
    },

    selectKeyword : function(keywords) {
        var ret = { q:null, count:null };
        var n = keywords.length;
        for (var i = 0; i < n; i++) {
            if (! this.usedKeyword(keywords[i])) {
                ret = { q:keywords[i], count:1 };
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
            if (this.keywordHistory[i].q == k) {
                return true;
            }
        }
        return false;
    },

    prepareQueue : function () {
        var q = { q:null, count:null };
        var shortWebQueue = (this.webQueue.length <= 3);
        var shortImgQueue = (this.imgQueue.length <= 3);
        if (shortWebQueue || shortImgQueue) {
            q = this.keywordFromPanels();
            if(q.q === undefined || q.q === null || q.q.replace(/^\s+|\s+$/g, "") === "") {
                var date = new Date();
                date.setTime(date.getTime() - 3 * 86400 * 1000);
                q = { q:convertDateToString(date), count:1 };
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

        var canvas = this.canvas;
        var clockPanels = this.clockPanels;
        if (clockPanels.length > 1) {
            canvas.removeChild(clockPanels[0].element);
            YUE.purgeElement(clockPanels[0].element, true);
            clockPanels.shift();
        }
        var webPanels = this.webPanels;
        if (webPanels.length > 0) {
            if (webPanels[0].bottom <= 0) {
                canvas.removeChild(webPanels[0].element);
                YUE.purgeElement(webPanels[0].element, true);
                webPanels.shift();
            }
        }
        var imgPanels = this.imgPanels;
        if (imgPanels.length > 0) {
            if (imgPanels[0].bottom <= 0) {
                canvas.removeChild(imgPanels[0].element);
                YUE.purgeElement(imgPanels[0].element);
                imgPanels.shift();
            }
        }

        this.viewportWidth = YDOM.getViewportWidth();
        this.viewportHeight = YDOM.getViewportHeight();
        //
        // |-----------------ViewportWidth 99%----------------|
        // | clock(14%) | panel(42%) | space(1%) | panel(42%) |
        //
        var width = { };
        width.space = (this.viewportWidth / 100) * 1;
        width.clock = (this.viewportWidth / 100) * 14;
        width.panel = (this.viewportWidth / 100) * 42;
        width.clockLeft = 0;
        width.panelLeft = width.clockLeft + width.clock;
        width.imgPanelLeft = width.panelLeft + width.panel + width.space;

        var panel, page, top, scrollDelta, n, i, destY, anim;

        // clock
        panel = new Panel(this);
        panel.element.className = "panel clock_panel";
        canvas.appendChild(panel.element);
        n = clockPanels.length;
        top = n > 0 ? max(clockPanels[n-1].bottom+1, this.viewportHeight) : this.viewportHeight;
        var now = new Date();
        panel.init(null, null, width.clock, width.clockLeft, top, '', '', null);
        clockPanels.push(panel);
        n += 1;
        this.tickClock();
        scrollDelta = panel.getRealHeight();
        for (i = 0; i < n; i++) {
            destY = clockPanels[i].top - scrollDelta;
            anim = new YAHOO.util.Motion(clockPanels[i].element, { points: { to: [width.clockLeft, destY] } }, 3);
            anim.animate();
            clockPanels[i].top -= scrollDelta;
            clockPanels[i].bottom -= scrollDelta;
        }
        if (n > 1) {
            var ttp = clockPanels[0];
            anim = new YAHOO.util.ColorAnim(ttp.titleElement, { color: { to: '#000' } }, 3);
            anim.animate();
            var ttps = ttp.snipetElement;
            anim = new YAHOO.util.ColorAnim(ttps, { color: { to: '#000' } }, 3);
            anim.animate();
            anim = new YAHOO.util.ColorAnim(ttps.getElementsByTagName('span')[0], { color: { to: '#000' } }, 3);
            anim.animate();
        }

        // web
        if (this.webQueue.length > 0) {
            panel = new Panel(this);
            canvas.appendChild(panel.element);
            page = this.webQueue.shift();
            n = webPanels.length;
            top = n > 0 ? max(webPanels[n-1].bottom+1, this.viewportHeight) : this.viewportHeight;
            panel.init(page.query, page.searchUrl, width.panel,
                       width.panelLeft, top, page.title, page.snipet, page.url);
            webPanels.push(panel);
            n += 1;
            scrollDelta = panel.getRealHeight();
            for (i = 0; i < n; i++) {
                destY = webPanels[i].top - scrollDelta;
                anim = new YAHOO.util.Motion(webPanels[i].element, { points: { to: [width.panelLeft, destY] } }, 3);
                anim.animate();
                webPanels[i].top -= scrollDelta;
                webPanels[i].bottom -= scrollDelta;
            }
        }

        // image
        if (this.imgQueue.length > 0) {
            panel = new Panel(this);
            canvas.appendChild(panel.element);
            page = this.imgQueue.shift();
            n = imgPanels.length;
            top = n > 0 ? max(imgPanels[n-1].bottom+1, this.viewportHeight) : this.viewportHeight;
            panel.init(page.query, page.searchUrl, width.panel,
                       width.imgPanelLeft, top, page.title, page.snipet, page.url,
                       page.refererUrl, page.width, page.height);
            imgPanels.push(panel);
            n += 1;
            scrollDelta = panel.getRealHeight();
            for (i = 0; i < n; i++) {
                destY = imgPanels[i].top - scrollDelta;
                anim = new YAHOO.util.Motion(imgPanels[i].element,
                                             { points: { to: [width.imgPanelLeft, destY] } }, 3);
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
                       query : scrlr.lastQuery.live.q,
                       searchUrl : ('http://search.live.com/results.aspx?q=' +
                                    encodeURIComponent(scrlr.lastQuery.live.q))
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
                       query : scrlr.lastQuery.live.q,
                       searchUrl : ('http://search.live.com/images/results.aspx?scope=images&q=' +
                                    encodeURIComponent(scrlr.lastQuery.live.q))
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
                       query : scrlr.lastQuery.web.q,
                       searchUrl : ("http://search.yahoo.co.jp/search?ei=UTF-8&p=" +
                                    encodeURIComponent(scrlr.lastQuery.web.q))
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
                       query : scrlr.lastQuery.img.q,
                       searchUrl : ("http://images.search.yahoo.com/search/images?ei=UTF-8&p=" +
                                    encodeURIComponent(scrlr.lastQuery.img.q))
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
                       query : scrlr.lastQuery.img.q,
                       searchUrl : "http://www.flickr.com/search/?q=" + encodeURIComponent(scrlr.lastQuery.img.q)
                     });
        }
        scrlr.imgQueue = scrlr.imgQueue.concat(ret);
    } catch (e) { }
    scrlr.lastQueryTime.img = new Date().getTime();
    flickrImgSearchJsonpRequest.removeScriptTag();
};

YAHOO.util.Event.onDOMReady(scrlr.onLoad.bind(scrlr));
