

function getActiveTabURL(callback)
{
	if (typeof chrome !== 'undefined')
	{
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			callback(tabs[0].url);
		});
	}
	else
	{
		//firefox
		callback(tabs.activeTab.url);
	}
}

function openOptions()
{
	if (typeof chrome !== 'undefined')
	{
		//yay chrome :D
		if (typeof chrome.runtime.openOptionsPage == 'function')
		{
			chrome.runtime.openOptionsPage();
			console.log(chrome.runtime.lastError);
		}
		else
		{
			var optionsUrl = chrome.extension.getURL('options.html');
			chrome.tabs.query({url: optionsUrl}, function(tabs) {
				if (tabs.length) {
					chrome.tabs.update(tabs[0].id, {active: true});
				} else {
					chrome.tabs.create({url: optionsUrl});
				}
			});
		}
	}
	else
	{
		console.error("1");
		//firefox... :(
		//FIXME: hard coded, but don't have access to require() so wahtever
		window.open('resource://imagefilter/options.html', '_newtab');
		//tabs.open('resource://imagefilter/options.html');
	}
}
