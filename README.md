UglifyCSS is a port of [YUI Compressor](https://github.com/yui/yuicompressor), for its CSS part, from Java to [NodeJS](http://nodejs.org). Its name is a reference to the awesome [UglifyJS](https://github.com/mishoo/UglifyJS) but UglifyCSS is not a CSS parser. Like YUI CSS Compressor, It applies many replacements using regex.

Usage: `uglifycss [options] css1 [css2] [...] > output`

Options:

* `--max-line-len x` add a newline every x characters; 0 means no newline; default: 5000
* `--expand-vars` expand variables
* `--cute-comments` preserve newlines within and around preserved comments

PS: [a port to javascript](https://github.com/yui/yuicompressor/blob/master/ports/js/cssmin.js) is already available in the YUI Compressor repository.
