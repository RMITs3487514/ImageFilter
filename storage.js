
var mystorage = {};

(function(){
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
		mystorage.clear = function(callback) {chrome.storage.sync.clear(callback);};
	}
	else
	{
		//var self = self || addon;
		mystorage.lastID = 0;
		mystorage.replycallbacks = {};

		function onreceive(reply){
			mystorage.replycallbacks[reply.id](reply.data);
			delete mystorage.replycallbacks[reply.id];
		}

		function send(message){
			if (self.port)
				self.port.emit('storage', message);
			else
				console.error("Cannot send messages");
		}

		if (self.port)
			self.port.on('storage-reply', onreceive);

		else
			console.error("Cannot receive messages");

		//mystorage.ss = require("sdk/simple-storage");

		mystorage.all = function(callback) {
			var id = mystorage.lastID++;
			mystorage.replycallbacks[id] = callback;
			send({get:null, id:id});
			//callback(mystorage.ss.storage);
		};
		mystorage.get = function(key, callback) {
			var id = mystorage.lastID++;
			mystorage.replycallbacks[id] = function(reply){
				callback(reply[key]);
			};
			send({get:key, id:id});
	
		};
		mystorage.set = function (data, callback) {
			var id = mystorage.lastID++;
			mystorage.replycallbacks[id] = callback;
			send({set:data, id:id});
	
		};
		mystorage.remove = function (key, callback) {
			var id = mystorage.lastID++;
			mystorage.replycallbacks[id] = callback;
			send({remove:key, id:id});
	
		};
		mystorage.clear = function(callback) {
			console.error("Clearing storage not implemented");
		};
	}
})();
