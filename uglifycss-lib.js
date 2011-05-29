/*
 * UglifyCSS
 * Port of YUI CSS Compressor from Java to NodeJS
 * Author: Franck Marcia - https://github.com/fmarcia
 *
 * Based on parts of:
 * YUI Compressor
 * Author: Julien Lecomte - http://www.julienlecomte.net/
 * Author: Isaac Schlueter - http://foohack.com/
 * Author: Stoyan Stefanov - http://phpied.com/
 * Copyright (c) 2009 Yahoo! Inc. All rights reserved.
 * The copyrights embodied in the content of this file are licensed
 * by Yahoo! Inc. under the BSD (revised) open source license.
 */


var	sys = require('sys'),
	fs = require('fs'),

	uglifycss = module.exports = {

		defaultOptions: {
			maxLineLen: 0,
			expandVars: false,
			cuteComments: false
		},

		// Uglify a CSS string

		processString: function(content, options) {

			var startIndex,
				endIndex,
				comments = [],
				preservedTokens = [],
				token,
				len = content.length,
				pattern,
				quote,
				rgbcolors,
				hexcolor,
				placeholder,
				val,
				i,
				c,
				line = [],
				lines = [],
				vars = {};

			options = options || uglifycss.defaultOptions;

			// collect all comment blocks...
			while ((startIndex = content.indexOf("/*", startIndex)) >= 0) {
				endIndex = content.indexOf("*/", startIndex + 2);
				if (endIndex < 0) {
					endIndex = len;
				}
				token = content.substring(startIndex + 2, endIndex);
				comments.push(token);
				content = content.substring(0, startIndex + 2)
					.concat(
						"___PRESERVE_CANDIDATE_COMMENT_" + (comments.length - 1) + "___",
						content.substring(endIndex)
					);
				startIndex += 2;
			}

			// preserve strings so their content doesn't get accidentally minified
			pattern = /(\"([^\"]|\.|\\)*\")|(\'([^\']|\.|\\)*\')/g;
			content = content.replace(pattern, function (token) {
				quote = token.charAt(0);
				token = token.substring(1, token.length - 1);
				// maybe the string contains a comment-like substring or more? put'em back then
				if (token.indexOf("___PRESERVE_CANDIDATE_COMMENT_") >= 0) {
					for (i = 0, len = comments.length; i < len; i += 1) {
						token = token.replace("___PRESERVE_CANDIDATE_COMMENT_" + i + "___", comments[i]);
					}
				}
				// minify alpha opacity in filter strings
				token = token.replace(/progid:DXImageTransform.Microsoft.Alpha\(Opacity=/g, "alpha(opacity=");
				preservedTokens.push(token);
				return quote + "___PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___" + quote;
			});

			// strings are safe, now wrestle the comments
			for (i = 0, len = comments.length; i < len; i += 1) {

				token = comments[i];
				placeholder = "___PRESERVE_CANDIDATE_COMMENT_" + i + "___";

				// ! in the first position of the comment means preserve
				// so push to the preserved tokens while stripping the !
				if (token.charAt(0) === "!") {
					if (options.cuteComments) {
						preservedTokens.push(token.substring(1));
					} else {
						preservedTokens.push(token.substring(1).replace(/[\r\n]/g, ''));
					}
					content = content.replace(placeholder,  "___PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___");
					continue;
				}

				// \ in the last position looks like hack for Mac/IE5
				// shorten that to /*\*/ and the next one to /**/
				if (token.charAt(token.length - 1) === "\\") {
					preservedTokens.push("\\");
					content = content.replace(placeholder,  "___PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___");
					i = i + 1; // attn: advancing the loop
					preservedTokens.push("");
					content = content.replace(
						"___PRESERVE_CANDIDATE_COMMENT_" + i + "___",
						"___PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___"
					);
					continue;
				}

				// keep empty comments after child selectors (IE7 hack)
				// e.g. html >/**/ body
				if (token.length === 0) {
					startIndex = content.indexOf(placeholder);
					if (startIndex > 2) {
						if (content.charAt(startIndex - 3) === '>') {
							preservedTokens.push("");
							content = content.replace(placeholder,  "__PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___");
						}
					}
				}

				// in all other cases kill the comment
				content = content.replace("/*" + placeholder + "*/", "");
			}

			if (options.expandVars) {
				// parse simple @variables blocks and remove them
				pattern = /@variables\s*\{\s*([^\}]+)\s*\}/g;
				content = content.replace(pattern, function (token, f1) {
					pattern = /\s*([a-z0-9\-]+)\s*:\s*([^;\}]+)\s*/gi;
					f1.replace(pattern, function(token, f1, f2) {
						if (f1 && f2) {
						vars[f1] = f2;
						}
						return '';
					});
					return '';
				});

				// replace var(x) with the value of x
				pattern = /var\s*\(\s*([^\)]+)\s*\)/g;
				content = content.replace(pattern, function (token, f1) {
					return vars[f1] || 'none';
				});
			}

			// normalize all whitespace strings to single spaces. Easier to work with that way.
			content = content.replace(/\s+/g, " ");

			// remove the spaces before the things that should not have spaces before them.
			// but, be careful not to turn "p :link {...}" into "p:link{...}"
			// swap out any pseudo-class colons with the token, and then swap back.
			pattern = /(^|\})(([^\{:])+:)+([^\{]*\{)/g;
			content = content.replace(pattern, function (token) {
				token = token
					.replace(/:/g, "___PSEUDOCLASSCOLON___")
					.replace(/\\/g, "\\\\")
					.replace(/\$/g, "\\$");
				return token;
			});

			// remove spaces before the things that should not have spaces before them.
			content = content.replace(/\s+([!{};:>+\(\)\],])/g, "$1");

			// bring back the colon
			content = content.replace(/___PSEUDOCLASSCOLON___/g, ":");

			// retain space for special IE6 cases
			content = content.replace(/:first\-(line|letter)(\{|,)/g, ":first-$1 $2");

			// newlines before and after the end of a preserved comment
			if (options.cuteComments) {
				content = content.replace(/\s*\/\*/g, "___PRESERVED_NEWLINE___/*");
				content = content.replace(/\*\/\s*/g, "*/___PRESERVED_NEWLINE___");
			// no space after the end of a preserved comment
			} else {
				content = content.replace(/\*\/\s*/g, '*/');
			}

			// if there is a @charset, then only allow one, and push to the top of the file.
			content = content.replace(/^(.*)(@charset \"[^\"]*\";)/g, "$2$1");
			content = content.replace(/^(\s*@charset [^;]+;\s*)+/g, "$1");

			// put the space back in some cases, to support stuff like
			// @media screen and (-webkit-min-device-pixel-ratio:0){
			content = content.replace(/\band\(/g, "and (");

			// remove the spaces after the things that should not have spaces after them.
			content = content.replace(/([!{}:;>+\(\[,])\s+/g, "$1");

			// remove unnecessary semicolons
			content = content.replace(/;+\}/g, "}");

			// replace 0(px,em,%) with 0.
			content = content.replace(/([\s:])(0)(px|em|%|in|cm|mm|pc|pt|ex)/g, "$1$2");

			// replace 0 0 0 0; with 0.
			content = content.replace(/:0 0 0 0(;|\})/g, ":0$1");
			content = content.replace(/:0 0 0(;|\})/g, ":0$1");
			content = content.replace(/:0 0(;|\})/g, ":0$1");

			// replace background-position:0; with background-position:0 0;
			// same for transform-origin
			pattern = /(background-position|transform-origin|webkit-transform-origin|moz-transform-origin|o-transform-origin|ms-transform-origin):0(;|\})/g;
			content = content.replace(pattern, function (token, f1, f2) {
				return f1.toLowerCase() + ":0 0" + f2;
			});

			// replace 0.6 to .6, but only when preceded by : or a white-space
			content = content.replace(/(:|\s)0+\.(\d+)/g, "$1.$2");

			// shorten colors from rgb(51,102,153) to #336699
			// this makes it more likely that it'll get further compressed in the next step.
			pattern = /rgb\s*\(\s*([0-9,\s]+)\s*\)/g;
			content = content.replace(pattern, function (token, f1) {
				rgbcolors = f1.split(",");
				hexcolor = "#";
				for (i = 0; i < rgbcolors.length; i += 1) {
					val = parseInt(rgbcolors[i], 10);
					if (val < 16) {
						hexcolor += "0";
					}
					hexcolor += parseInt(rgbcolors[i], 16);
				}
				return hexcolor;
			});

			// shorten colors from #AABBCC to #ABC. Note that we want to make sure
			// the color is not preceded by either ", " or =. Indeed, the property
			//	 filter: chroma(color="#FFFFFF");
			// would become
			//	 filter: chroma(color="#FFF");
			// which makes the filter break in IE.
			pattern = /([^\"'=\s])\s*(#)([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/g;
			content = content.replace(pattern, function (token, f1, f2, f3, f4, f5, f6, f7, f8) {
				// Test for AABBCC pattern
				if (f3.toLowerCase() === f4.toLowerCase() &&
					f5.toLowerCase() === f6.toLowerCase() &&
					f7.toLowerCase() === f8.toLowerCase()
				) {
					return (f1 + f2 + f3 + f5 + f7).toLowerCase();
				} else {
					return token.toLowerCase();
				}
			});

			// border: none -> border:0
			pattern = /(border|border-top|border-right|border-bottom|border-right|outline|background):none(;|\})/;
			content = content.replace(pattern, function (token, f1, f2) {
				return f1.toLowerCase() + ":0" + f2;
			});

			// shorter opacity IE filter
			content = content.replace(/progid:DXImageTransform.Microsoft.Alpha\(Opacity=/g, "alpha(opacity=");

			// remove empty rules.
			content = content.replace(/[^\}\{\;]+\{\}/g, "");

			// some source control tools don't like it when files containing lines longer
			// than, say 8000 characters, are checked in. The linebreak option is used in
			// that case to split long lines after a specific column.
			if (options.maxLineLen > 0) {
				for (i = 0, len = content.length; i < len; i += 1) {
					c = content.charAt(i);
					line.push(c);
					if (c === '}' && line.length > options.maxLineLen) {
						lines.push(line.join(''));
						line = [];
					}
				}
				if (line.length) {
					lines.push(line.join(''));
				}

				content = lines.join('\n');
			}

			// replace multiple semi-colons in a row by a single one
			// see SF bug #1980989
			content = content.replace(/;;+/g, ";");

			// trim the final string (for any leading or trailing white spaces)
			content = content.replace(/(^\s*|\s*$)/g, "");

			// restore preserved comments and strings
			content = content.replace(/___PRESERVED_TOKEN_(\d+)___/g, function (token, f1) {
				return preservedTokens[parseInt(f1, 10)];
			});

			// restore preserved newlines
			content = content.replace(/___PRESERVED_NEWLINE___/g, '\n');

			// return
			return content;
		},


		// Uglify CSS files

		processFiles: function(filenames, options) {

			var	nFiles = filenames.length,
				uglies = [],
				index,
				filename,
				content;

			// process files
			for (index = 0; index < nFiles; index += 1) {
				filename = filenames[index];
				try {
					content = fs.readFileSync(filename, 'utf8');
					if (content.length) {
						uglies.push(uglifycss.processString(content, options));
					}
				} catch (e) {
					sys.error('unable to process "' + filename + '"');
					process.exit(1);
				}
			}

			// return concat'd results
			return uglies.join('');
		}

};
