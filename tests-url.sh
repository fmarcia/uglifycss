#!/bin/bash

PWD=$(pwd)
TMPFILE=/tmp/uglifycss-tests-url.tmp

printf "absolute paths: "
./uglifycss --convert-urls $PWD/tests-url/assets/css $PWD/tests-url/ghi/css/ghi.css $PWD/tests-url/sub/abc/css/abc.css $PWD/tests-url/sub/def/sub/css/def.css $PWD/tests-url/jkl/jkl.css > $TMPFILE
diff $PWD/tests-url/tests-url.css.min $TMPFILE
if [ "$?" == "0" ]; then
    echo OK
else
    echo KO
fi

printf "relative paths: "
./uglifycss --convert-urls tests-url/assets/css tests-url/ghi/css/ghi.css tests-url/sub/abc/css/abc.css tests-url/sub/def/sub/css/def.css tests-url/jkl/jkl.css > $TMPFILE
diff tests-url/tests-url.css.min $TMPFILE
if [ "$?" == "0" ]; then
    echo OK
else
    echo KO
fi

printf "current path: "
cd tests-url/assets/css
../../../uglifycss --convert-urls ../../assets/css ../../ghi/css/ghi.css ../../sub/abc/css/abc.css ../../sub/def/sub/css/def.css ../../jkl/jkl.css > $TMPFILE
diff ../../tests-url.css.min $TMPFILE
if [ "$?" == "0" ]; then
    echo OK
else
    echo KO
fi

rm $TMPFILE 2> /dev/null
