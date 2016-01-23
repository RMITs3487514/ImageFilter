

function ImageFilter(sources, enabled, histogram) {
	this.enabled = enabled;
	this.animatedHistogramRegex = /%([0-9]*)LH([RGBY])/g;
	this.histogramRegex = /%([0-9]*)(L?)H([RGBY])/g;
	this.sources = sources;
	this.histogram = histogram;
	this.source = this.chooseSource(this.sources);
	this.id = this.createUniqueName();
	this.styleid = this.id + '-style';
	this.styleName = this.id;
	this.update();
}

ImageFilter.prototype.getInfo = function() {
	return "Enabled: " + this.enabled + "<br/>" +
		"Fallback Index: " + this.sourceIndex + "<br/>";
}

ImageFilter.prototype.update = function(sources) {
	var that = this;
	if (sources)
		this.sources = sources;
	this.source = this.chooseSource(this.sources);

	if (this.histogram && this.histogram.success)
	{
		var lh = this.histogram.lastHistogram;
		var h = this.histogram.histogram;
		this.source = this.source.replace(this.histogramRegex, function(matches, blockSize, last, channelChar) {
			last = last.length > 0;
			var channel = "RGBY".indexOf(channelChar);
			blockSize = Math.max(1, blockSize.length ? parseFloat(blockSize) : 1);
			if (blockSize > 0 && channel >= 0)
				return that.histogram.getData(channel, that.histogram.animated && last, blockSize);
			else
				return "0 1";
		});
	}

	/*
	filterString = filterString.replace(/%\(([^\)]*V[1-3][^\)]*)\)/g, function(m, equation){
		equation = equation.replace(/V([1-3])/g, function (m, i) {return options.get("value" + i);});
		return eval(equation);
	});
	*/

	var svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="0"><filter id="' + this.id +
		'" color-interpolation-filters="sRGB">' + this.source +
		'</filter></svg>';
	var existing = $('#' + this.id);
	if (existing.length)
		existing.parent().replaceWith(svg)
	else
		$(document.body).append($(svg));

	this.enable(this.enabled);
}

ImageFilter.prototype.enable = function(enabled) {
	this.enabled = enabled;
	var filterURL = "url('#" + this.id + "')";
	var styleString = enabled ? "-webkit-filter: "+filterURL+"; -moz-filter: "+filterURL+"; -ms-filter: "+filterURL+"; -o-filter: "+filterURL+"; filter: "+filterURL+";" : "";
	var style = '<style id=' + this.styleid + '>\n.' + this.styleName + ' {' + styleString + '}\n</style>';
	var existing = $('#' + this.styleid);
	if (existing.length)
		existing.replaceWith(style)
	else
		$(document.body).append($(style));
}

ImageFilter.prototype.remove = function() {
	$('#' + this.id).remove();
};

ImageFilter.prototype.chooseSource = function(sources) {
	for (var i in sources)
	{
		this.sourceIndex = i;
		var source = sources[i];
		var requiresAnimatedHistogram = source.match(this.animatedHistogramRegex);
		var requiresHistogram = source.match(this.histogramRegex);
		if (requiresHistogram && (!this.histogram || !this.histogram.success))
			continue;
		if (requiresAnimatedHistogram && !this.histogram.animated)
			continue;
		break;
	}
	return source;
}

ImageFilter.prototype.createUniqueName = function() {
	if (typeof ImageFilter.prototype.createUniqueName.nextID == 'undefined') {
		ImageFilter.prototype.createUniqueName.nextID = 0;
	}
	var name = '';
	if (this.histogram)
	{
		var e = this.histogram.element;
		if (e)
			name = e.nodeName + '-';
		if (this.histogram.src)
	 		name += this.histogram.src.match("[^/]+$")[0].replace(/[^A-Za-z0-9_\-]+/g, "");
		else if (e && e.id && e.id.length)
			name += e.id;
		else if (e && e.className && e.className.length)
			name += e.className;
		else
			name += 'unknown';
	}
	else
		name += 'default';
	if (name.length > 32)
		name = name.substring(0,32);
	return 'imagefilter' + (ImageFilter.prototype.createUniqueName.nextID++) + '-' + name;
}
