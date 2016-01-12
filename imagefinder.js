
function ImageFinder() {
	this.mutationObserver = null;
	this.images = $();
	this.sources = {};

	//the things to find
	this.selectorImages = "img, object, video, embed";

	//style tags and CSS in links can add images to other tags. watch the "load" events on these tags
	this.selectorStyles = "style, link";

	//css background-image values without images
	this.backgroundNoImage = ["none", "initial", "inherit"];

	this.imageAdded = null;
	this.imageRemoved = null;
	this.sourceAdded = null;
	this.sourceRemoved = null;
}

ImageFinder.prototype.addImages = function(elements, url) {
	var that = this;
	$(elements).each(function(i, e) {
		var eurl = url || e.src || e.currentSrc;
		$(e).data('imagefilter-src', eurl);
		if (!(eurl in that.sources))
		{
			that.sources[eurl] = [];
			if (that.sourceAdded)
				that.sourceAdded(eurl, e);
		}
		that.sources[eurl].push(e);
		if (that.imageAdded)
			that.imageAdded(e, eurl);
	});
	$.merge(this.images, elements);
}

ImageFinder.prototype.removeImages = function(elements) {
	var that = this;
	var removed = this.images.filter(elements);
	$(removed).each(function(i, e) {
		var eurl = $(e).data('imagefilter-src');
		that.sources[eurl].splice(that.sources[eurl].indexOf(e), 1);
		if (that.sources[eurl].length == 0 && that.sourceRemoved)
			that.sourceRemoved(eurl);
		if (that.imageRemoved)
			that.imageRemoved(e, eurl)
	});
	this.images = this.images.not(removed);
}

//check if a css style includes a background image and return it
ImageFinder.prototype.getCSSBackgroundImage = function(style) {
	var urlRegex = /url\(["'\t ]*([^\)]+?)["'\t ]*\)/;
	if (style && style.backgroundImage && this.backgroundNoImage.indexOf(style.backgroundImage) === -1)
	{
		var url = style.backgroundImage.match(urlRegex);
		if (url)
			return url[1];
	}
	return null;
};

//look for CSS rules with background images
ImageFinder.prototype.parseStyle = function(rules) {
	var that = this;
	$(rules).each(function(i, rule){
		var url = that.getCSSBackgroundImage(rule.style);
		if (url)
			that.addImages($(rule.selectorText), url);
	});
};

//catch loading of stylenodes and parse all new rules
//see my post: http://stackoverflow.com/questions/20364687/mutationobserver-and-current-computed-css-styles
ImageFinder.prototype.styleLoaded = function(event) {
	this.parseStyle(event.target);
};

//every node on the document ever created will come through this function
ImageFinder.prototype.processElements = function(elements) {
	var that = this;
	elements = $(elements);

	//catch stylesheet load events
	elements.find(this.selectorStyles).on('load', this.styleLoaded.bind(this));

	//directly add all found images
	var imageElements = $(elements).find(this.selectorImages);
	if (imageElements.length)
		this.addImages(imageElements);

	//find elements with style attriutes with images
	var styledElements = elements.find('*[style]').not(imageElements);
	styledElements.each(function(i, e){
		var computedStyle = e.currentStyle || getComputedStyle(e, null);
		var url = that.getCSSBackgroundImage(computedStyle);
		if (url)
			that.addImages([e], url);
	});
};

//mutation observer handler
ImageFinder.prototype.parseMutations = function(mutations) {
	var that = this;
	mutations.forEach(function(mutation) {
		if (mutation.addedNodes)
			that.processElements(mutation.addedNodes)
		if (mutation.removedNodes)
			that.removeImages(mutation.removedNodes)
		if (mutation.attributeName == "style")
			that.processElements([mutation.target]);
	});
};

ImageFinder.prototype.start = function(elements) {
	//parse all nodes currently loaded
	this.processElements($('*'));

	//catch future node injections
	var that = this;
	this.mutationObserver = new MutationObserver(function(){that.parseMutations});
	this.mutationObserver.observe(document, {
		childList: true,
		subtree: true,
		attributes: true,
		characterData: false,
		attributeFilter: ["style"]
	});
};
