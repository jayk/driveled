#!/usr/bin/env node

// Simple red/blue fade with Node and opc.js

var OPC = new require('./opc');
var client = new OPC('localhost', 7890);
var Display = require('./Display');

var display = new Display();

var multiplier = 10;
var mirror = 1;

var max = 0;
var count = 0;

var red=255,
    green = 0
    blue = 128

display.setup_strip(0, 54, display.get_color(red, green, blue));
display.setup_strip(1, 54, display.get_color(red, green, blue));
display.write_to_opc(client);
// client.writePixels();

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(data){
    //console.log(line);
    console.log("recieved ", data)
    var pixeldata = data.split(';');
    update(pixeldata);
});

var rotate = 0;
var rcount = 0;
var rate = 1;
var do_pulse = false;

setInterval(function() {
    if (do_pulse) {
        if (rcount >= 53) {
            rcount = 0;
        } 
        //else {
    //        rcount += rate;
    //    }
        for (var i = 0; i < rate; i++) {
            display.set_pixel(0, rcount+i, [255, 172, 128]);
            display.set_pixel(1, rcount+i, [255, 172, 128]);
        }
        rcount+=rate;
    }
    display.write_to_opc(client);
}, 20);

function update(channels) {

    var total_leds = 54;
    if (mirror) {
        total_leds = total_leds / 2;
    }

    var num_channels = channels.length - 1;
    var width = Math.floor(total_leds / num_channels);
    var remainder = total_leds % num_channels;

    //console.log('channels: ', num_channels);
    //console.log('width: ', width);
    
    var red,green,blue;
    var base = 10;
    
    var r=1 ; // 0.5;
    var g= 0.5;
    var b= 0.75 ; // 1;
    
    var pos;
    var pixel, color;
    for (var j = 0; j < 4; j++) {
        display.set_pixel(0, j, [172, 64, 128]);
        display.set_pixel(1, j, [172, 64, 128]);
    }
    for (var j = 50; j < 54; j++) {
        display.set_pixel(0, j, [172, 64, 128]);
        display.set_pixel(1, j, [172, 64, 128]);
    }

    for (pos = 0; pos < num_channels; pos++)
    {
        pixel = pos * width;
        b = 0.75 ; //  1; 0.5 ;
        r = 1; // 0.9 * ((multiplier * channels[pos]) / 256);
        g = 0.8 * ((multiplier * channels[pos]) / 256);
        red = base + Math.floor( r * multiplier * channels[pos]);
        green = base + Math.floor( g * multiplier * channels[pos]);
        blue = base + Math.floor( b * multiplier * channels[pos]);
        
/*        if (red < 64) {
            red += 108 / 2;
            blue += 64 / 2;
        }
*/

        if (red > 255 ) {
            red = 255;
        }
        if (green > 255) {
            green = 255;
        }
        if (blue > 255) {
            blue = 255;
        }

        if (count > 100) {
            count = 0;
            // re-evaluate
            if (max < 96 && multiplier < 24) {
                multiplier = multiplier + 1
                console.log("Adjusted multiplier Upwards: ", multiplier);
            } else if (max >= 250 && multiplier > 15) {
                multiplier = multiplier - 1;
                console.log("Adjusted multiplier Downwards: ", multiplier);
            }
            max = 0;
        } else {
            count++;
            if (green > max) {
                max = green;
            }
            if (red > max) {
                max = red;
            }
            if (blue > max) {
                max = blue;
            }
        } 

        color = display.get_color(red, green, blue);        

        if (mirror) {
            for (var j = 0; j < width; j++) {
                var p = total_leds - (pixel + j)
                var p2 = total_leds + (pixel + j);
                
                display.set_pixel(0, p, color);
                display.set_pixel(0, p2, color);
                display.set_pixel(1, p, color);
                display.set_pixel(1, p2, color);
            }
        } else {

            for (var j = 0; j < width; j++) {
                var px = rotate + pixel + j;
                if (px > 54) {
                    px = px - 54;
                }
                display.set_pixel(0, px, color);
                display.set_pixel(1, px, color);
            }
        }
    }
}

//setInterval(draw, 30);
