
//TODO: dynamically disable context menu when it's not applicable. the API is terrible
//TODO: handle filter addition and removal

var filterList = chrome.contextMenus.create({title: 'Filter', contexts: ['all']});
var filterListNames = {};
var zoomList = chrome.contextMenus.create({title: 'Zoom', contexts: ['all']});
var zoomSizes = {};

function contextMenuFilter(info, tab) {
	var name = filterListNames[info.menuItemId];
	chrome.tabs.sendMessage(tab.id, {contextMenuClick: 'filter', name: name});
}

function contextMenuDoubleSize(info, tab) {
	ratio = zoomSizes[info.menuItemId];
	chrome.tabs.sendMessage(tab.id, {contextMenuClick: 'zoom', ratio: ratio});
}

function createFilterMenuItem(name)
{
	var id = chrome.contextMenus.create({title: name, parentId: filterList, contexts: ['all'], onclick: contextMenuFilter});
	filterListNames[id] = name;
}

function createZoomSize(ratio)
{
	var id = chrome.contextMenus.create({title: ratio + '×', parentId: zoomList, contexts: ['all'], onclick: contextMenuDoubleSize});;
	zoomSizes[id] = ratio;
}

createZoomSize(1);
createZoomSize(2);
createZoomSize(4);

mystorage.all(function(items){
	for (var key in items)
	{
		var match = key.match(/^filter-(.*)$/);
		if (match)
			createFilterMenuItem(match[1]);
	}
});

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
