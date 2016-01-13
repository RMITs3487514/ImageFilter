
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

	//what to look for in css background-image properties
	this.urlRegex = /url\(["'\t ]*([^\)]+?)["'\t ]*\)/;

	this.imageAdded = null;
	this.imageRemoved = null;
	this.sourceAdded = null;
	this.sourceRemoved = null;
}

ImageFinder.tempAnchor = document.createElement('a');
ImageFinder.prototype.absoluteUrl = function(url) {
	ImageFinder.tempAnchor.href = url;
	return ImageFinder.tempAnchor.href;
}

ImageFinder.prototype.addImages = function(elements, url) {
	var that = this;
	$(elements).each(function() {
		var eurl = url || this.src || this.currentSrc;
		$(this).data('imagefilter-src', eurl);
		if (!(eurl in that.sources))
		{
			that.sources[eurl] = [];
			if (that.sourceAdded)
				that.sourceAdded(eurl, this);
		}
		that.sources[eurl].push(this);
		if (that.imageAdded)
			that.imageAdded(this, eurl);
	});
	$.merge(this.images, elements);
}

ImageFinder.prototype.removeImages = function(elements) {
	var that = this;
	var removed = this.images.filter(elements);
	$(removed).each(function() {
		var eurl = $(this).data('imagefilter-src');
		that.sources[eurl].splice(that.sources[eurl].indexOf(this), 1);
		if (that.sources[eurl].length == 0 && that.sourceRemoved)
			that.sourceRemoved(eurl);
		if (that.imageRemoved)
			that.imageRemoved(this, eurl)
	});
	this.images = this.images.not(removed);
}

//check if a css style includes a background image and return it
ImageFinder.prototype.getCSSBackgroundImage = function(style) {
	if (style && style.backgroundImage && this.backgroundNoImage.indexOf(style.backgroundImage) === -1)
	{
		var url = style.backgroundImage.match(this.urlRegex);
		if (url)
			return this.absoluteUrl(url[1]);
	}
	return null;
};

//look for CSS rules with background images
ImageFinder.prototype.parseStyle = function(rules) {
	var that = this;
	$(rules).each(function(){
		var url = that.getCSSBackgroundImage(this.style);
		if (url)
			that.addImages($(this.selectorText), url);
	});
};

//catch loading of stylenodes and parse all new rules
//see my post: http://stackoverflow.com/questions/20364687/mutationobserver-and-current-computed-css-styles
ImageFinder.prototype.styleLoaded = function(event) {
	this.parseStyle(event.target.sheet.cssRules);
};

//every node on the document ever created will come through this function
ImageFinder.prototype.processElements = function(elements) {
	var that = this;
	elements = $(elements);

	//catch stylesheet load events
	var styleElements = elements.filter(this.selectorStyles);
	styleElements.on('load', this.styleLoaded.bind(this));

	//directly add all found images
	var imageElements = $(elements).filter(this.selectorImages);
	if (imageElements.length)
		this.addImages(imageElements);

	//find elements with style attriutes with images
	var styledElements = elements.filter('*[style]').not(imageElements);
	styledElements.each(function(){
		var computedStyle = this.currentStyle || getComputedStyle(this, null);
		var url = that.getCSSBackgroundImage(computedStyle);
		if (url)
			that.addImages([this], url);
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
		if (mutation.attributeName == "src")
		{
			that.removeImages([mutation.target]);
			that.processElements([mutation.target]);
		}
	});
};

ImageFinder.prototype.start = function(elements) {
	var that = this;

	//parse all nodes currently loaded
	this.processElements($('*'));

	//parse all styles currently loaded
	$(document.styleSheets).each(function(){
		that.parseStyle(this.cssRules);
	});

	//catch future node injections
	this.mutationObserver = new MutationObserver(this.parseMutations.bind(this));
	this.mutationObserver.observe(document, {
		childList: true,
		subtree: true,
		attributes: true,
		characterData: false,
		attributeFilter: ["style", "src"]
	});
};
