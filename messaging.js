var mymessages = {}

if (typeof chrome !== 'undefined')
{
	mymessages.sendBacgkround = chrome.runtime.sendMessage;
	mymessages.sendTabs = function(message){
		chrome.tabs.query({}, function(tabs) {
			for (var i=0; i < tabs.length; ++i)
				chrome.tabs.sendMessage(tabs[i].id, message);
		});
	};
	mymessages.listen = function(callback){
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			callback(request);
		});
	};
}
else
{
	var self = self || addon;
	mymessages.sendBacgkround = function (message) {
		self.port.emit('mymessage', message);
	};
	mymessages.sendTabs = function(message){
		//lol no. so not implementing that
		//https://stackoverflow.com/questions/17778772/how-to-implement-chrome-extension-s-chrome-tabs-sendmessage-api-in-firefox-addo
	};
	mymessages.listen = function(callback){
		self.port.on('mymessage', callback);
	};
}
