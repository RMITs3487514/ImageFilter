**Pre-alpha.** This project is still under development and not ready to be used yet. Currently under GPL3. See LICENSE.txt.

# ImageFilter

This browser extension filters images on webpages you visit to improve visibility and detail. It uses SVG filters and allows users to edit their source directly. Features include histogram generation for equalization, dynamically adjustable values with keyboard shortcuts and persistent per-site settings. Images which are classified as having text content or having relatively few colours can be ignored.

## Browser Support

- Chrome
- Firefox

    Very limited - popup and options page don't work. If installed via WebExtensions when it is released rather than addon SDK it may simply work.

## Quick Start

1. Install the extension via the chrome webstore or using a download from the releases section here.
2. Navigate to a page with images.
3. Click on the extension's popup button ![popup img][popup] to open a small popup with options.
4. Here you may enable/disable filtering or choose which filter you want to apply. The filters are configurable at the options page (linked from the popup).

Note there are two sections in the popup: one set for the default behaviour which applies to all sites, and another for per-site overrides. The overrides have a green border when active and can be cleared to allow the default options to apply again. These settings are persistent (also synced on your google account for chrome).

## How it works

ImageFilter has four components.

1. `imagefinder.js` which uses mutation observers to detect all images added to the page.

	This works dynamically so the pages such as youtube which entirely use AJAX to change tabs don't break the plugin and require a reload.

	It also detects images added via CSS, including inline `style` attributes `style` tags and linked `style` files. Again these are supported dynamically and even changes to image `src` attributes and `background-image` properties are handled.

2. `imagefilter.js` is the main controlling component which handles callbacks from `imagefinder.js`, decides whether to filter and keeps a record of what is actually filtered.

3. `histogram.js` builds histograms from images to be used in image classification and in the actual SVG filters.

4. `filter.js` does the actual filtering. It takes a histogram object, creates an SVG object with a `<filter>` tag and a CSS class to apply the SVG filter. Images can be filtered by appending the CSS class.

The following files handle user input and options.

- `content.js` is the entry point, which creates an `ImageFilterer` from `imagefilter.js`.
- `popup.html/js` is the ![popup img][popup] popup which provide quick access to changing default and per-site enabled/disable and filter choice options. It includes sliders for custom variables and a link to the options page.
- `options.html/js` the less common options are found here, including shortcuts and filter source code. It includes examples of the syntax for integrating histogram and custom variables with the SVG filters, which for convenience is duplicated below.

For chrome and firefox WebExtensions, `manifest.json` contains the extension metadata.

For firefox addon SDK support, `package.json` and `index.js` attempt to wrap and replicate functionality in the chrome code. `storage.js`, `messaging.js` and `crossbrowser.js` contain browser-specific code to support this.

Any configurable variables are found at the top of each file.

## Custom SVG Filters

The extension injects `<svg>` and `<filter>` tags, leaving the contents of `<filter>` for the user to define, although a number of default filters are provided.
Documentation for the different filter effects can be found at the
[W3C SVG Filter Effects page](https://www.w3.org/TR/SVG/filters.html).

Filters may use custom values, named `V1`, `V2` and `V3` to allow parameters to be adjusted dynamically.
Use `{{ V1 }}`, `{{ V2 }}` and `{{ V3 }}` to have it substituted with their value between
zero and one. Javascript equations within the braces are evaluated and
initial values can be set by including xml comments with `V=` assignments, for example below.

	<!-- V1=0.5 -->
	<feComponentTransfer>
	  <feFuncR type="linear" slope="{{V1*4-1}}" intercept="{{-0.5 * (V1*4-1) + 0.5}}"/>
	  <feFuncG type="linear" slope="{{V1*4-1}}" intercept="{{-0.5 * (V1*4-1) + 0.5}}"/>
	  <feFuncB type="linear" slope="{{V1*4-1}}" intercept="{{-0.5 * (V1*4-1) + 0.5}}"/>
	</feComponentTransfer>

Histograms are generated for all images, although sometimes this isn't possible.
If one is available, its values can be injected into a filter with
`%HR`, `%HG` and `%HB`
for red, green and blue channels respectively. `%HY` inserts luminance.
These values are the cumulative sum of the raw histogram, 255 values separated by spaces.
For efficiency, the number of values can be reduced, for `%16HY` enters
just 16 values from the cumulative sum of the luminance histogram. A full example is below,
filtering images by luminance.

	<feComponentTransfer>
	  <feFuncR type="table" tableValues="%16HY"/>
	  <feFuncG type="table" tableValues="%16HY"/>
	  <feFuncB type="table" tableValues="%16HY"/>
	</feComponentTransfer>

[popup]:https://raw.githubusercontent.com/pknowles/ImageFilter/master/icon16.png
