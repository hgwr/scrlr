var Panel = function() {
    this.element = document.createElement("div");
    this.element.className = "panel";
	this.element.innerHTML = "";
    this.style = this.element.style;
};
Panel.prototype = {
	init : function	(width, left, top, title, snipet, url, refererUrl, imgWidth, imgHeight) {
		this.title = title;
		this.snipet = snipet;
		this.url = url;
		this.refererUrl = refererUrl;
		this.clickUrl = url;
		this.imgWidth = imgWidth;
		this.imgHeight = imgHeight;

		var html = '';
		if (refererUrl !== undefined) {
			this.clickUrl = refererUrl;
			this.element.className = "panel img_panel";
			html += "<img src='" + url + "'" +
				" width='" + imgWidth + "'" + 
				" height='" + imgHeight + "'" +
				" >";
		}
		html += "<div class='title'>" + title + "</div>" +
			"<div class='snipet'>" + snipet + "</div>";
		this.element.innerHTML = html;
		this.element.style.width = (width -
									parseInt(YAHOO.util.Dom.getStyle(this.element, 'paddingLeft'), 10) -
									parseInt(YAHOO.util.Dom.getStyle(this.element, 'paddingRight'), 10) -
									parseInt(YAHOO.util.Dom.getStyle(this.element, 'marginLeft'), 10) -
									parseInt(YAHOO.util.Dom.getStyle(this.element, 'marginRight'), 10)
								   ) + "px";
		this.element.title = this.clickUrl;
		
		this.left = top;
		this.style.left = left + "px";
		this.top = top;
		this.style.top = top + "px";
		this.reloadPosition();

		YAHOO.util.Event.addListener(this.element, "click", this.onClick, this, true);
	},
	getRealHeight : function() {
		this.reloadPosition();
		return this.bottom - this.top +
			parseInt(YDOM.getStyle(this.element, 'marginTop'), 10) + 
			parseInt(YDOM.getStyle(this.element, 'marginBottom'), 10);
	},
	reloadPosition : function() {
		var r = YAHOO.util.Dom.getRegion(this.element);
		this.left = r.left;
		this.top = r.top;
		this.right = r.right;
		this.bottom = r.bottom;
	},
	onClick : function(e) {
		try {
			window.open(this.clickUrl, null);
		} catch (ex) {
			
		}
	}
};
