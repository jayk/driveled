#!/usr/bin/env node 

var cluster = require('cluster');  
var express = require('express');  

var worker;

if (cluster.isMaster) {
    worker = cluster.fork();

    var app = express();
    app.use(express.static('web_public'));

    app.get('/foo', function (req, res) {
        res.send('Hello World!');
	worker.send('Hi there!');
    });

    // All workers use this port
    app.listen(8001, '0.0.0.0');
} else {
    console.log('in client');
    process.on('message', function(message) {
	console.log('worker message', message);
    });
    // Workers share the TCP connection in this server
}
