function ev(selector, event, handler)
{
	var elements = document.querySelectorAll(selector);
	for (var i = 0; i < elements.length; ++i)
		elements[i].addEventListener(event, handler);
}
document.addEventListener('DOMContentLoaded', function(){
	ev('.option', 'change', function(event){
		var e = event.target;
	});
	ev('#clear-overrides', 'click', function(){
	});
	ev('#open-options', 'click', function(){
		//PLATFORM-SPECIFIC
		chrome.runtime.openOptionsPage();
		console.log(chrome.runtime.lastError);
	});
});
