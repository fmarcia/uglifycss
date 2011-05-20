UglifyCSS is a port of [YUI Compressor](https://github.com/yui/yuicompressor), for its CSS part, from Java to [NodeJS](http://nodejs.org). Its name is a reference to the awesome [UglifyJS](https://github.com/mishoo/UglifyJS) but UglifyCSS is not a CSS parser. Like YUI CSS Compressor, it applies many regex replacements.

Usage: `uglifycss [options] css1 [css2] [...] > output`

Options:

* `--max-line-len n` adds a newline every `n` characters; `0` means no newline and is the default value
* `--expand-vars` expands variables; by default, `@variables` blocks are preserved and `var(x)`s are not expanded
* `--cute-comments` preserves newlines within and around preserved comments; by default, newlines are removed from preserved comments

A [port to javascript](https://github.com/yui/yuicompressor/blob/master/ports/js/cssmin.js) is also available in the YUI Compressor repository.

2 functions are provided:

* `processString(content, options)`
* `processFiles(filenames, options)`

See test.js for example.