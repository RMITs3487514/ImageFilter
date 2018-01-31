
//TODO: handle filter removal

var activeURL = null;
var activeHostname = null;

//helper function to catch events given a selector (avoid pulling in jquery)
function ev(selector, event, handler)
{
	var elements = document.querySelectorAll(selector);
	for (var i = 0; i < elements.length; ++i)
		elements[i].addEventListener(event, handler);
}

function getHostname(url)
{
	var parser = document.createElement('a');
	parser.href = url;
	return parser.hostname;
}

function parseSiteKey(key)
{
	var match = key.match(/^site-(enable|filter)(-(.+))?$/);
	if (match)
	{
		if (activeHostname == match[3])
			return "site-" + match[1];
		else
			return null;
	}
	return key;
}

function applyOption(key, value)
{
	debugger;
	key = parseSiteKey(key)
	if (!key)
		return;

	var filter = key.match(/^filter-(.*)$/);
	
	if (filter)
	{
		
		var lists = document.querySelectorAll('.filterlist');
		for (var i = 0; i < lists.length; ++i)
		{
			var e = document.createElement('option');
			e.text = filter[1];
			e.value = filter[1];
			lists[i].appendChild(e);
		}
		//debugger;
		//console.log(lists);
		return;
	}
	
	 filter = key.match(/^global-filter$/);
	if (filter)
	{
		/* for (var i = 1; i <= 3; i++){
			option_key = "option-value" + i;
			zglobal_key = "zglobal-value" + i;
			var data = {};
			data[option_key] = 0.5;
			data[zglobal_key] = 0.5
			mystorage.set(data); 
		} */
		
		/* document.getElementById("v1").contentWindow.location.reload(true);
		document.getElementById("v2").contentWindow.location.reload(true);
		document.getElementById("v3").contentWindow.location.reload(true); */
	} 
	//debugger;
	
	
	// may have to put this when the program loads immediately
	/* if (key.match(/^global-value[0-9]{1}$/)){
		var new_name = "option-value" + key.substr(-1);
		if (new_name.match(/^option-value[0-9]{1}$/)){
			var e = document.querySelector('*[name="' + new_name + '"]');
			chrome.storage.sync.set({new_name: 0.2});
		}
	} 
	 */
	
	var e = document.querySelector('*[name="' + key + '"]');
	if (e)
	{
		if (e.type == 'checkbox'){
			e.checked = value;
		}
		else {
			e.value = value;
			//var new_value;
			
		}	
		if (key.match(/^site-/))
		{
			if (value === null)
				e.parentNode.className = e.parentNode.className.replace(/\b.override\b/,'');
			else if (e.parentNode.className.indexOf('override') === -1)
				e.parentNode.className += ' override';
		}
	}
	
	// activated when the popup loads for the first time
	// takes the zglobal-values and applies them to the normal option-value process
	// z is to ensure that zglobal-values are interpreted last in the set
	 if (key.match(/^zglobal-value[0-9]{1}$/)){
		console.log("key: " + key + ", value: " + value);
		var new_key = "option-value" + key.substr(-1);
		if (new_key.match(/^option-value[0-9]{1}$/)){
			var e = document.querySelector('*[name="' + new_key + '"]');
			 e.value = value;
 			var data = {};
			data[new_key] = value;
			mystorage.set(data); 
			//sendOption(new_key, value);
			var data2 = {key:new_key, value:value};
			mymessages.sendTabs(data2);  
			
		} 
	}
}

function sendOption(key, value)
{

	if (key.match(/^site-.*$/))
		key = key + "-" + activeHostname;
	
	mylogger.log('popup sets ' + key + '=' + value + ' - ' + encodeURI(activeURL));
	console.log("popup key: " + key + " value: " + value);
	//saving the option
	if (value !== null)
	{
		var data = {};
		data[key] = value;
		mystorage.set(data);
	}
	else{
		mystorage.remove(key);
	}
	//send to all tabs
	var data = {key:key, value:value};
	mymessages.sendTabs(data);

	//finally, make sure the option page is displaying the right thing
	//console.log("key: " + key + " value: " + value);
	applyOption(key, value);
}

mymessages.listen(function(request){
	//var re = /^[a-z-]+$/;
	var re = /^[a-z-]+[0-9]*$/;
	//debugger;
	if (re.test(request.key))
		applyOption(request.key, request.value);
});

document.addEventListener('DOMContentLoaded', function(){
	
	ev('.option', 'change', function(event){
		var e = event.target;
		//debugger;
		if (e.type === 'checkbox'){
			console.log ("e.name: " + e.name + " e.checked: " + e.checked);
			sendOption(e.name, e.checked);
		}
		else if (e.type === 'range'){
			var name = e.name;
			
			//stores the option-values in a global version so that it can remain between pages and reloads
			console.log ("e.name: " + e.name + " e.value: " + e.value);
			 if ((e.name).match(/^option-value[0-9]{1}$/)){
				var new_key = "zglobal-value" + (e.name).substr(-1);
				if (new_key.match(/^zglobal-value[0-9]{1}$/)){
					var data = {};
					data[new_key] = e.value;
					mystorage.set(data);
				}
			}  
			
			sendOption(e.name, e.value);
		}
		else{
			//debugger;
			console.log ("e.name: " + e.name + " e.value: " + e.value);
			sendOption(e.name, e.value);
		}
	});
	ev('#clear-overrides', 'click', function(e){
		var elements = document.querySelectorAll("#site-specific input, #site-specific select");
		for (var i = 0; i < elements.length; ++i){
			sendOption(elements[i].name, null);
		}
		console.log("ELEMENTS: " + elements);
		
		
	});
	ev('#open-options', 'click', function(e){
		openOptions();
		e.preventDefault();
		return false;
	});
});
	

function onLoad()
{
	getActiveTabURL(function(url) {
		activeURL = url;
		activeHostname = getHostname(url);
		
		
		
		mystorage.all(function(items){
			//console.log("BEFORE mystorage.all activates: ");
			debugger;
			for (var key in items){
				if (key.match(/^filter.*$/)){
					applyOption(key, items[key]);
				}
			}
			var selects = document.getElementsByTagName('select');
			for (var i = 0; i < selects.length; ++i){
				selects[i].selectedIndex = -1;
			}
			for (var key in items){
				if (!key.match(/^filter.*$/)){
					applyOption(key, items[key]);
				}
			}
		});
		
		
		
	});
	

	
	
}
 window.onload = onLoad; 
