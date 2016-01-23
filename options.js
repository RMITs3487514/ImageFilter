
var filterKeys = ['filter-', 'filtershortcut-', 'filterfallback-'];

function camelize(str) {
	return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
		return letter.toUpperCase();
	}).replace(/\s+/g, '');
}

//most retarded recursive funciton I've ever written, thanks to async storage
function findUniqueFilterName(name, callback, uniqueBit)
{
	var uniqueBit = uniqueBit || '';
	mystorage.get('filter-' + name + uniqueBit, function(value){
		if (value)
			findUniqueFilterName(name, callback, uniqueBit * 1 + 1);
		else
			callback(name + uniqueBit);
	});
}

function saveFilter(filter)
{
	var nameInput = filter.find('.filter-name');
	var savedName = nameInput.attr('data-saved-name');
	var newName = nameInput.val();

	function saveData(name)
	{
		var data = {};
		data['filter-' + name] = filter.find('.filter-source').val();
		data['filterfallback-' + name] = filter.find('.filter-fallback').val();
		data['filtershortcut-' + name] = filter.find('.filter-shortcut').val();
		mystorage.set(data);
	}

	if (savedName != newName)
	{
		newName = camelize(newName);
		findUniqueFilterName(newName, function(uniqueName){
			if (uniqueName)
			{
				deleteFilter(savedName);
				saveData(uniqueName);
				nameInput.attr('data-saved-name', uniqueName);
				nameInput.val(uniqueName);
			}
			else
			{
				saveData(savedName);
				nameInput.val(savedName);
				alert("Cannot rename filter to " + newName + ", it conflicts with another filter.");
			}
		});
	}
	else
		saveData(savedName);
}

function deleteFilter(name)
{
	var toRemove = []
	for (var i = 0; i < filterKeys.length; ++i)
		toRemove.push(filterKeys[i] + name);
	mystorage.remove(toRemove);
}

function createFilter(name, source, fallback, shortcut)
{
	var filter = $($('#filter-template').html());
	$('#filters').append(filter);
	filter.find('.filter-name').val(name).attr('data-saved-name', name);
	filter.find('.deletefilter').click(function(){
		var name = filter.find('.filter-name').attr('data-saved-name');
		if (confirm("Deleting " + name + ". Are you sure?")) {
			deleteFilter(name);
			filter.remove();
		}
	});
	filter.find('.savefilter').click(function(){
		saveFilter(filter);
	});
	filter.find('.filter-source').val(source);
	filter.find('.filter-fallback').val(fallback);
	filter.find('.filter-shortcut').val(shortcut);
}

function loadOptions(){
	mystorage.all(function(items){
		for (var key in items)
		{
			if (key.match(/^[a-z-]+$/))
			{
				var option = $('input[name="' + key + '"]');
				if (option.length == 1)
				{
					if (option[0].type == 'checkbox')
						option[0].checked = items[key];
					else
						option[0].value = items[key];
					continue;
				}
			}

			var filter = key.match(/^filter-(.*)$/);
			if (filter)
			{
				createFilter(
					filter[1],
					items[key],
					items['filterfallback-' + filter[1]],
					items['filtershortcut-' + filter[1]]
				);
			}
		}
	});
}

$(function(){
	$('#newfilter').click(function(){
		findUniqueFilterName("NewFilter", function(name){
			createFilter(name, "", "", "");
		});
	});

	$('.option').on('change', function(event){
		var value = this.type == 'checkbox' ? this.checked : this.value;
		var data = {};
		data[this.name] = value;
		mystorage.set(data);
		var message = {key:this.name, value:value};
		chrome.tabs.query({}, function(tabs) {
			for (var i=0; i < tabs.length; ++i)
				chrome.tabs.sendMessage(tabs[i].id, message);
		});
	});

	mystorage.get('hasdefaults', function(value){
		if (value)
			loadOptions();
		else
		{
			defaultOptions['hasdefaults'] = true;
			mystorage.set(defaultOptions, loadOptions);
		}
	});
});
