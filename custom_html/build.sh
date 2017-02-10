#!/bin/bash

# we need one line to put in json 

for f in src/*.html;
do
    cat $f | tr "\n" " " > "dst/$(basename $f).txt";
done

