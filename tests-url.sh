#!/bin/bash

ABC=sub/abc/css/abc.css
DEF=sub/def/sub/css/def.css
GHI=ghi/css/ghi.css
JKL=jkl/jkl.css

TMPFILE=/tmp/uglifycss-tests-url.tmp

printf "absolute paths: "
PWD=$(pwd)
./uglifycss --convert-urls $PWD/tests-url/assets/css $PWD/tests-url/$GHI $PWD/tests-url/$ABC $PWD/tests-url/$DEF $PWD/tests-url/$JKL > $TMPFILE
diff $PWD/tests-url/tests-url.css.min $TMPFILE
if [ "$?" == "0" ]; then
    echo OK
else
    echo KO
fi

printf "relative paths: "
./uglifycss --convert-urls tests-url/assets/css tests-url/$GHI tests-url/$ABC tests-url/$DEF tests-url/$JKL > $TMPFILE
diff tests-url/tests-url.css.min $TMPFILE
if [ "$?" == "0" ]; then
    echo OK
else
    echo KO
fi

printf "current path: "
mkdir -p tests-url/assets/css
cd tests-url/assets/css
../../../uglifycss --convert-urls ../../assets/css ../../$GHI ../../$ABC ../../$DEF ../../$JKL > $TMPFILE
diff ../../tests-url.css.min $TMPFILE
if [ "$?" == "0" ]; then
    echo OK
else
    echo KO
fi
cd ../../..
rm -r tests-url/assets

rm $TMPFILE 2> /dev/null
