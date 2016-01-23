
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

$(function(){
	$('#newfilter').click(function(){
		findUniqueFilterName("NewFilter", function(name){
			createFilter(name, "", "", "");
		});
	});

	mystorage.all(function(items){
		for (var key in items)
		{
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
});
