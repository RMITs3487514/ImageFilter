
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
	console.log(names);
	return sources;
}

function setCurrentFilter(name)
{
	var sources = getFilterSources(name);
	filterer.setFilterSources(sources);
}

//all options come through here. not necessarily applicable or non-malicious
function applyOption(key, value)
{
	if (value === 'null')
		delete optionCache[key];
	else
		optionCache[key] = value;

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

	var match = key.match(/^site-(enable|filter)-?(.*)$/);
	if (match && match[2].length > 0 && thisHostname == match[2])
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
