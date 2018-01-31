
var defaultOptions = {
	"filter-EquilizeLum":"<feComponentTransfer>\n<feFuncR type=\"table\" tableValues=\"%16HY\"/>\n<feFuncG type=\"table\" tableValues=\"%16HY\"/>\n<feFuncB type=\"table\" tableValues=\"%16HY\"/>\n</feComponentTransfer>",
	"filter-EquilizeRGB":"<feComponentTransfer>\n<feFuncR type=\"table\" tableValues=\"%HR\"/>\n<feFuncG type=\"table\" tableValues=\"%HG\"/>\n<feFuncB type=\"table\" tableValues=\"%HB\"/>\n</feComponentTransfer>",
	"filter-EquilizeRGBThreshold":"<!-- V2=0.5 -->\n<feComponentTransfer result=\"A\">\n<feFuncR type=\"table\" tableValues=\"%HR\"/>\n<feFuncG type=\"table\" tableValues=\"%HG\"/>\n<feFuncB type=\"table\" tableValues=\"%HB\"/>\n</feComponentTransfer>\n<feComponentTransfer in=\"A\">\n  <feFuncR type=\"linear\" slope=\"999\" intercept=\"{{-999*(1-V2)}}\"/>\n  <feFuncG type=\"linear\" slope=\"999\" intercept=\"{{-999*(1-V2)}}\"/>\n  <feFuncB type=\"linear\" slope=\"999\" intercept=\"{{-999*(1-V2)}}\"/>\n</feComponentTransfer>",
	"filter-EquilizeVideoLum":"<feComponentTransfer in=\"SourceGraphic\" result=\"Current\">\n\t<feFuncR type=\"table\" tableValues=\"%16HY\"/>\n\t<feFuncG type=\"table\" tableValues=\"%16HY\"/>\n\t<feFuncB type=\"table\" tableValues=\"%16HY\"/>\n</feComponentTransfer>\n<feComponentTransfer in=\"SourceGraphic\" result=\"Last\">\n\t<feFuncR type=\"table\" tableValues=\"%16LHY\"/>\n\t<feFuncG type=\"table\" tableValues=\"%16LHY\"/>\n\t<feFuncB type=\"table\" tableValues=\"%16LHY\"/>\n</feComponentTransfer>\n<feComposite in=\"Last\" in2=\"Current\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"0\" k4=\"0\">\n\t<animate attributeName=\"k2\" from=\"1\" to=\"0\" dur=\"1s\" />\n\t<animate attributeName=\"k3\" from=\"0\" to=\"1\" dur=\"1s\" />\n</feComposite>",
	"filter-Invert":"<feColorMatrix type=\"matrix\" values=\"-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0\"/>",
	"filter-BrightnessContrastGamma":"<!-- V1=0.5 V2=0.5 V3=0.5 -->\n<feComponentTransfer>\n<feFuncB type=\"gamma\" amplitude=\"1\" exponent=\"{{V3*2}}\" offset=\"0\"/>\n<feFuncR type=\"gamma\" amplitude=\"1\" exponent=\"{{V3*2}}\" offset=\"0\"/>\n<feFuncG type=\"gamma\" amplitude=\"1\" exponent=\"{{V3*2}}\" offset=\"0\"/>\n</feComponentTransfer>\n\n<feComponentTransfer>\n  <feFuncR type=\"linear\" slope=\"{{V1*4-1}}\" intercept=\"{{-0.5 * (V1*4-1) + 0.5}}\"/>\n  <feFuncG type=\"linear\" slope=\"{{V1*4-1}}\" intercept=\"{{-0.5 * (V1*4-1) + 0.5}}\"/>\n  <feFuncB type=\"linear\" slope=\"{{V1*4-1}}\" intercept=\"{{-0.5 * (V1*4-1) + 0.5}}\"/>\n</feComponentTransfer>\n\n<feComponentTransfer>\n <feFuncR type=\"linear\" slope=\"{{V2*2}}\"/>\n <feFuncG type=\"linear\" slope=\"{{V2*2}}\"/>\n <feFuncB type=\"linear\" slope=\"{{V2*2}}\"/>\n</feComponentTransfer>\n",
	"filter-Cartoon": "\n<!-- Edge detection -->\n<feGaussianBlur in=\"SourceGraphic\" result=\"Blur\" stdDeviation=\"3\" edgeMode=\"duplicate\" />\n<feComposite operator=\"arithmetic\" k2=\"2\" k3=\"-1\" in=\"SourceGraphic\" in2=\"Blur\" result=\"Unsharp\" />\n<feColorMatrix type=\"matrix\" in=\"Unsharp\" result=\"RA\" values=\"0 0 0 0 1\n      0 0 0 0 1\n      0 0 0 0 1\n      1 0 0 0 0\"></feColorMatrix>\n<feColorMatrix type=\"matrix\" in=\"Unsharp\" result=\"GA\" values=\"0 0 0 0 1\n      0 0 0 0 1\n      0 0 0 0 1\n      0 1 0 0 0\"></feColorMatrix>\n<feColorMatrix type=\"matrix\" in=\"Unsharp\" result=\"BA\" values=\"0 0 0 0 1\n      0 0 0 0 1\n      0 0 0 0 1\n      0 0 1 0 0\"></feColorMatrix>\n<feDiffuseLighting in=\"RA\" result=\"EdgesR\" surfaceScale=\"4\">\n  <feDistantLight elevation=\"90\"></feDistantLight>\n</feDiffuseLighting>\n<feDiffuseLighting in=\"GA\" result=\"EdgesG\" surfaceScale=\"4\">\n  <feDistantLight elevation=\"90\"></feDistantLight>\n</feDiffuseLighting>\n<feDiffuseLighting in=\"BA\" result=\"EdgesB\" surfaceScale=\"4\">\n  <feDistantLight elevation=\"90\"></feDistantLight>\n</feDiffuseLighting>\n<feColorMatrix in=\"EdgesR\" result=\"EdgesRI\" type=\"matrix\" values=\"-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0\"/>\n<feColorMatrix in=\"EdgesG\" result=\"EdgesGI\" type=\"matrix\" values=\"-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0\"/>\n<feColorMatrix in=\"EdgesB\" result=\"EdgesBI\" type=\"matrix\" values=\"-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0\"/>\n<feComposite operator=\"arithmetic\" k2=\"1\" k3=\"1\" in=\"EdgesRI\" in2=\"EdgesGI\" result=\"EdgesRGI\" />\n<feComposite operator=\"arithmetic\" k2=\"1\" k3=\"1\" in=\"EdgesRGI\" in2=\"EdgesBI\" result=\"EdgesRGBI\" />\n<feComponentTransfer in=\"EdgesRGBI\" result=\"EdgesConstrast\">\n  <feFuncR type=\"linear\" slope=\"8\" intercept=\"-3\"/>\n  <feFuncG type=\"linear\" slope=\"8\" intercept=\"-3\"/>\n  <feFuncB type=\"linear\" slope=\"8\" intercept=\"-3\"/>\n</feComponentTransfer>\n<feColorMatrix in=\"EdgesConstrast\" result=\"Edges\" type=\"luminanceToAlpha\" />\n\n<!-- cell shading -->\n<feColorMatrix type=\"matrix\" in=\"SourceGraphic\" result=\"Luminance\" values=\"\n   0.3 0.58 0.12 0 0\n   0.3 0.58 0.12 0 0\n   0.3 0.58 0.12 0 0\n   0 0 0 1 0\"></feColorMatrix>\n<feComponentTransfer in=\"Luminance\" result=\"LuminanceCell\">\n<feFuncR type=\"discrete\" tableValues=\"0.3 0.5 0.7 0.8 0.9 1\"/>\n<feFuncG type=\"discrete\" tableValues=\"0.3 0.5 0.7 0.8 0.9 1\"/>\n<feFuncB type=\"discrete\" tableValues=\"0.3 0.5 0.7 0.8 0.9 1\"/>\n</feComponentTransfer>\n\n<!-- full luminance -->\n<feComponentTransfer in=\"SourceGraphic\" result=\"Gamma\">\n<feFuncB type=\"gamma\" amplitude=\"1\" exponent=\"0.6\" offset=\"0\"/>\n<feFuncR type=\"gamma\" amplitude=\"1\" exponent=\"0.6\" offset=\"0\"/>\n<feFuncG type=\"gamma\" amplitude=\"1\" exponent=\"0.6\" offset=\"0\"/>\n</feComponentTransfer>\n<feColorMatrix in=\"Gamma\" result=\"GammaSaturation\" type=\"saturate\" values=\"1.4\" />\n\n<!-- luminance cell shading applied to colour -->\n<feComposite in=\"LuminanceCell\" in2=\"GammaSaturation\" operator=\"arithmetic\" k1=\"1\" result=\"Cell\"/>\n\n<!-- edges over cell shading -->\n<feComposite in=\"Edges\" in2=\"Cell\" operator=\"over\" result=\"comp\"/>\n",
	"filter-Sobel":"<feColorMatrix type=\"matrix\" in=\"SourceGraphic\" result=\"RA\" values=\"0 0 0 0 1\n      0 0 0 0 1\n      0 0 0 0 1\n      1 0 0 0 0\"></feColorMatrix>\n<feColorMatrix type=\"matrix\" in=\"SourceGraphic\" result=\"GA\" values=\"0 0 0 0 1\n      0 0 0 0 1\n      0 0 0 0 1\n      0 1 0 0 0\"></feColorMatrix>\n<feColorMatrix type=\"matrix\" in=\"SourceGraphic\" result=\"BA\" values=\"0 0 0 0 1\n      0 0 0 0 1\n      0 0 0 0 1\n      0 0 1 0 0\"></feColorMatrix>\n<feDiffuseLighting in=\"RA\" result=\"R\" surfaceScale=\"8.0\">\n  <feDistantLight elevation=\"90\"></feDistantLight>\n</feDiffuseLighting>\n<feDiffuseLighting in=\"GA\" result=\"G\" surfaceScale=\"8.0\">\n  <feDistantLight elevation=\"90\"></feDistantLight>\n</feDiffuseLighting>\n<feDiffuseLighting in=\"BA\" result=\"B\" surfaceScale=\"8.0\">\n  <feDistantLight elevation=\"90\"></feDistantLight>\n</feDiffuseLighting>\n<feColorMatrix type=\"matrix\" in=\"R\" result=\"RS\" values=\"-1 0 0 0 1\n      0 0 0 0 0\n      0 0 0 0 0\n      0 0 0 0 1\"></feColorMatrix>\n<feColorMatrix type=\"matrix\" in=\"G\" result=\"GS\" values=\"0 0 0 0 0\n      0 -1 0 0 1\n      0 0 0 0 0\n      0 0 0 0 1\"></feColorMatrix>\n<feColorMatrix type=\"matrix\" in=\"B\" result=\"BS\" values=\"0 0 0 0 0\n      0 0 0 0 0\n      0 0 -1 0 1\n      0 0 0 0 1\"></feColorMatrix>\n<feComposite in=\"RS\" in2=\"GS\" result=\"RSGS\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"1\" k4=\"0\"></feComposite>\n<feComposite in=\"RSGS\" in2=\"BS\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"1\" k4=\"0\"></feComposite>",
	"filter-Threshold":"<feComponentTransfer>\n  <feFuncR type=\"linear\" slope=\"999\" intercept=\"{{-999*(1-V2)}}\"/>\n  <feFuncG type=\"linear\" slope=\"999\" intercept=\"{{-999*(1-V2)}}\"/>\n  <feFuncB type=\"linear\" slope=\"999\" intercept=\"{{-999*(1-V2)}}\"/>\n</feComponentTransfer>",
	"filter-Unsharp": "<feGaussianBlur in=\"SourceGraphic\" result=\"BigBlur\" stdDeviation=\"13\" edgeMode=\"duplicate\" />\n<feComposite operator=\"arithmetic\" k1=\"0\" k2=\"2\" k3=\"-1\" k4=\"0.0\" in=\"SourceGraphic\" in2=\"BigBlur\" result=\"Contrast\" />\n<feGaussianBlur in=\"SourceGraphic\" result=\"SmallBlur\" stdDeviation=\"5\" edgeMode=\"duplicate\" />\n<feComposite operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"-1\" k4=\"0.5\" in=\"SourceGraphic\" in2=\"SmallBlur\" result=\"Detail\" />\n<feComposite operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"1\" k4=\"-0.5\" in=\"Contrast\" in2=\"Detail\" result=\"Combined\" />",
	"filterfallback-EquilizeLum":"",
	"filterfallback-EquilizeRGB":"Invert",
	"filterfallback-EquilizeRGBThreshold":"",
	"filterfallback-EquilizeVideoLum":"EquilizeLum",
	"filterfallback-Invert":"",
	"filterfallback-BrightnessContrastGamma":"",
	"filterfallback-Cartoon": "",
	"filterfallback-Sobel":"",
	"filterfallback-Threshold":"",
	"filterfallback-Unsharp":"",
	"filtershortcut-EquilizeLum":"alt+shift+ins",
	"filtershortcut-EquilizeRGB":"ctrl+g",
	"filtershortcut-EquilizeRGBThreshold":null,
	"filtershortcut-EquilizeVideoLum":null,
	"filtershortcut-Invert":null,
	"filtershortcut-BrightnessContrastGamma":null,
	"filtershortcut-Cartoon": null,
	"filtershortcut-Sobel":null,
	"filtershortcut-Threshold":null,
	"filtershortcut-Unsharp":null,
	"global-enable":true,
	"global-filter":"EquilizeRGB",
	"global-value1":"0.5",
	"global-value2":"0.5",
	"global-value3":"0.5",
	"option-debugpopup":false,
	"option-invert":false,
	"option-onlypictures":true,
	"option-value1":"0.5",
	"option-value2":"0.5",
	"option-value3":"0.5", 
	"shortcut-global-enable":null,
	"shortcut-global-next":"alt+end",
	"shortcut-invert":"ctrl+i",
	"shortcut-onlypictures":"alt+shift+end",
	"shortcut-site-enable":null,
	"shortcut-v1-inc":"alt+pageup",
	"shortcut-v1-dec":"alt+pagedown",
	"shortcut-v2-inc":"alt+shift+pageup",
	"shortcut-v2-dec":"alt+shift+pagedown",
	"shortcut-v3-inc":"alt+z",
	"shortcut-v3-dec":"alt+x",
	"site-enable":false,
	"site-enable-www.netflix.com":false,
	"site-enable-www.youtube.com":false,
	"site-enablelocalhost":true,
	"site-enableolivier.chapelle.cc":false,
	"zglobal-value1":"0.5", // z means that it'll be the last processed
	"zglobal-value2":"0.5",
	"zglobal-value3":"0.5"
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
