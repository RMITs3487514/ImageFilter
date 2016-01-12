
function ImageFilterer() {
	this.animationUpdateFrequency = 3000;

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
	this.filterSources = ['<feColorMatrix in="SourceGraphic" type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/>'];
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

ImageFilterer.prototype.applyFilter = function(images, histogram) {
	for (var i in images)
	{
		var filter = this.chooseFilter(images[i], histogram);
		$(images[i]).addClass(filter.styleName);
	}
};

ImageFilterer.prototype.updateFilter = function(histogram) {
	this.filters[histogram.id].update();
};

ImageFilterer.prototype.removeFilter = function(histogram) {
	if (histogram.success)
	{
		this.filters[histogram.id].remove();
	}
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
			this.applyFilter([img], this.histograms[url]);
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
};

ImageFilterer.prototype.histogramReady = function(histogram) {
	var images = this.finder.sources[histogram.src];
	this.applyFilter(images, histogram);
};
