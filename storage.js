
var mystorage = {
	all: function(callback) {
		chrome.storage.sync.get(null, callback);
	},
	get: function(key, callback) {
		chrome.storage.sync.get(key, function(item) {
			if (key in item)
				callback(item[key]);
			else
				callback();
		});
	},
	set: function(data, callback) {
		chrome.storage.sync.set(data, callback);
	},
	remove: function(key, callback) {
		chrome.storage.sync.remove(key, callback);
	}
};
