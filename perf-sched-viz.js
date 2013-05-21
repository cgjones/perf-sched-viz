/* -*- Mode: Java; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- /
/* vim: set shiftwidth=4 tabstop=8 autoindent cindent expandtab: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO
//  - filter by process name
//  - show multiple CPUs
//  - heavy processing on worker
//  - streaming parsing

'use strict';

let reader, schedmapText, schedmapFile;

window.onload = function() {
    schedmapFile = $('schedmapfile');
    schedmapFile.onchange = loadFile;

    schedmapText = $('schedmaptext');
    $('showSchedmaptext').onclick = loadTextarea;

    $('back').onclick = function() { document.location.hash = 'input'; }

    window.onhashchange = updateActiveRegion;
};

function Schedule() {
    this.events = [ ];          // [ SchedEvent ], sorted by increasing time
    this.processes = { };       // name -> Process
    this.tasks = { };           // key -> Task
    this.percentLostEvents = 0;
}
Schedule.prototype = {
    addEvent: function(cpu, key, timeSec) {
        //if (DEBUG) debug('New event: ['+ cpu +'] '+ key +', '+ timeSec);
        // TODO assert happens-after last event
        let type = (key == '.') ? 'idle' : 'sched';
        let task = (type == 'idle') ? null : this.tasks[key];
        this.events.push(new SchedEvent(type, cpu, timeSec, task));
    },

    newTask: function(key, processName, tid) {
        //if (DEBUG) debug('New task: '+ key +' => '+ processName +':'+ tid);
        if (!(processName in this.processes)) {
            this.processes[processName] = new Process(processName);
        }
        let proc = this.processes[processName];
        let task = new Task(key, proc, tid);
        proc.tasks.push(task);
        this.tasks[key] = task;
    },
};

function Process(name) {
    this.name = name;
    this.tasks = [ ]            // [ Task ]
}

function Task(key, process, tid) {
    this.key = key;
    this.process = process;
    this.tid = tid;
}

function SchedEvent(type, cpu, timeSec, task) {
    this.type = type;           // enum { 'idle', 'sched' }
    this.cpu = cpu;
    this.timeSec = timeSec;     // start of event
    this.task = task;           // null for 'idle' event
}

function visualize(map) {
    if (DEBUG) debug('Loading map data: "'+ map.slice(0, 20) +'" ...');

    document.location.hash = 'visualize';

    let sched = parse(map);
    info('Parsed schedule with '+ sched.events.length +' switches and '+
         sched.percentLostEvents +'% lost events');
}

const eventRx =
    /^\s+[*](\w+|[.])\s+(\d+[.]\d+) secs $/;
const newTaskEventRx =
    /^\s+[*](\w+|[.])\s+(\d+[.]\d+) secs (\w+) => (.+):(\d+)$/;
const infoRx =
    /^\s+INFO: (\d+[.]\d+)% lost events/;
function parse(map) {
    let sched = new Schedule();
    map.split('\n').forEach(function(line) {
            if (!line)
                return;
            //if (DEBUG) debug('Matching line "'+ line +'"');
            let m;
            if ((m = newTaskEventRx.exec(line))) {
                sched.newTask(m[3], m[4], parseInt(m[5]));
                sched.addEvent(0, m[1], parseFloat(m[2]));
            } else if ((m = eventRx.exec(line))) {
                sched.addEvent(0, m[1], parseFloat(m[2]));
            } else if ((m = infoRx.exec(line))) {
                sched.percentLostEvents = parseFloat(m[1]);
            } else {
                warn('Unknown syntax: '+ line);
            }
        });
    return sched;
}

function loadTextarea() {
    debug('Loading from textarea');

    let text = schedmapText.value;
    if (text.length == 0) {
        error('No text pasted');
    }
    visualize(text);
}

function loadFile() {
    debug('Loading from file');

    if (reader) {
        error('Already trying to read an input file');
    }
    if (schedmapFile.files.length == 0) {
        error('No file selected');
    }
    let file = schedmapFile.files[0];

    reader = new FileReader();
    reader.onload = function(e) {
        visualize(e.target.result);
        reader = null;
    }
    reader.onerror = function(e) {
        error(e +'');
        reader = null;
    }
    reader.readAsText(file);
}

let activeRegion = '#input';
function updateActiveRegion() {
    if (window.scrollX !== 0 || window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
    $$(activeRegion).className = 'previous';
    activeRegion = window.location.hash;
    if (DEBUG) debug('New active region is '+ activeRegion);
    $$(activeRegion).className = 'active';
}

function error(what) {
    alert('Error: '+ what);
    throw what;
}

function info(what) { console.info(what); }
function warn(what) { console.warn(what); }

const DEBUG = 1;
let debug;
if (DEBUG) {
    debug = function(msg) { console.log(msg); }
} else {
    debug = function() { }
}

function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelector(sel); }
