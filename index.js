var self = require("sdk/self");
var tabs = require("sdk/tabs");
var panels = require("sdk/panel");
var buttons = require("sdk/ui/button/action");
var pageWorker = require("sdk/page-worker");
var pageMod = require("sdk/page-mod");
var storage = require("sdk/simple-storage").storage;

//get real options from chrome's manifest
var manifest = require('manifest.json');

var stupidStorageHandler = function(request) {
	if ('get' in request)
	{
		var r = {};
		if (request.get === null)
			r = storage;
		else if (request.get instanceof Array)
		{
			for (var k in request.get)
				r[k] = storage[k];
		}
		else
			r[request.get] = storage[request.get];
		this.port.emit('storage', r);
	}
	else if ('set' in request)
	{
		for (var k in request.set)
			storage[k] = request.set[k];
		this.port.emit('storage', {done: true});
	}
	else if ('remove' in request)
	{
		for (var k in request.set)
			delete storage[k];
		this.port.emit('storage', {done: true});
	}
};

var url = function(path) {
	return self.data.url('../' + path); //this is retarded. I hate ff!
};

var popup = panels.Panel({
	contentURL: url(manifest.browser_action.default_popup)
});
popup.port.on('storage', stupidStorageHandler.bind(popup));

var popupButton = buttons.ActionButton({
	id: "show-popup",
	label: manifest.browser_action.default_title,
	icon: {
	"16": url("icon16.png"),
	"32": url("icon32.png"),
	"64": url("icon64.png")
	},
	onClick: function(){
		tabs.open(url(manifest.browser_action.default_popup));
		//popup.contentURL = 'about:blank';
		//popup.contentURL = url(manifest.browser_action.default_popup);
		//popup.show();
	}
});

var background = pageWorker.Page({
	//contentURL: "http://en.wikipedia.org/wiki/Internet",
	contentScript: manifest.background.scripts.map(url)
});
background.port.on('storage', stupidStorageHandler.bind(popup));

var contentScript = pageMod.PageMod({
	include: manifest.content_scripts[0].matches,
	contentScriptFile: manifest.content_scripts[0].js.map(url),
	onAttach: function(worker) {
		worker.port.on('storage', stupidStorageHandler.bind(worker));
	}
});
