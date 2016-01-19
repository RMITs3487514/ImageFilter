
var filterer = new ImageFilterer();
filterer.start();

var thisTab = null;
var optionCache = {};
var thisHostname = null;

function getHostname(url)
{
	var parser = document.createElement('a');
	return parser.hostname;
}

//builds a chain of fallback filters to update the current default
function getFilterSources(name)
{
	var sources = [];
	var next = name;
	do {
		sources.push(optionCache['filter-' + name]);
		next = optionCache['filter-fallback-' + name];
	} while (next);
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

	function applySiteOption(option, value) {
		//if null, the global default replaces the site-specitic override
		if (value === null)
		{
			delete optionCache["site-" + option];
			applyOption("global-" + option, optionCacne["global-" + option]);
			return;
		}
		else
			optionCache["site-" + option] = value;

		if (option == "enable")
			filterer.enable(value);
		else if (option == "filter")
			setCurrentFilter(value);
	}

	var match = key.match(/^site-(enable|filter)-?(.*)$/);
	if (match && match[2].length === 0)
	{
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			//if this is the same site as the active tab, apply the option
			if (thisHostname == getHostname(tabs[0].url))
				applySiteOption(match[0], value);

			//if this is the active tab, we're in charge of saving the option
			if (thisTab.id == tabs[0].id)
			{
				if (value !== null)
					localStorage.setItem(key + '-' + thisHostname, value);
				else
					localStorage.removeItem(key);
			}
		});
		return;
	}
	else if (match && match[2].length > 0 && thisHostname == match[2])
			applySiteOption(match[1], value);
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
	for (var i = 0; i < localStorage.length; i++){
		var key = localStorage.key(i);
		var value = localStorage.getItem(key);
		applyOption(key, value);
	}
}

chrome.tabs.getCurrent(function(tab){
	thisTab = tab;
});
