#!/usr/bin/env node

// Simple red/blue fade with Node and opc.js
//

// formula for feet per second to miles per hour
// a 54 pixels = 6 feet
// 3 patterns = 6 feet
// 1 pattern = 2 feet
// x mph * 1.46667 = feet per second.
// x mph * 1.46667 * 12 = inches per second.
// 9 lights per foot
// x mph * 1.46667 * 9 = lights per second.
//
// 1 light = 1.33 inches
// rotation speed = 100 samples per second
// units 


var OPC = new require('./opc')
var client = new OPC('localhost', 7890);

var max = 0;

var rotate = 0;
var count = 0;
var scale = 10;
var pixels = [ 0, 0, 0, 0, 24, 48, 72, 96, 192, 255, 255, 255, 192, 128, 96, 72, 48, 24 ];
var strip = [].concat(pixels).concat(pixels).concat(pixels);

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(data){
    //console.log(line);
//    console.log("recieved ", data)
    var speeddata = data.split(';');
    //scale = speeddata[0];

    scale = Math.floor((speeddata[0] * 1.46667 * 9) / 100);
    console.log("scale is:", scale);

});

setInterval(function() {
    draw();
}, 10);


function draw(channels) {

    var red,green,blue;
    
    var r=0.9;
    var g= 0.3;
    var b=1;
    
    var pos;
    var pixel;
    var max_pattern = pixels.length;
    for (var h = 0; h < scale; h++) {
        strip.unshift(strip.pop()); 
    }

    for (var i = 0, l = strip.length; i < l; i++) {
        red =  Math.floor( r * strip[i] );
        green =  Math.floor( g * strip[i]);
        blue =  Math.floor( b * strip[i]);

        if (red > 255 ) {
            red = 255;
        }
        if (green > 255) {
            green = 255;
        }
        if (blue > 255) {
            blue = 255;
        }

        client.setPixel(i, red, green, blue);
    //        var t = pixel * 0.2 + millis * 0.002;
    //        var red = 0;
    }
    client.writePixels();
}

//setInterval(draw, 30);
