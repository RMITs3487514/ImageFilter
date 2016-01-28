
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
	mystorage.set = function(data, callback) {chrome.storage.sync.set(data, callback);};
	mystorage.remove = function(data, callback) {chrome.storage.sync.remove(data, callback);};
}
else
{
	var self = self || addon;
	mystorage.lastID = 0;
	mystorage.replycallbacks = {};
	self.port.on('storage-reply', function(reply){
		mystorage.replycallbacks[reply.id](reply.data);
		delete mystorage.replycallbacks[reply.id];
	});

	//mystorage.ss = require("sdk/simple-storage");

	mystorage.all = function(callback) {
		var id = mystorage.lastID++;
		mystorage.replycallbacks[id] = callback;
		self.port.emit('storage', {get:null, id:id});
		//callback(mystorage.ss.storage);
	};
	mystorage.get = function(key, callback) {
		var id = mystorage.lastID++;
		mystorage.replycallbacks[id] = function(reply){
			callback(reply[key]);
		};
		self.port.emit('storage', {get:key, id:id});
		/*
		mystorage.replycallback
		if (key in mystorage.ss.storage)
			callback(mystorage.ss.storage[key]);
		else
			callback();
		*/
	};
	mystorage.set = function (data, callback) {
		var id = mystorage.lastID++;
		mystorage.replycallbacks[id] = callback;
		self.port.emit('storage', {set:data, id:id});
		/*
		for (var k in data)
			mystorage.ss.storage[k] = data[k];
		callback();
		*/
	};
	mystorage.remove = function (key, callback) {
		var id = mystorage.lastID++;
		mystorage.replycallbacks[id] = callback;
		self.port.emit('storage', {remove:key, id:id});
		/*
		if (key instanceof Array)
		{
			for (var k in key)
				delete mystorage.ss.storage[k];
		}
		else
			delete mystorage.ss.storage[key];
		callback();
		*/
	};
}
