
//helper function to catch events given a selector (avoid pulling in jquery)
function ev(selector, event, handler)
{
	var elements = document.querySelectorAll(selector);
	for (var i = 0; i < elements.length; ++i)
		elements[i].addEventListener(event, handler);
}

function sendOption(key, value)
{
	chrome.runtime.sendMessage({key:key, value:value});
}

function applyOption(key, value)
{
	var e = document.querySelector('*[name="' + key + '"]');
	if (e.type == 'checkbox')
		e.checked = value;
	else
		e.value = value;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	var re = /^[a-z-]+$/;
	if (re.test(request.key))
		applyOption(request.key, request.value);
});

document.addEventListener('DOMContentLoaded', function(){
	ev('.option', 'change', function(event){
		var e = event.target;
		if (e.type === 'checkbox')
			sendOption(e.name, e.checked);
		else
			sendOption(e.name, e.value);
	});
	ev('#clear-overrides', 'click', function(e){
		var elements = document.querySelectorAll("#site-specific input, #site-specific select");
		for (var i = 0; i < elements.length; ++i)
			sendOption(elements[i].name, null);
	});
	ev('#open-options', 'click', function(e){
		//PLATFORM-SPECIFIC
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

		e.preventDefault();
		return false;
	});
});

for (var i = 0; i < localStorage.length; i++){
	var key = localStorage.key(i);
	e = document.querySelector('*[name="' + key + '"]');
	if (e)
	{
		var value = localStorage.getItem(key);
		applyOption(key, value);
	}
}
