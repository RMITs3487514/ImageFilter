
var mylogger = {
	log: function(message){
		chrome.storage.sync.get('option-usagelog', function(result){
			//don't log anything if the options isn't enabled
			if (!result['option-usagelog'])
				return;

			//get a unique ID for this browser
			chrome.storage.local.get('id', function(result){
				if (!result['id'])
				{
					//'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
					result['id'] = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
						var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
						return v.toString(16);
					});
					chrome.storage.local.set(result)
				}
				var id = result['id'];

				function pad(n, width, z) {
					z = z || '0';
					n = n + '';
					return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
				}

				//build a timestamp
				date = new Date();
				time = date.getFullYear() + "/" + pad(1+date.getMonth(),2) + "/" + pad(date.getDate(),2) + ' ' + pad(date.getHours(),2) + ":" + pad(date.getMinutes(),2) + ":" + pad(date.getSeconds(),2);

				//append a log entry
				chrome.storage.sync.get('log-' + id, function(result){
					list = result['log-' + id] || [];
					list.push(time + ": " + message);
					result['log-' + id] = list;
					chrome.storage.sync.set(result);
				});
			});
		});
		//this is disgusting. so much nesting for asynchronous access :(
	}
};
