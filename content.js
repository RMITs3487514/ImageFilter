
//TODO: get options loading before filters to avoid multiple updates
//TODO: I think duplicate histograms per src are being created

var customValueDelta = 0.025;

var filterer = new ImageFilterer();
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

	if (key == 'option-invert')
	{
		filterer.invertAll(value);
		return;
	}

	if (key == 'option-debugpopup')
	{
		ImageFilterer.enableDebug = value;
		return;
	}

	if (key == 'option-onlypictures')
	{
		filterer.setOnlyPictures(value);
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
