var Panel = function(scrlr) {
    this.element = document.createElement("div");
    this.element.className = "panel";
    this.element.innerHTML = "";
    this.style = this.element.style;
    this.scrlr = scrlr;
};
Panel.prototype = {
    init : function (query, searchUrl, width, left, top, title, snipet, url, refererUrl, imgWidth, imgHeight) {
        this.query = query;
        this.searchUrl = searchUrl;
        this.title = title;
        this.snipet = snipet;
        this.url = url;
        this.refererUrl = refererUrl;
        this.clickUrl = url;
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;

        if (refererUrl !== undefined) {
            this.clickUrl = refererUrl;
            this.element.className = "panel img_panel";
            this.imgElement = document.createElement("img");
            this.imgElement.src = url;
            if (imgWidth === null || imgHeight === null) {
                this.imgDivElement = document.createElement("div");
                this.imgDivElement.className = "imgDiv";
                this.imgDivElement.appendChild(this.imgElement);
                this.element.appendChild(this.imgDivElement);
            } else {
                this.imgElement.width = imgWidth;
                this.imgElement.height = imgHeight;
                this.element.appendChild(this.imgElement);
            }
        }

        this.titleElement = document.createElement("div");
        this.titleElement.className = "title";
        this.titleElement.innerHTML = title;
        this.element.appendChild(this.titleElement);

        this.snipetElement = document.createElement("div");
        this.snipetElement.className = "snipet";
        this.snipetElement.innerHTML = snipet;
        this.element.appendChild(this.snipetElement);

        this.element.style.width = (width -
                                    parseInt(YDOM.getStyle(this.element, 'paddingLeft'), 10) -
                                    parseInt(YDOM.getStyle(this.element, 'paddingRight'), 10) -
                                    parseInt(YDOM.getStyle(this.element, 'marginLeft'), 10) -
                                    parseInt(YDOM.getStyle(this.element, 'marginRight'), 10)
                                   ) + "px";
        this.element.title = '\u201C' + this.query + "\u201D \u2192 " + this.clickUrl;

        this.left = top;
        this.style.left = left + "px";
        this.top = top;
        this.style.top = top + "px";
        this.reloadPosition();

        YUE.addListener(this.element, "click", this.onClick, this, true);
        YUE.addListener(this.element, "mouseover", this.onMouseover, this, true);
        YUE.addListener(this.element, "mouseout", this.onMouseout, this, true);
    },

    getRealHeight : function() {
        this.reloadPosition();
        return this.bottom - this.top +
            parseInt(YDOM.getStyle(this.element, 'marginTop'), 10) +
            parseInt(YDOM.getStyle(this.element, 'marginBottom'), 10);
    },

    reloadPosition : function() {
        var r = YDOM.getRegion(this.element);
        this.left = r.left;
        this.top = r.top;
        this.right = r.right;
        this.bottom = r.bottom;
    },

    onClick : function(e) {
        this.scrlr.stopScrlr();
        ignore_exception(window, window.open, this.searchUrl, "search");
        ignore_exception(window, window.open, this.clickUrl);
    },

    onMouseover : function(e) {
        this.style.backgroundColor = "#333";
        this.titleElement.style.backgroundColor = "#333";
        this.snipetElement.style.backgroundColor = "#333";
    },

    onMouseout : function(e) {
        this.style.backgroundColor = "#000";
        this.titleElement.style.backgroundColor = "#000";
        this.snipetElement.style.backgroundColor = "#000";
    }
};
