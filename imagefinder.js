
function ImageFinder() {
	this.mutationObserver = null;
	this.styleMutationObserver = null;
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
	elements = $.unique($(elements));

	//remove images with changed sources
	var modifiedElements = $(this.images).filter(elements).filter(function(){
		var eurl = url || this.src || this.currentSrc;
		return $(this).attr('data-imagefilter-src') != eurl;
	});
	if (modifiedElements.length)
		this.removeImages(modifiedElements);

	//add everything not already added
	elements = elements.not(this.images);
	elements.each(function() {
		var eurl = url || this.src || this.currentSrc;
		if (!eurl)
			console.error("ImageFilter: Missing image url for " + this)
		$(this).attr('data-imagefilter-src', eurl);
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
	if (!removed.length)
		return;
	$(removed).each(function() {
		var eurl = $(this).attr('data-imagefilter-src');
		that.sources[eurl].splice(that.sources[eurl].indexOf(this), 1);
		if (that.imageRemoved)
			that.imageRemoved(this, eurl)
		if (that.sources[eurl].length == 0 && that.sourceRemoved)
		{
			delete that.sources[eurl];
			that.sourceRemoved(eurl);
		}
		$(this).removeAttr('data-imagefilter-src')
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

ImageFinder.prototype.getImageURL = function(element) {
	var url = element.src || element.currentSrc;
	if (!url)
	{
		var computedStyle = element.currentStyle || getComputedStyle(element, null);
		url = this.getCSSBackgroundImage(computedStyle);
	}
	return url;
}

//look for CSS rules with background images
ImageFinder.prototype.parseStyle = function(rules) {
	var that = this;
	$(rules).each(function(){
		var url = that.getCSSBackgroundImage(this.style);
		if (url)
		{
			//remove and add, just in case the CSS style tag was modified
			var images = $(this.selectorText);
			that.addImages(images, url);
		}
	});
};

//catch loading of stylenodes and parse all new rules
//see my post: http://stackoverflow.com/questions/20364687/mutationobserver-and-current-computed-css-styles
ImageFinder.prototype.styleLoaded = function(event) {
	if (event.target.sheet)
		this.parseStyle(event.target.sheet.cssRules);
};

//every node on the document ever created will come through this function
ImageFinder.prototype.processElements = function(elements) {
	var that = this;
	elements = $(elements);

	//catch stylesheet load events
	var styleElements = elements.filter(this.selectorStyles);
	styleElements.on('load', this.styleLoaded.bind(this));
	styleElements.filter('style').each(function(){
		that.styleMutationObserver.observe(this, that.styleMutationObserverOptions);
	});

	//directly add all found images
	var imageElements = $(elements).filter(this.selectorImages);
	if (imageElements.length)
		this.addImages(imageElements);

	//find elements with style attriutes with images
	var styledElements = elements.not(imageElements).filter('*[style]').not(imageElements);
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
		if (mutation.addedNodes.length)
			that.processElements($(mutation.addedNodes).find('*').addBack())
		if (mutation.removedNodes.length)
			that.removeImages($(mutation.removedNodes).find('*').addBack())
		if (mutation.attributeName == "style")
			that.processElements([mutation.target]);
		if (mutation.attributeName == "src")
			that.processElements([mutation.target]);

		//images applied via class names are handled by parseStyle. this handles changes to class names specifically
		if (mutation.attributeName == "class" && $(mutation.target).attr('data-imagefilter-src'))
		{
			var url = that.getImageURL(mutation.target);
			if (url)
				that.addImages([mutation.target], url);
			else
				that.removeImages([mutation.target]);
		}
	});
};

ImageFinder.prototype.parseStyleMutations = function(mutations) {
	var that = this;
	mutations.forEach(function(mutation) {
		if (mutation.target.nodeType == 3 && mutation.target.parentNode.nodeName == 'STYLE')
		{
			console.log(mutation.target.parentNode);
			if (mutation.target.parentNode.sheet)
				that.parseStyle(mutation.target.parentNode.sheet.cssRules);
		}
		else
			console.error("Shouldn't get here");
	});
};

ImageFinder.prototype.start = function(elements) {
	var that = this;

	//set up observer to catch modifications to style node contents
	this.styleMutationObserver = new MutationObserver(this.parseStyleMutations.bind(this));
	this.styleMutationObserverOptions = {
		childList: true, //would make sense as its the text node that changes, not the style
		subtree: true, //no idea why this is needed, but since styles don't really have nested children its ok
		characterData: true,
	};

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
		attributeFilter: ["style", "class", "src"]
	});
};
