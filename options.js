

//FIXME: replace filter on delete

var filterKeys = ['filter-', 'filtershortcut-', 'filterfallback-'];
var shortcutNone = '[none]';

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
		var shortcut = filter.find('.filter-shortcut').val();
		if (shortcut == shortcutNone)
			shortcut = null;
		var data = {};
		data['filter-' + name] = filter.find('.filter-source').val();
		data['filterfallback-' + name] = filter.find('.filter-fallback').val();
		data['filtershortcut-' + name] = shortcut;
		mystorage.set(data);
		mylogger.log('saved filter source for "' + name + '"');
		for (var k in data)
			mymessages.sendTabs({key:k, value:data[k]});
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
	shortcut = shortcut || shortcutNone;
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
	var sourceLen = (source.match(/\n/g)||[]).length + 3;
	filter.find('.filter-source').val(source).attr('rows', Math.min(Math.max(sourceLen, 6), 30));
	filter.find('.filter-fallback').val(fallback);
	filter.find('.filter-shortcut').val(shortcut);
}

function loadOptions(){
	mystorage.all(function(items){
		for (var key in items)
		{
			if (key.match(/^[a-z-0-9]+$/))
			{
				var option = $('input[name="' + key + '"]');
				if (option.length == 1)
				{
					var val = items[key];
					if (option.hasClass('shortcut') && !val)
						val = shortcutNone;
					if (option[0].type == 'checkbox')
						option[0].checked = val;
					else
						option[0].value = val;
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

			var log = key.match(/^log-(.*)$/);
			if (log)
			{
				var list = items[key];
				for (var i in list)
				{
					$('#logs').append('<li>' + log[1] + ': ' + list[i] + '<br/></li>');
				}
			}
		}
	});
}

//https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

$(function(){
	$('#logs').hide();
	$('#show-logs').click(function(){
		$(this).hide();
		$('#logs').show();
	});

	$('#export').click(function(){
		mystorage.all(function(items){
			download('imagefilter_options.json', JSON.stringify(items,null,2));
		});
	});

	$('#downloadlog').click(function(){
		var logs = $('#logs');
		logs = logs[0].innerText || logs[0].textContent;
		download('imagefilter_log.txt', logs);
	});

	$('#importfile').on('change', function(){
		if (!this.files.length)
			return;
		var file = this.files[0];
		fr = new FileReader();
		fr.onload = function(){
			var options = JSON.parse(fr.result);
			mystorage.set(options);
			mylogger.log('imported ' + options.length + ' options from file');
			for (var key in options)
			{
				mymessages.sendTabs({key:key, value:options[key]});
			}
		};
		fr.readAsText(file);
	});

	$('#import').click(function(){
		$('#importfile').trigger('click');
	});

	$('#clearoptions').click(function(){
		if (confirm("This will remove all options, including custom filters, and restore the defaults. Are you sure?"))
		mystorage.clear(function(){
			location.reload();
		});
	});

	$('#newfilter').click(function(){
		findUniqueFilterName("NewFilter", function(name){
			createFilter(name, "", "", "");
		});
	});

	$('.option').on('change', function(event){
		var value = this.type == 'checkbox' ? this.checked : this.value;
		if (value == shortcutNone) //handle shortcut "none"
			value = null;
		var data = {};
		data[this.name] = value;
		console.log(this.name, value);
		mystorage.set(data);
		mylogger.log('options sets ' + this.name + '=' + value);
		mymessages.sendTabs({key:this.name, value:value});
	});

	$(document).on("click", ".shortcut", function() {
		var button = $(this);
		button.addClass('recording');
		Mousetrap.record({partialCallback:function(sequence){
			//partial sequence
			button.val(sequence.join(' '));
		}},	function(sequence) {
			//final sequence

			//FIXME: stupid hack because of broken library
			if (sequence.indexOf('shift') >= 0)
			{
				sequence.splice(sequence.indexOf('shift'), 1);
				sequence.unshift('shift');
			}
			if (sequence.indexOf('alt') >= 0)
			{
				sequence.splice(sequence.indexOf('alt'), 1);
				sequence.unshift('alt');
			}
			if (sequence.indexOf('ctrl') >= 0)
			{
				sequence.splice(sequence.indexOf('ctrl'), 1);
				sequence.unshift('ctrl');
			}

			var str = sequence.join(' ');
			if (!str || str == 'del' || str == 'esc')
				str = shortcutNone;
			button.val(str);
			button.removeClass('recording');
			button.trigger('change');
		});
	});
	$(".shortcut").val(shortcutNone);

	assertDefaultsAreLoaded(loadOptions);
});
