
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	
	//content scripts can't update filters. security risk?
	if (request.key.match(/^filter.*$/))
		return;

	//save the option
	var data = {};
	data[request.key] = request.value;
	mystorage.set(data, function(){
		//broadcast to all pages
		chrome.tabs.query({}, function(tabs) {
			for (var i=0; i < tabs.length; ++i)
				chrome.tabs.sendMessage(tabs[i].id, request);
		});
	});
});
