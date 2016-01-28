
var defaultOptions = {
	"filter-Equilize":"<feComponentTransfer in=\"SourceGraphic\" result=\"A\">\n\t<feFuncR type=\"table\" tableValues=\"%HR\"/>\n\t<feFuncG type=\"table\" tableValues=\"%HG\"/>\n\t<feFuncB type=\"table\" tableValues=\"%HB\"/>\n</feComponentTransfer>",
	"filter-EquilizeVideo":"<feComponentTransfer in=\"SourceGraphic\" result=\"Current\">\n\t<feFuncR type=\"table\" tableValues=\"%HR\"/>\n\t<feFuncG type=\"table\" tableValues=\"%HG\"/>\n\t<feFuncB type=\"table\" tableValues=\"%HB\"/>\n</feComponentTransfer>\n<feComponentTransfer in=\"SourceGraphic\" result=\"Last\">\n\t<feFuncR type=\"table\" tableValues=\"%LHR\"/>\n\t<feFuncG type=\"table\" tableValues=\"%LHG\"/>\n\t<feFuncB type=\"table\" tableValues=\"%LHB\"/>\n</feComponentTransfer>\n<feComposite in=\"Last\" in2=\"Current\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"0\" k4=\"0\">\n\t<animate attributeName=\"k2\" from=\"1\" to=\"0\" dur=\"1s\" />\n\t<animate attributeName=\"k3\" from=\"0\" to=\"1\" dur=\"1s\" />\n</feComposite>",
	"filter-Invert":"<feColorMatrix in=\"SourceGraphic\" type=\"matrix\" values=\"-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0\"/>",
	"filterfallback-Equilize":"Invert",
	"filterfallback-EquilizeVideo":"Equilize",
	"filterfallback-Invert":"",
	"filtershortcut-Equilize":"",
	"filtershortcut-EquilizeVideo":"",
	"filtershortcut-Invert":"",
	"global-enable":true,
	"global-filter":"EquilizeVideo",
	"option-onlypictures":true,
	"option-debugpopup":true
}

function assertDefaultsAreLoaded(callback)
{
	mystorage.get('hasdefaults', function(value){
		if (value)
			callback();
		else
		{
			defaultOptions['hasdefaults'] = true;
			mystorage.set(defaultOptions, callback);
		}
	});
}
