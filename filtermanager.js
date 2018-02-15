
//FIXME: bug when changing image source of a parent node filtered after removing a child
//TODO: pause histogram generaiton when disabled
//TODO: clean up filters when they're not needed
//TODO: faster isPicture choice with css?: https://stackoverflow.com/questions/2481414/how-do-i-select-a-div-with-class-a-but-not-with-class-b

function FilterManager() {
	this.animationUpdateFrequency = 1000;
	//this.golayMeritThreshold = 0.08;

	this.finder = new ImageFinder();
	this.images = [];
	this.uidNext = 0;
	this.histograms = {};
	this.animatedHistograms = {};
	this.svgFilters = {};
	this.onlyPictures = true;
	this.inverted = true;

	this.DEFAULT_MIN_WIDTH = 128;
	this.DEFAULT_MIN_HEIGHT = 128;
	this.DEFAULT_MAX_WIDTH = 999999;
	this.DEFAULT_MAX_HEIGHT = 999999;
		
	this.minWidth = this.DEFAULT_MIN_WIDTH;
	this.minHeight = this.DEFAULT_MIN_HEIGHT;


	this.customValueCache = {V1:0.5, V2:0.5, V3:0.5};

	var that = this;
	this.start = this.finder.start.bind(this.finder);
	this.finder.sourceAdded = this.sourceAdded.bind(this);
	this.finder.sourceRemoved = this.sourceRemoved.bind(this);
	this.finder.imageAdded = this.imageAdded.bind(this);
	this.finder.imageRemoved = this.imageRemoved.bind(this);

	this.nextOverrideID = 0;
	this.defaultFilter = null;
	this.filters = {};
	this.filterOverrides = {};
	this.filterSources = [
		'<feComponentTransfer in="SourceGraphic" result="Current"><feFuncR type="table" tableValues="%HR"/> <feFuncG type="table" tableValues="%HG"/> <feFuncB type="table" tableValues="%HB"/></feComponentTransfer>'
		+ '<feComponentTransfer in="SourceGraphic" result="Last"><feFuncR type="table" tableValues="%LHR"/> <feFuncG type="table" tableValues="%LHG"/> <feFuncB type="table" tableValues="%LHB"/> </feComponentTransfer>'
		+ '<feComposite in="Last" in2="Current" operator="arithmetic" k1="0" k2="1" k3="0" k4="0"> <animate attributeName="k2" from="1" to="0" dur="1s" /> <animate attributeName="k3" from="0" to="1" dur="1s" /> </feComposite>'
		,
		'<feComponentTransfer in="SourceGraphic" result="A"> <feFuncR type="table" tableValues="%HR"/> <feFuncG type="table" tableValues="%HG"/> <feFuncB type="table" tableValues="%HB"/> </feComponentTransfer>'
		,
		'<feColorMatrix in="SourceGraphic" type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/>'
	];
	
	//this.useHistogram = true; // determines if a histogram should be generated during the filtering process
	this.filterBinaryImages = false;
}

//an element to put debug info into the document
 FilterManager.debugInfo = null;
 FilterManager.enableDebug = false;

 FilterManager.prototype.isPicture = function(image, histogram) {
	var w = $(image).width();
	var h = $(image).height();
	
	// can be adjusted to increase or decrease the number of images accepted
	var peakAreaLimit = 0.3;
	if (w * h < this.minWidth * this.minHeight){
		return false;
	}	if (histogram.success)
	{

	
		// same as above
		var peakArea = histogram.getPeakArea(0.02);
		
		
		if (peakArea >= peakAreaLimit){
			return false;
		}
	}

	return true;
};

 FilterManager.prototype.invertAll = function(enabled) {

	this.inverted = enabled;
	if (this.defaultFilter)
		this.defaultFilter.invert(enabled);
	for (var k in this.filters)
		this.filters[k].invert(enabled);
	for (var k in this.filterOverrides)
		this.filterOverrides[k].invert(enabled);
};

 FilterManager.prototype.updateEnabled = function() {

	//update filter class for every image currently being filtered
	for (var i = 0; i < this.images.length; ++i)
	{
		var image = $(this.images[i]);

		//don't filter images with filtered children
		if (image.data('imagefilter-haschild'))
			continue;

		var filteredClass = image.attr('data-imagefilter-class');
		var url = image.attr('data-imagefilter-src');
		//if (image.nodeName == 'VIDEO') //not a video, so don't need to check
		//	histogram = this.animatedHistograms[image.data('imagefilter-histogram-id')];
		//else
		histogram = this.histograms[url];
		var apply = this.shouldFilter(image, histogram);
		image.toggleClass(filteredClass, apply);
	}
};

 FilterManager.prototype.setCustomValue = function(key, value) {
	
	
	this.customValueCache[key] = value;
	if (this.defaultFilter){
		this.defaultFilter.setCustomValue(key, value);
	}
	for (var k in this.filters){
		this.filters[k].setCustomValue(key, value);
	}
	for (var k in this.filterOverrides){
		this.filterOverrides[k].setCustomValue(key, value);
	}
	
	
};

 FilterManager.prototype.setFilterSources = function(sources) {
	debugger;
	 
	this.filterSources = sources;
	if (this.defaultFilter)
		this.defaultFilter.update(sources);
	for (var key in this.filters)
		this.filters[key].update(sources);
};

 FilterManager.prototype.enable = function(enabled) {
	this.enabled = enabled;
	if (this.defaultFilter)
		this.defaultFilter.enable(enabled);
	for (var key in this.filters)
		this.filters[key].enable(enabled);
};

 FilterManager.prototype.chooseFilter = function(img, histogram) {
	if (histogram && histogram.success)
	{
		if (!(histogram.id in this.filters))
			this.filters[histogram.id] = new ImageFilter(this.filterSources, this.enabled, this.customValueCache, this.inverted, histogram);
		return this.filters[histogram.id];
	}
	else
	{
		if (!this.defaultFilter)
			this.defaultFilter = new ImageFilter(this.filterSources, this.enabled, this.customValueCache, this.inverted);
		return this.defaultFilter;
	}
};

 FilterManager.prototype.findHistogram = function(image) {
	var url = $(image).attr('data-imagefilter-src');
	if ($(image)[0].nodeName == 'VIDEO')
		return this.animatedHistograms[$(image).data('imagefilter-histogram-id')];
	else
		return this.histograms[url];
}

// checks if an image is filtered
FilterManager.prototype.isFiltered = function(image) {
	var image = $(image);
	if (!image.attr('data-imagefilter-class')) {
		return null;
	}
	return image.hasClass(image.attr('data-imagefilter-class'));
};

//override a filter already applied to an image
 FilterManager.prototype.applyManually = function(image, sources) {
	var image = $(image);
	if (!$.inArray(image, this.images))
	{
		console.log('Cannot apply filter, image ' + image + " hasn\'t been added yet.");
		return;
	}

	var histogram = this.findHistogram(image);

	var filterID = image.data('imagefilter-override');
	
	if (filterID)
	{
		filter = this.filterOverrides[filterID];
		filter.release();
		delete this.filterOverrides[filterID];
	}
	else
	{
		filterID = this.nextOverrideID++;
		image.data('imagefilter-override', filterID);
	}

	//remove old css class
	image.removeClass(image.attr('data-imagefilter-class'));

	if (sources === null)
	{
		image.removeData('imagefilter-override');
		this.applyFilterToImage([image], histogram);
	}
	else
	{
		var filter = new ImageFilter(sources, true, this.customValueCache, this.inverted, histogram);
		this.filterOverrides[filterID] = filter;

		//add the new one
		image.addClass(filter.styleName);

		//store the class name as a backup
		image.attr('data-imagefilter-class', filter.styleName);
	}
};

FilterManager.prototype.shouldFilter = function(image, histogram) {
	
	
	
	// less than zero check
	if ((this.minWidth < 0 && this.minHeight < 0)){
		return false;
	}
	
	// width check
	if ($(image).width() < this.minWidth){
		return false;
	}
	
	// height check
	if ($(image).height() < this.minHeight) {
		return false;
	}
	
	//always filter video
	if (image.nodeName == 'VIDEO') {
		return true;
	}

	//handle the only-filter-pictures option
	if (this.onlyPictures && !this.isPicture(image, histogram)) {
		return false;
	}

	return true;
};

// applies a filter to an image
FilterManager.prototype.applyFilterToImage = function(images, histogram) {
	var filteredImages = [];

	for (var i = 0; i < images.length; ++i)
	{
		var apply = true;
		if ($(images[i]).data('imagefilter-haschild'))
			apply = false;
		if (apply)
		{
			var filter = this.chooseFilter(images[i], histogram);

			var ancestors = $(images[i]).parents();
			ancestors.each(function(){
				//remove any filters applied to ancestors
				var filtered = $(this).attr('data-imagefilter-class');
				if (filtered){
					$(this).removeClass(filtered);
				}
				//don't allow future filtering of ancestors
				$(this).data('imagefilter-haschild', ($(this).data('imagefilter-haschild') || 0) + 1);
			});

			if (this.shouldFilter(images[i], histogram)){
				$(images[i]).addClass(filter.styleName);
			}
			//store the class name as a backup, even if it wasn't applied
			$(images[i]).attr('data-imagefilter-class', filter.styleName);

			//NOTE: not used
			//apply the global class to mass allow filtering everything
			//$(images[i]).addClass('imagefilter-all');

			filteredImages.push(images[i]);
		}
	}
	$.merge(this.images, filteredImages);
};

 FilterManager.prototype.updateFilter = function(histogram) {
	if (histogram.success)
	{
		this.filters[histogram.id].update();

		//update the debug histogram if it exists
		if ( FilterManager.debugInfo &&  FilterManager.debugInfo.data('imagefilter-src') == histogram.src)
		{
			 FilterManager.debugInfo.find('#imagefilter-histogram').replaceWith($(histogram.createGraph()).attr('id', 'imagefilter-histogram').css('border', '1px solid black'));
			 FilterManager.debugInfo.find('#imagefilter-filterinfo').html(this.filters[histogram.id].getInfo());
		}
	}
};

 FilterManager.prototype.removeFilter = function(histogram) {
	if (histogram.success)
		this.filters[histogram.id].remove();
};

 FilterManager.prototype.sourceAdded = function(src, firstElement) {
	 debugger;
	
	if (src && firstElement.nodeName != 'VIDEO')
		{
			//console.log("Added " + src);
			this.histograms[src] = new Histogram(src, firstElement, 0);
			this.histograms[src].onload = this.histogramReady.bind(this);
			this.histograms[src].onerror = this.histogramReady.bind(this);
		}
};	

 FilterManager.prototype.sourceRemoved = function(src) {
	if (src in this.histograms)
	{
		//console.log("Removed " + src);
		this.removeFilter(this.histograms[src]);
		this.histograms[src].stop();
		delete this.histograms[src];
	}
};

 FilterManager.prototype.imageAdded = function(img, url) {
	 debugger;
	if (img.nodeName == 'VIDEO')
	{
		var id = this.uidNext++;
		$(img).data('imagefilter-histogram-id', id);
		this.animatedHistograms[id] = new Histogram(url, img, this.animationUpdateFrequency);
		this.animatedHistograms[id].onload = this.histogramReady.bind(this);
		this.animatedHistograms[id].onupdate = this.updateFilter.bind(this);
	}
	else
	{
		if (url in this.histograms && this.histograms[url].ready)
			this.applyFilterToImage([img], this.histograms[url]);
	}

	var that = this;
	
	// this part works to display the debug overlay
	$(img).on('mouseover', function(e){
		e.stopPropagation();

		if (! FilterManager.enableDebug)
			return;

		//shouldn't need  FilterManager.debugInfo.id == 'imagefilter-debug' but something weird is making it point to random elements
		if ( FilterManager.debugInfo &&  FilterManager.debugInfo.data('imagefilter-stay'))
		{
			if ( FilterManager.debugInfo.attr('id') == 'imagefilter-debug')
				return;
			else
				debugger;
		}
		if ( FilterManager.timeout)
			window.clearTimeout( FilterManager.timeout);
		 FilterManager.timeout = window.setTimeout(function(){
			$( FilterManager.debugInfo).css('pointer-events', 'auto').css('opacity', '1').data('imagefilter-stay', true)
		}, 2000);
		if ( FilterManager.debugInfo)
			 FilterManager.debugInfo.remove();
		 FilterManager.debugInfo = $('<div id="imagefilter-debug" style="opacity: 0.5; pointer-events: none; z-index: 19999999999; position:fixed; top:0px; left:0px; right:0px; background: white; font-size: 14px; border-bottom: 2px solid black; word-wrap: normal; width: auto;" data-imagefilter-haschild="1"></div>');
		 
		// remove the overlay upon clicking
		$(document.body).append( FilterManager.debugInfo);
		 FilterManager.debugInfo.on('click', function(){
			 FilterManager.debugInfo.remove();
			 FilterManager.debugInfo = null;
		});

		var histogram;
		if (this.nodeName == 'VIDEO')
			histogram = that.animatedHistograms[$(this).data('imagefilter-histogram-id')];
		else
			histogram = that.histograms[url];

		var info = $('<div><div style="background:rgba(255,255,255,0.5); white-space: nowrap;">URL: <a href="' + url + '">' + url + '</a></div></div></div></div>');
		 FilterManager.debugInfo.append(info);

		if (histogram)
		{
			
			 FilterManager.debugInfo.data('imagefilter-src', histogram.src);
			if (histogram.success)
			{
				// actually draw the graph
				FilterManager.debugInfo.append($(histogram.createGraph()).attr('id', 'imagefilter-histogram').css('border', '1px solid black'));
				info.css('position', 'absolute');
				
			}
		}

		if (url && this.nodeName != 'VIDEO')
			 FilterManager.debugInfo.append($('<img data-imagefilter-haschild="1" style="border:1px solid black; max-height: 128px;" alt="debugimg" src="' + url + '"/>'));

		var textInfo = $('<div style="display: inline-block" id="imagefilter-info"><div id="imagefilter-filterinfo"></div></div>');
		 FilterManager.debugInfo.append(textInfo);
		if (this.nodeName != 'VIDEO')
		{
			// show debug overlay content
			var filteredClass = $(this).attr('data-imagefilter-class');
			textInfo.prepend('<div>Class Applied: ' + $(this).hasClass(filteredClass) + '</div>');
			textInfo.prepend('<div>Child Counter: ' + $(this).data('imagefilter-haschild') + '</div>');
			textInfo.prepend($('<div>Histogram status: '+histogram.status+'</div>'));
			textInfo.prepend($('<div>filtermanager useHistogram status: ' + that.useHistogram+'</div>'));
			if (histogram.id in that.filters){
				textInfo.find('#imagefilter-filterinfo').html(that.filters[histogram.id].getInfo());
			}

			
		}

	}).on('mouseout', function(){
		if ( FilterManager.debugInfo && ! FilterManager.debugInfo.data('imagefilter-stay'))
		{
			 FilterManager.debugInfo.remove();
			 FilterManager.debugInfo = null;
		}
		if (typeof  FilterManager.timeout !== 'undefined')
		{
			window.clearTimeout( FilterManager.timeout);
			 FilterManager.timeout = null;
		}
	});
};

 FilterManager.prototype.imageRemoved = function(img, url, removedFrom) {
	if (img.nodeName == 'VIDEO')
	{
		var id = $(img).data('imagefilter-histogram-id');
		this.removeFilter(this.animatedHistograms[id]);
		this.animatedHistograms[id].stop();
		delete this.animatedHistograms[id];
	}

	//remove css class that applies the filter
	$(img).removeClass($(img).attr('data-imagefilter-class'));
	$(img).removeAttr('data-imagefilter-class');

	//remove image from list of filtered images if it exists
	var index = $.inArray(img, this.images);
	if (index)
		this.images.splice(index, 1);

	var ancestors = $(removedFrom).parents().addBack();

	//remove data-imagefilter-haschild contributions
	ancestors.each(function(){
		var val = $(this).data('imagefilter-haschild');
		if (val > 1)
			$(this).data('imagefilter-haschild', val-1);
		else
			$(this).removeData('imagefilter-haschild');
	});

	//check if an ancestor can now be filtered, since this has been removed
	//FIXME: not sure if this works as it's jquery data
	var next = $(removedFrom).closest('[data-imagefilter-class]');
	if (next.length && !next.data('imagefilter-haschild'))
	{
		var histogram = this.findHistogram(next);
		this.applyFilterToImage(next, histogram);
	}
};

 FilterManager.prototype.histogramReady = function(histogram) {
	var images = this.finder.sources[histogram.src];
	this.applyFilterToImage(images, histogram);
};
