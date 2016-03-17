
//TODO: dynamically disable context menu when it's not applicable. the API is terrible
//TODO: handle filter addition and removal

mymessages.listen(function(request, sender){
	//content scripts can't update filters. security risk?
	if (request.key.match(/^filter.*$/))
		return;

	if (sender)
	{
		mylogger.log('shortcut sets ' + request.key + '=' + request.value + ' - ' + encodeURI(sender.tab.url));
	}

	//save the option
	var data = {};
	data[request.key] = request.value;
	mystorage.set(data, function(){
		//broadcast to all pages
		mymessages.sendTabs(request);
	});
});

if (typeof chrome !== 'undefined')
{
	//FIXME: need to clear all menus first in case of background script reload
	var filterList = chrome.contextMenus.create({title: 'Override Filter', contexts: ['all']});
	var filterListNames = {};
	var zoomList = chrome.contextMenus.create({title: 'Zoom', contexts: ['all']});
	var zoomSizes = {};

	function contextMenuFilter(info, tab) {
		var name = filterListNames[info.menuItemId];
		chrome.tabs.sendMessage(tab.id, {contextMenuClick: 'filter', name: name});
	}

	function contextMenuZoom(info, tab) {
		ratio = zoomSizes[info.menuItemId];
		chrome.tabs.sendMessage(tab.id, {contextMenuClick: 'zoom', ratio: ratio});
	}

	function contextMenuClearFilter(info, tab) {
		chrome.tabs.sendMessage(tab.id, {contextMenuClick: 'clearfilter'});
	}

	function createFilterMenuItem(name)
	{
		var id = chrome.contextMenus.create({title: name, parentId: filterList, contexts: ['all'], onclick: contextMenuFilter});
		filterListNames[id] = name;
	}

	function createZoomSize(ratio)
	{
		var id = chrome.contextMenus.create({title: ratio + '×', parentId: zoomList, contexts: ['all'], onclick: contextMenuZoom});;
		zoomSizes[id] = ratio;
	}

	createZoomSize(1);
	createZoomSize(2);
	createZoomSize(4);

	var clearFilter = chrome.contextMenus.create({title: 'Clear Override', contexts: ['all'], onclick: contextMenuClearFilter});

	mystorage.all(function(items){
		for (var key in items)
		{
			var match = key.match(/^filter-(.*)$/);
			if (match)
				createFilterMenuItem(match[1]);
		}
	});
}
else
{
	//firefox
	//nah
}
