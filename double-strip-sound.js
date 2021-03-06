#!/usr/bin/env node

// Simple red/blue fade with Node and opc.js

var OPC = new require('./opc')
var client = new OPC('localhost', 7890);

var multiplier = 10;
var mirror = 1;

var max = 0;
var count = 0;

var red=255,
    green = 0
    blue = 128
for (var i = 0; i < 65; i++) {
    client.setPixel(i, red, green, blue);
    client.setPixel(64+i, red, green, blue);
}
client.writePixels();

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(data){
    //console.log(line);
//    console.log("recieved ", data)
    var pixeldata = data.split(';');
    draw(pixeldata);
})

var rotate = 0;

function draw(channels) {

    var total_leds = 63;
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
    var pixel;
    for (var j = 0; j < 128; j++) {
        client.setPixel(j, 172, 64, 128);
    }
    for (pos = 0; pos < num_channels; pos++)
    {
        pixel = pos * width;
        b = 0.75 ; //  1; 0.5 ;
        r = 0.1; // 0.9 * ((multiplier * channels[pos]) / 256);
        g = 0.3 * ((multiplier * channels[pos]) / 256);
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

        if (false && count %  1000 == 0) {
            rotate++;
            if (rotate > 54) {
                rotate = 0;
            }
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

        if (mirror) {
            for (var j = 0; j < width; j++) {
                var p = total_leds - (pixel + j)
                var p2 = total_leds + (pixel + j);
                
                client.setPixel(p, red, green, blue);
                client.setPixel(p2, red, green, blue);
                client.setPixel(64+p, red, green, blue);
                client.setPixel(64+p2, red, green, blue);
            }
            
            
        } else {

            for (var j = 0; j < width; j++) {
                var px = rotate + pixel + j;
                if (px > 54) {
                    px = px - 54;
                }
                client.setPixel(px, red, green, blue);
                client.setPixel(64+px, red, green, blue);
            }
        }
//        var t = pixel * 0.2 + millis * 0.002;
//        var red = 0;
    }
    client.writePixels();
}

//setInterval(draw, 30);
