
function ImageFilterer() {
	this.animationUpdateFrequency = 2000;

	this.finder = new ImageFinder();
	this.images = [];
	this.uidNext = 0;
	this.histograms = {};
	this.animatedHistograms = {};
	this.svgFilters = {};

	var that = this;
	this.start = this.finder.start.bind(this.finder);
	this.finder.sourceAdded = this.sourceAdded.bind(this);
	this.finder.sourceRemoved = this.sourceRemoved.bind(this);
	this.finder.imageAdded = this.imageAdded.bind(this);
	this.finder.imageRemoved = this.imageRemoved.bind(this);

	this.defaultFilter = null;
	this.filters = {};
	this.filterSources = [
		'<feComponentTransfer in="SourceGraphic" result="Current"> <feFuncR type="table" tableValues="%HR"/> <feFuncG type="table" tableValues="%HG"/> <feFuncB type="table" tableValues="%HB"/> </feComponentTransfer> <feComponentTransfer in="SourceGraphic" result="Last"> <feFuncR type="table" tableValues="%LHR"/> <feFuncG type="table" tableValues="%LHG"/> <feFuncB type="table" tableValues="%LHB"/> </feComponentTransfer> <feComposite in="Last" in2="Current" operator="arithmetic" k1="0" k2="1" k3="0" k4="0"> <animate attributeName="k2" from="1" to="0" dur="1s" /> <animate attributeName="k3" from="0" to="1" dur="1s" /> </feComposite>',
		'<feComponentTransfer in="SourceGraphic" result="A"> <feFuncR type="table" tableValues="%HR"/> <feFuncG type="table" tableValues="%HG"/> <feFuncB type="table" tableValues="%HB"/> </feComponentTransfer>',
		'<feColorMatrix in="SourceGraphic" type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/>'
	];
}

ImageFilterer.prototype.setFilterSources = function(sources) {
	this.filterSources = sources;
	this.defaultFilter.update(source);
	$(this.filters).each(function(){this.update(source);});
};

ImageFilterer.prototype.chooseFilter = function(img, histogram) {
	if (histogram.success)
	{
		if (!(histogram.id in this.filters))
			this.filters[histogram.id] = new ImageFilter(this.filterSources, histogram);
		return this.filters[histogram.id];
	}
	else
	{
		if (!this.defaultFilter)
			this.defaultFilter = new ImageFilter(this.filterSources);
		return this.defaultFilter;
	}
};

ImageFilterer.prototype.applyFilterToImage = function(images, histogram) {
	for (var i in images)
	{
		var filter = this.chooseFilter(images[i], histogram);
		$(images[i]).data('imagefilter-class', filter.styleName);

		if (!$(images[i]).data('imagefilter-haschild'))
		{
			//remove any filters applied to ancestors
			var ancestors = $(images[i]).parents();
			ancestors.each(function(){
				$(this).removeClass($(this).data('imagefilter-class'));
			});

			//don't allow future ancestors to be filtered
			ancestors.each(function(){
				$(this).data('imagefilter-haschild', ($(this).data('imagefilter-haschild') || 0) + 1);
			});

			//apply the filter and store the class name
			$(images[i]).addClass(filter.styleName);
		}
	}
};

ImageFilterer.prototype.updateFilter = function(histogram) {
	if (histogram.success)
		this.filters[histogram.id].update();
};

ImageFilterer.prototype.removeFilter = function(histogram) {
	if (histogram.success)
		this.filters[histogram.id].remove();
};

ImageFilterer.prototype.sourceAdded = function(src, firstElement) {
	if (src && firstElement.nodeName != 'VIDEO')
	{
		this.histograms[src] = new Histogram(src, firstElement, 0);
		this.histograms[src].onload = this.histogramReady.bind(this);
	}
};

ImageFilterer.prototype.sourceRemoved = function(src) {
	if (src in this.histograms)
	{
		this.removeFilter(this.histograms[src]);
		this.histograms[src].stop();
		delete this.histograms[src];
	}
};

ImageFilterer.prototype.imageAdded = function(img, url) {
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
};

ImageFilterer.prototype.imageRemoved = function(img, url) {
	if (img.nodeName == 'VIDEO')
	{
		var id = $(img).data('imagefilter-histogram-id');
		this.removeFilter(this.animatedHistograms[id]);
		this.animatedHistograms[id].stop();
		delete this.animatedHistograms[id];
	}

	var ancestors = $(img).parents();

	//remove data-imagefilter-haschild contributions
	ancestors.each(function(){
		var val = $(this).data('imagefilter-haschild');
		if (val > 1)
			$(this).data('imagefilter-haschild', val-1);
		else
			$(this).removeData('imagefilter-haschild');
	});

	//check if an ancestor can now be filtered, since this has been removed
	var next = ancestors.filter('[data-imagefilter-class]').first().not('[data-imagefilter-haschild]');
	if (next.length)
		this.imageAdded(next, next.data('imagefilter-src'));
};

ImageFilterer.prototype.histogramReady = function(histogram) {
	var images = this.finder.sources[histogram.src];
	this.applyFilterToImage(images, histogram);
};
