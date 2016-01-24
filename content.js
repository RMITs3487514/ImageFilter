
//TODO: get options loading before filters to avoid multiple updates

var filterer = new ImageFilterer();
filterer.start();

var optionCache = {};
var thisHostname = location.hostname;

function getHostname(url)
{
	var parser = document.createElement('a');
	parser.href = url;
	return parser.hostname;
}

//builds a chain of fallback filters to update the current default
function getFilterSources(name)
{
	var sources = [];
	var names = [];
	var next = name;
	do {
		names.push(next);
		sources.push(optionCache['filter-' + next]);
		next = optionCache['filterfallback-' + next];
	} while (next && names.indexOf(next) === -1);
	return sources;
}

function setCurrentFilter(name)
{
	var sources = getFilterSources(name);
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
	chrome.runtime.sendMessage({key:key, value:value});
}

//all options come through here. not necessarily applicable or non-malicious
function applyOption(key, value)
{
	if (value === 'null')
		delete optionCache[key];
	else
		optionCache[key] = value;

	if (key == 'shortcut-site-enable') setShortcut(key, value, function(){
		sendOption('site-enable' + thisHostname, !optionCache['site-enable' + thisHostname]);
	});
	else if (key == 'shortcut-global-enable') setShortcut(key, value, function(){
		sendOption('global-enable', !optionCache['global-enable']);
	});

	var customValueShortcut = key.match(/^shortcut-v([1-3])-(inc|dec)$/);
	if (customValueShortcut)
	{
		setShortcut(key, value, function(){
			var change = customValueShortcut[2] == 'inc' ? 0.1 : -0.1;
			var val = Math.max(0.0, Math.min(1.0, parseFloat(optionCache['option-value' + customValueShortcut[1]]) + change));
			sendOption('option-value' + customValueShortcut[1], val);
		});
	}

	var customValue = key.match(/^option-value([1-3])$/);
	if (customValue)
		filterer.setCustomValue('V' + customValue[1], value);

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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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

onLoad();
