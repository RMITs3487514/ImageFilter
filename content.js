
//TODO: get options loading before filters to avoid multiple updates
//TODO: I think duplicate histograms per src are being created

var customValueDelta = 0.025;

var filterer = new  FilterManager();
filterer.start();

var currentFilterChain = [];
var optionCache = {};
var filterNameCache = [];
var thisHostname = location.hostname;

var contextMenuElement = null;
window.addEventListener('contextmenu', function(e){
	contextMenuElement = e.target;
});

function zoomElement(element, ratio) {
	var e = $(element);
	var original = e.data('imagefilter-zoom');
	if (!original)
	{
		original = {w: e.width(), h: e.height(), bak: e.css(['width', 'height', 'background-size'])};
		e.data('imagefilter-zoom', original);
	}

	if (ratio == 1.0)
		e.css(original.bak);
	else
	{
		e.css('width', Math.floor(original.w * ratio) + ".px");
		e.css('height', Math.floor(original.h * ratio) + ".px");
		e.css('background-size', '100% 100%');
	}
};

function getHostname(url)
{
	var parser = document.createElement('a');
	parser.href = url;
	return parser.hostname;
}

function getFilterFallbackChain(name)
{
	var names = [];
	var next = name;
	do {
		names.push(next);
		next = optionCache['filterfallback-' + next];
	} while (next && names.indexOf(next) === -1);
	return names;
}

//builds a chain of fallback filters to update the current default
function getFilterSources(chain)
{
	return chain.map(function(name){
		return optionCache['filter-' + name];
	});
}

function setCurrentFilter(name)
{
	currentFilterChain = getFilterFallbackChain(name);
	var sources = getFilterSources(currentFilterChain);

	//extract any initial custom values from the filter
	var customValues = {};
	for (var i = 0; i < sources.length; ++i)
	{
		sources[i].replace(/V([1-3])=([0-9.]+)/g, function(m, k, v){
			if (!(k in customValues))
			{
				customValues[k] = v;
				sendOption('option-value' + k, v);
			}
		});
	}

	filterer.setFilterSources(sources);
}

function setShiftClickToggle(enable)
{
	if (enable)
	{
		$(document).on("click.shiftclicktoggle", function(e) {
			if (e.shiftKey) {
				// toggle filter on this element by creating an empty filter
				var enabled = filterer.isFiltered(e.target) && !$(e.target).data('imagefilter-disabletoggle');
				enabled = !enabled;
				$(e.target).data('imagefilter-disabletoggle', !enabled)
				filterer.applyManually(e.target, enabled ? filterer.filterSources : [""]);
				e.stopPropagation();
				return false;
			}
			return true;
		});
	}
	else
	{
		$(document).off("click.shiftclicktoggle");
	}
}

var activeShortcuts = {};
function setShortcut(name, shortcut, callback)
{
	if (name in activeShortcuts)
		Mousetrap.unbind(activeShortcuts[name]);
	if (shortcut)
	{
		shortcut = shortcut.split(" ");
		Mousetrap.bind(shortcut, function(e){callback(); e.preventDefault(); return false;});
		activeShortcuts[name] = shortcut;
	}
}

function createPopup()
{
	//TODO: add more complete options here
	var p = $('<div>' +
		'<div>V1 <input id="imagefilter-popup-v1" class="option" name="option-value1" type="range" min="0" max="1" value="0" step="0.1"></div>' +
		'<div>V2 <input id="imagefilter-popup-v2" class="option" name="option-value2" type="range" min="0" max="1" value="0" step="0.1"></div>' +
		'<div>V3 <input id="imagefilter-popup-v3" class="option" name="option-value3" type="range" min="0" max="1" value="0" step="0.1"></div>' +
		'</div>');
	p.attr('style',
		'position: absolute;' +
		'z-index: 19999999999;' +
		'color: black;' +
		'text-decoration: none !important;' +
		'font-size: 16px;' +
		'padding: 2px 4px;' +
		'background-color: white;' +
		'border: 2px solid #aaa;'
	);
	return p;
}


// the in-page options opens when clicking a filterable object.
// might be useful to control the extension from mobile devices.
var inPageOptions = null;
function enableInPageOptions(enabled)
{
	// return if unchanged
	if ((!inPageOptions) == (!enabled))
		return;

	var events = "mousedown mouseup mousemove touchstart touchend touchmove";

	// create or destroy options panel
	if (enabled)
	{
		inPageOptions = {
			popup: null,
			dragHandler: function(e){
				//TODO: adjust options with mouse drag events, or use HTML range inputs
				//console.log(e.pageX, e.pageY);
				//e.preventDefault();

				//use sendOption() to apply the result. see handleShortcut() for an example
			},
			openHandler: function(e){
				if (inPageOptions.popup)
				{
					inPageOptions.popup.remove();
					inPageOptions.popup = null;
				}
				else
				{
					inPageOptions.popup = createPopup();
					$(document.body).parent().append(inPageOptions.popup);
					var pos = $(this).offset();
					inPageOptions.popup.css({top:pos.top + $(this).height(), left:pos.left});

					//TODO: for custom sliders, capture move events
					//inPageOptions.popup.on("mousemove touchmove", inPageOptions.dragHandler);
				}
			}
		};
		$(document).on("click", "*[data-imagefilter-class]", inPageOptions.openHandler);
	}
	else
	{
		$(document).off("click", "*[data-imagefilter-class]", inPageOptions.openHandler);
		inPageOptions = null;
	}
}

function sendOption(key, value)
{
	var success = mymessages.sendBacgkround({key:key, value:value});

	//if the messaging system doesn't work just apply the option
	if (typeof chrome === 'undefined')
		applyOption(key, value);
}

function handleShortcut(key, value)
{
	if (key == 'shortcut-invert')
	{
		setShortcut(key, value, function(){
			sendOption('option-invert', !optionCache['option-invert']);
		});
		return true;
	}

	if (key == 'shortcut-onlypictures')
	{
		setShortcut(key, value, function(){
			sendOption('option-onlypictures', !optionCache['option-onlypictures']);
		});
		return true;
	}

	if (key == 'shortcut-debugpopup')
	{
		setShortcut(key, value, function(){
			sendOption('option-debugpopup', !optionCache['option-debugpopup']);
		});
		return true;
	}

	var filterShortcuts = key.match(/^shortcut-(global|site)-(enable|previous|next)$/);
	if (filterShortcuts)
	{
		setShortcut(key, value, function(){
			var sendKey = filterShortcuts[1] + '-' + (filterShortcuts[2] == 'enable' ? 'enable' : 'filter');
			var sendValue = optionCache[sendKey];
			if (filterShortcuts[2] == 'enable')
				sendValue = !sendValue;
			else
			{
				var dir = (filterShortcuts[2] == 'previous' ? -1 : 1);
				sendValue = filterNameCache[(filterNameCache.indexOf(sendValue) + dir + filterNameCache.length) % filterNameCache.length];
			}
			if (filterShortcuts[1] == 'site')
				sendKey += '-' + thisHostname;
			sendOption(sendKey, sendValue);
		});
		return true;
	}

	var customValueShortcut = key.match(/^shortcut-v([1-3])-(inc|dec)$/);
	if (customValueShortcut)
	{
		setShortcut(key, value, function(){
			var change = customValueShortcut[2] == 'inc' ? customValueDelta : -customValueDelta;
			var val = Math.max(0.0, Math.min(1.0, parseFloat(optionCache['option-value' + customValueShortcut[1]]) + change));
			sendOption('option-value' + customValueShortcut[1], val);
		});
		return true;
	}

	var filterShortcut = key.match(/^filtershortcut-(.*)$/);
	if (filterShortcut)
	{
		setShortcut(key, value, function(){
			sendOption('global-filter', filterShortcut[1]);
		});
		return true;
	}
	return false;
}

//all options come through here. not necessarily applicable or non-malicious
function applyOption(key, value)
{
	//filters out invlid options, although shouldn't be needed. needed during dev
	if (key.match(/^site-(enable|filter)$/))
		return;

	//remember the last option state
	if (value === 'null')
		delete optionCache[key];
	else
		optionCache[key] = value;

	//keep a list of currently used filters
	var filterName = key.match(/^filter-(.*)$/);
	if (filterName)
	{
		if (value === 'null')
			filterNameCache.splice(filterNameCache.indexOf(filterName[1]), 1);
		else
			filterNameCache.push(filterName[1]);

		//re-filter everything if a filter's source is updated
		if ($.inArray(filterName[1], currentFilterChain) >= 0)
		{
			if ('site-filter' in optionCache)
				sendOption('site-filter', currentFilterChain[0]);
			else
				sendOption('global-filter', currentFilterChain[0]);
		}
	}

	//listen for shortcut events and update event triggers when they change
	if (handleShortcut(key, value))
		return;

	//update custom values in filters
	var customValue = key.match(/^option-value([1-3])$/);
	if (customValue)
	{
		filterer.setCustomValue('V' + customValue[1], value);
		return;
	}

	if (key == 'option-inpageoptions')
		enableInPageOptions(value);

	if (key == 'option-shiftclicktoggle')
	{
		setShiftClickToggle(value);
		return;
	}

	
	if (key == 'option-maxwidth')
	{
		
		// set defaults if the value retrieved was empty
		if (!value)
			value = filterer.DEFAULT_MAX_WIDTH;
		
		//filterer.maxWidth = (value ? value : filterer.DEFAULT_MAX_WIDTH);
		filterer.maxWidth = value;
		filterer.updateEnabled();
		return;
	}
	
	if (key == 'option-maxheight')
	{
		
		if (!value)
			value = filterer.DEFAULT_MAX_HEIGHT;
		
		filterer.maxHeight = value;
		//filterer.maxHeight = (value ? value : filterer.DEFAULT_MAX_HEIGHT);
		filterer.updateEnabled();
		return;
	}
	
	if (key == 'option-minwidth')
	{
		
		if (!value)
			value = filterer.DEFAULT_MIN_WIDTH;
		
		filterer.minWidth = value;
		//filterer.minWidth = (value ? value : filterer.DEFAULT_MIN_WIDTH);
		filterer.updateEnabled();
		return;
	}
	
	if (key == 'option-minheight')
	{
		
		if (!value)
			value = filterer.DEFAULT_MIN_HEIGHT;
		
		filterer.minHeight = value;
		//filterer.minHeight = (value ? value : filterer.DEFAULT_MIN_HEIGHT);
		filterer.updateEnabled();
		return;
	}

	if (key == 'option-invert')
	{
		filterer.invertAll(value);
		return;
	}

	if (key == 'option-debugpopup')
	{
		 FilterManager.enableDebug = value;
		return;
	}

	if (key == 'option-onlypictures')
	{
		filterer.onlyPictures = value;
		filterer.updateEnabled();
		return;
	}

	if (key == "global-enable")
	{
		if (!("site-enable" in optionCache))
			filterer.enable(value);
		return;
	}
	else if (key == "global-filter")
	{
		if (!("site-filter" in optionCache))
			setCurrentFilter(value);
		return;
	}

	var match = key.match(/^site-(enable|filter)(-(.+))$/);
	if (match && match[2].length > 0 && thisHostname == match[3])
	{
		var option = match[1];
		//if null, the global default replaces the site-specitic override
		if (value === null)
		{
			delete optionCache["site-" + option];
			applyOption("global-" + option, optionCache["global-" + option]);
			return;
		}
		else
			optionCache["site-" + option] = value;

		if (option == "enable")
			filterer.enable(value);
		else if (option == "filter")
			setCurrentFilter(value);
	}
}

mymessages.listen(function(request) {
	if (request.contextMenuClick == 'filter')
		filterer.applyManually(contextMenuElement, getFilterSources(getFilterFallbackChain(request.name)));
	else if (request.contextMenuClick == 'clearfilter')
		filterer.applyManually(contextMenuElement, null);
	else if (request.contextMenuClick == 'zoom')
		zoomElement(contextMenuElement, request.ratio);
	else
		applyOption(request.key, request.value);
});

var onLoadCalled = false;
function onLoad()
{
	if (onLoadCalled)
		return
	onLoadCalled = true;
	mystorage.all(function(items){
		for (var key in items)
			if (key.match(/^filter.*$/))
				applyOption(key, items[key]);
		for (var key in items)
			if (!key.match(/^filter.*$/))
				applyOption(key, items[key]);
	});
}

assertDefaultsAreLoaded(onLoad);
