#!/usr/bin/env node

const { processFiles } = require('./')
const { readdirSync, unlinkSync, readFileSync, writeFileSync } = require('fs')

// path to yui tests
const PATH = './tests-yui'

// get sorted files list
const files = readdirSync(PATH).sort()

// remove previous failures
files.forEach(file => {
    if (/\.FAILED$/.test(file)) {
        unlinkSync(`${PATH}/${file}`)
    }
})

// init counters
let failed = 0
let done = 0

// check files
files.forEach(file => {
    file = `${PATH}/${file}`
    if (/\.css$/.test(file)) {
        const ugly = processFiles([ file ])
        if (ugly.trim() !== readFileSync(`${file}.min`, 'utf8').trim()) {
            console.log(`${file}: FAILED`)
            writeFileSync(`${file}.FAILED`, ugly)
            failed += 1
        }
        done += 1
    }
})

// report
if (failed) {
    console.log(`${done} tests, ${failed} failed`)
} else {
    console.log(`${done} tests, no failure!`)
}