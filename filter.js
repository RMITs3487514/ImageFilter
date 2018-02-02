
//FIXME: video filters are being added with the same id

function ImageFilter(sources, enabled, initialCustomValues, inverted, histogram) {
	this.enabled = enabled;
	this.animatedHistogramRegex = /%([0-9]*)LH([RGBY])/g;
	this.histogramRegex = /%([0-9]*)(L?)H([RGBY])/g;
	this.variableRegex = /\{\{([^\}]*V[1-3][^\}]*)\}\}/g;
	this.requiresAnimatedHistogram = false;
	this.requiresHistogram = false;
	this.requiresVariables = false;
	this.sources = sources;
	this.histogram = histogram;
	this.inverted = inverted;
	this.source = this.chooseSource(this.sources);
	this.prevId = "";
	this.prevId = this.id;
	this.id = this.createUniqueName();
	this.idNum;
	this.styleid = this.id + '-style';
	this.styleName = this.id;
	this.customValue = {}; //e.g. {V1: 0.8, V2: 0.2}
	for (var k in initialCustomValues)
		this.customValue[k] = initialCustomValues[k];
	this.update();
}

ImageFilter.prototype.release = function() {
	console.log("Haven't implemented ImageFilter.release()");
};

ImageFilter.prototype.invert = function(enable) {
	if (this.inverted != enable)
	{
		this.inverted = enable;
		this.update();
	}
}

ImageFilter.prototype.setCustomValue = function(key, value) {
	//debugger;
	if (!(key in this.customValue) || this.customValue[key] !== value)
	{
		
		/* if (key.match(/^V[0-9]{1}$/)){
			var new_name = "zglobal-value" + key.substr(-1);
			if (new_name.match(/^zglobal-value[0-9]{1}$/)){
				chrome.storage.sync.get(new_name, function (result) {
					value = result[new_name];
				});
			}

		}   */
		
		this.customValue[key] = value;

		//update if variables are used
		if (this.requiresVariables){
			this.update();
		}
		
		
	}
}

ImageFilter.prototype.getInfo = function() {
	return "Enabled: " + this.enabled + "<br/>" +
		"Fallback Index: " + this.sourceIndex + "<br/>";
}

// seems to occur at the start of a page load
ImageFilter.prototype.update = function(sources) {
	debugger;
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
		this.source = this.source.replace(this.variableRegex, function(m, equation){
			equation = equation.replace(/(V[1-3])/g, function (m, i) {return that.customValue[i];});
			return eval(equation);
		});
	}

	/*
	filterString = filterString.replace(/%\(([^\)]*V[1-3][^\)]*)\)/g, function(m, equation){
		equation = equation.replace(/V([1-3])/g, function (m, i) {return options.get("value" + i);});
		return eval(equation);
	});
	*/

	var invertSource = this.inverted ? '\n<feColorMatrix type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/>\n' : '';

	var svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="0"><filter id="' + this.id +
		'" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">' + this.source + invertSource +
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
	//debugger;
	var styleTagPrefix = "imagefilter";
	
	var styleString = "";
	var originalImageName = (this.id).split("-").pop();
	var lastStyleElementForImage = $("style[id*='" + originalImageName + "']").last();
	var lastStyleElementText = lastStyleElementForImage.text();

	// firefox only
	// regards a bug that happens when an image isn't inverted and it's shift-clicked on a few times, making the image and its background images disappear
	if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1){
		
		// if the image hasn't been inverted
		if (!this.inverted){
			
			styleString = enabled ? "-moz-filter: "+filterURL+"; -webkit-filter: "+filterURL+"; -ms-filter: "+filterURL+"; -o-filter: "+filterURL+"; filter: "+filterURL+";" : "";
				
			/* if (lastStyleElementText.includes("-moz-filter")){
				styleString = "";
			}   */
			
			// if there is no source, make the style string empty to prevent the image from disappearing upon shift-clicking
			if (this.source.length == 0){
				styleString = "";
			} 
		}
		else {
			styleString = enabled ? "-moz-filter: "+filterURL+"; -webkit-filter: "+filterURL+"; -ms-filter: "+filterURL+"; -o-filter: "+filterURL+"; filter: "+filterURL+";" : "";
		}
	}
	else {
		styleString = enabled ? "-webkit-filter: "+filterURL+"; -moz-filter: "+filterURL+"; -ms-filter: "+filterURL+"; -o-filter: "+filterURL+"; filter: "+filterURL+";" : "";
	}
	//console.log(styleString);
	//debugger;

	
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
		this.requiresAnimatedHistogram = source.match(this.animatedHistogramRegex);
		this.requiresHistogram = source.match(this.histogramRegex);
		this.requiresVariables = source.match(this.variableRegex);
		if (this.requiresHistogram && (!this.histogram || !this.histogram.success))
			continue;
		if (this.requiresAnimatedHistogram && !this.histogram.animated)
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
	//console.log("The Unique Name ID is : " + ImageFilter.prototype.createUniqueName.nextID);
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
	this.idNum = ImageFilter.prototype.createUniqueName.nextID;
	//console.log("The next Unique Name ID is : " + (ImageFilter.prototype.createUniqueName.nextID + 1));
	return 'imagefilter' + (ImageFilter.prototype.createUniqueName.nextID++) + '-' + name;
}
