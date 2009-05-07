var YDOM = YAHOO.util.Dom;
var YUE = YAHOO.util.Event;

var displaySearchStart = function(q) {
	document.getElementById("spinner").style.display = "inline";
	document.getElementById("key").innerHTML = '<a href="' +
		"http://search.yahoo.co.jp/search?ei=UTF-8&p=" + encodeURI(q) + 
		'" target="_blank">' + q + '</a>';
};

var webSearchJsonpRequest = null;
var webSearch = function(q) {
	var url = "http://search.yahooapis.jp/WebSearchService/V1/webSearch?appid=" + APPID_Y +
		"&query=" + encodeURI(q) + "&results=10&output=json&callback=webSearchCallback";
	displaySearchStart(q);
	webSearchJsonpRequest = new JSONscriptRequest(url);
	webSearchJsonpRequest.buildScriptTag();
	webSearchJsonpRequest.addScriptTag();
};

var imgSearchJsonpRequest = null;
var imgSearch = function(q) {
	var url = "http://search.yahooapis.com/ImageSearchService/V1/imageSearch?appid=" + APPID_Y_US +
		"&query=" + encodeURI(q) + "&results=10&output=json&callback=imgSearchCallback";
	displaySearchStart(q);
	imgSearchJsonpRequest = new JSONscriptRequest(url);
	imgSearchJsonpRequest.buildScriptTag();
	imgSearchJsonpRequest.addScriptTag();
};

var Scrlr = function() {
	this.interval = 8 * 1000;
	this.s = new SimpleAnalyzer();
	this.queue = [];
	this.imgQueue = [];
	this.panels = [];
	this.imgPanels = [];
	this.keywordHistory = [];
	this.lastQueryTime = 0;
	this.lastImgQueryTime = 0;
	this.headerVisible = true;
	this.lastHeaderShowTime = new Date().getTime();
};
Scrlr.prototype = {
    onLoad : function() {
		this.canvas = document.getElementById("canvas");
		YUE.addListener(["scrlr", "header", "canvas"], "click", this.onScrlrClick, this, true);
		YUE.addListener("mouseCaptureArea", "mouseover", this.onMouseoverHeader, this, true);
		this.polling = new Polling(this.tick.bind(this), this.interval);
		this.polling.run();
		var p = new Polling(this.checkHideHeader.bind(this), 1000);
		p.run();
		document.getElementById("spinner").style.display = "inline";
    },

	checkHideHeader : function() {
		if (this.polling.running && this.headerVisible && new Date().getTime() - this.lastHeaderShowTime >= 10000) {
			this.hideHeader();
		}
	},

    onScrlrClick : function(e) {
		this.showHeader();
		if (this.polling.running) {
			this.stopScrlr();
		} else {
			this.runScrlr();
		}
    },

	onMouseoverHeader : function(e) {
		this.showHeader();
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
		if (! this.headerVisible) { return; }
		this.headerVisible = false;
		var r = YAHOO.util.Dom.getRegion('header');
		var anim = new YAHOO.util.Motion('header', { points: { to: [0, r.top - r.bottom] } }, 1);
		anim.animate();
	},

    runScrlr : function() {
		if (this.polling.running) { return; }
		this.polling.run();
		document.getElementById("status").style.color = "#888";
		document.getElementById("status").style.textDecoration = "none";
		document.getElementById("status").innerHTML = "&gt;&gt;";
    },

    stopScrlr : function() {
		if (! this.polling.running) { return; }
		this.polling.stop();
		document.getElementById("status").style.color = "#f00";
		document.getElementById("status").style.textDecoration = "blink";
		document.getElementById("status").innerHTML = "||";
    },

	keywordFromPanels : function() {
		var text = "";
		var n = this.panels.length;
		for (var i = 0; i < n; i++) {
			text += " " + this.panels[i].title + " " + this.panels[i].snipet;
		}
		var keywords = shuffle(keywordFilter(this.s.parse(text).uniq()));
		var ret = null;
		n = keywords.length;
		for (i = 0; i < n; i++) {
			if (! this.usedKeyword(keywords[i])) {
				ret = keywords[i];
				this.registerUsedKeyword(ret);
				break;
			}
		}
		return ret;
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

	registerUsedKeyword : function(k) {
		this.keywordHistory.push(k);
		if (this.keywordHistory.length > 1000) {
			this.keywordHistory.shift();
		}
	},

	prepareQueue : function () {
		var q = null;
		var shortQueue = (this.queue.length <= 3);
		var shortImgQueue = (this.imgQueue.length <= 3);
		if (shortQueue || shortImgQueue) {
			q = this.keywordFromPanels();
			if(q === undefined || q === null) {
				var date = new Date();
				date.setTime(date.getTime() - 3 * 86400 * 1000);
				var y = date.getYear();
				var m = date.getMonth() + 1;
				var d = date.getDate();
				if (y < 2000) { y += 1900; }
				if (m < 10) { m = "0" + m; }
				if (d < 10) { d = "0" + d; }
				q = "news " + y + "-" + m + "-" + d;
			}
		}

		var now = new Date();
		if (shortQueue && now.getTime() - this.lastQueryTime >= 30000) {
			this.showHeader();
			webSearch(q);
		}
		if (shortImgQueue && now.getTime() - this.lastImgQueryTime >= 30000) {
			this.showHeader();
			imgSearch(q);
		}
	},

    /* 定期的に呼ばれる関数 */
    tick : function() {
		var panels = this.panels;
		if (panels.length > 0) {
			if (panels[0].bottom <= 0) {
				this.canvas.removeChild(panels[0].element);
				panels.shift();
			}
		}
		var imgPanels = this.imgPanels;
		if (imgPanels.length > 0) {
			if (imgPanels[0].bottom <= 0) {
				this.canvas.removeChild(imgPanels[0].element);
				imgPanels.shift();
			}
		}
		
		this.prepareQueue();
		if (this.queue.length <= 0) {
			return;
		}
		
		this.viewportWidth = YDOM.getViewportWidth();
		this.viewportHeight = YDOM.getViewportHeight();
		var center = this.viewportWidth / 2;
		var panelWidth = center * 0.9;
		var left = (center * 0.1) / 2 ;

		// ウェブページのほう
		var panel = new Panel();
		this.canvas.appendChild(panel.element);
		var page = this.queue.shift();
		var top = (panels.length > 0 ? max(panels[panels.length-1].bottom+1, this.viewportHeight) :
				   this.viewportHeight);
		panel.init(panelWidth, left, top, page.title, page.snipet, page.url);
		panels.push(panel);
		var scrollDelta = panel.getRealHeight();
		var n = panels.length;
		var i = 0;
		for (i = 0; i < n; i++) {
			var destY = panels[i].top - scrollDelta;
			var anim = new YAHOO.util.Motion(panels[i].element, { points: { to: [left, destY] } }, 3);
			anim.animate();
			panels[i].top -= scrollDelta;
			panels[i].bottom -= scrollDelta;
		}
		
		// 画像のほう
		if (this.imgQueue.length > 0) {
			panel = new Panel();
			this.canvas.appendChild(panel.element);
			page = this.imgQueue.shift();
			top = (imgPanels.length > 0 ? max(imgPanels[imgPanels.length-1].bottom+1, this.viewportHeight) :
				   this.viewportHeight);
			panel.init(panelWidth, center+left, top, page.title, page.snipet, page.url,
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

var webSearchCallback = function(jsonData) {
	var ret = [];
	var results = jsonData.ResultSet.Result;
	var n = results.length;
	for (var i = 0; i < n; i++) {
		ret.push({ title : results[i].Title,
				   snipet : results[i].Summary,
				   url : results[i].Url
				 });
	}
	scrlr.queue = scrlr.queue.concat(ret);
	scrlr.lastQueryTime = new Date().getTime();
	document.getElementById("spinner").style.display = "none";
	webSearchJsonpRequest.removeScriptTag();
};

var imgSearchCallback = function(jsonData) {
	var ret = [];
	var results = jsonData.ResultSet.Result;
	var n = results.length;
	for (var i = 0; i < n; i++) {
		ret.push({ title : results[i].Title,
				   snipet : results[i].Summary,
				   url : results[i].Thumbnail.Url,
				   refererUrl : results[i].RefererUrl,
				   height : parseInt(results[i].Thumbnail.Height, 10),
				   width : parseInt(results[i].Thumbnail.Width, 10)
				 });
	}
	scrlr.imgQueue = scrlr.imgQueue.concat(ret);
	scrlr.lastImgQueryTime = new Date().getTime();
	document.getElementById("spinner").style.display = "none";
	imgSearchJsonpRequest.removeScriptTag();
};

YUE.onDOMReady(scrlr.onLoad.bind(scrlr));
