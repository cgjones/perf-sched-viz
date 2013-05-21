/* -*- Mode: Java; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- /
/* vim: set shiftwidth=4 tabstop=8 autoindent cindent expandtab: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO
//  - filter by process name
//  - show multiple CPUs

var DEBUG = 1, debug;
if (DEBUG)
    debug = function(msg) { console.log(msg); }
else
    debug = function() { }

var reader, schedmapText, schedmapFile;

window.onload = function() {
    schedmapText = document.getElementById('schedmaptext');
    schedmapFile = document.getElementById('schedmapfile');
};

function visualize(map) {
    if (DEBUG) debug('Loading map data: "'+ map.slice(0, 20) +'" ...');
}

function loadTextarea() {
    debug('Loading from textarea');

    var text = schedmapText.value;
    if (text.length == 0)
        error('No text pasted');

    visualize(text);
}

function loadFile() {
    debug('Loading from file');

    if (reader)
        error('Already trying to read an input file');
    if (schedmapFile.files.length == 0)
        error('No file selected');

    var file = schedmapFile.files[0];

    reader = new FileReader();
    reader.onload = function(e) {
        visualize(e.target.result);
    }
    reader.onerror = function(e) {
        error(e +'');
    }
    reader.readAsText(file);
}

function error(what) {
    alert('Error: '+ what);
    throw what;
}
