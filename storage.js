
var mystorage = {}

if (typeof chrome !== 'undefined')
{
	mystorage.all = function(callback) {chrome.storage.sync.get(null, callback);};
	mystorage.get = function(key, callback) {
		chrome.storage.sync.get(key, function(item) {
			if (key in item)
				callback(item[key]);
			else
				callback();
		});
	};
	mystorage.set = chrome.storage.sync.set;
	mystorage.remove = chrome.storage.sync.remove;
}
else
{
	mystorage.all = function(callback) {callback(mystorage.ss.storage);};
	mystorage.get = function(key, callback) {
		if (key in mystorage.ss.storage)
			callback(mystorage.ss.storage[key]);
		else
			callback();
	};
	mystorage.set = function (data, callback) {
		for (var k in data)
			mystorage.ss.storage[k] = data[k];
		callback();
	};
	mystorage.remove = function (key, callback) {
		if (key instanceof Array)
		{
			for (var k in key)
				delete mystorage.ss.storage[k];
		}
		else
			delete mystorage.ss.storage[key];
		callback();
	};
}
