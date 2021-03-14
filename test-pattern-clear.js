#!/usr/bin/env node

// Simple red/blue fade with Node and opc.js
//

var OPC = new require('./opc')
var client = new OPC('lightbox.local', 7890);
var Display = require('./Display');
var Fire = require('./Fire');
var util = require('util');

var display = new Display();
var fire = new Fire();

var strip_size = 45;
var reverse = false;
var pixels = [ 24, 48, 72, 96, 192, 255, 255, 192, 128, 96, 72, 48, 24 ];
var leds = new Array(strip_size);



display.setup_strip(0, { 
    strip_len: strip_size, 
    default_color: 
    display.get_color(1,0,0), 
    reversed: reverse,
    //adjustments: { hue: 90 }
});

display.setup_strip(1, { strip_len: strip_size, default_color: display.get_color(1,0,0), reversed: reverse});
display.setup_strip(2, { strip_len: strip_size, default_color: display.get_color(1,0,0), reversed: reverse});

/*
for (var i = 0, l = leds.length; i < l; i++) {
    display.set_pixel(0, i, leds[i]);
    display.set_pixel(1, i, leds[i]);
}
*/

var interval;
var step = 0;
var pos = 0 - pixels.length;
var direction = 1;
var zerocount = 0;

setTimeout(function() {
    display.write_to_opc(client);
    interval = setInterval(function() {
        var colors = get_frame(leds, pixels, strip_size, pos);
        draw(client, display, colors);
        step++;
        pos += direction;
        if ((pos + pixels.length - (pixels.length / 2)) >= strip_size) { 
            direction = -1;
        } else if (pos == (0 - pixels.length)) {
            direction = 1;
        }
        
        if (pos == (0 - pixels.length)) {
            zerocount++;
            if (zerocount >=1) {
                clearInterval(interval);
                process.exit();
            }
        }
        
    }, 40);
}, 150);
//console.log(util.inspect(display.strips));

function get_frame(leds, colors, size, position) {
    var pos_in_colors;
    for (var i = 0; i <= size; i++) {
        pos_in_colors = i - position;
        if (pos_in_colors > 0 && pos_in_colors < colors.length) {
            leds[i] = [ colors[pos_in_colors], 0, 0];
        } else {
            leds[i] = [0,0,0];
        }
    }
    return leds;
}


function draw(client, display, colors) {
    for (var i = 0, l = colors.length; i < l; i++) {
        display.set_pixel(0, i, colors[i]);
        display.set_pixel(1, i, colors[i]);
        display.set_pixel(2, i, colors[i]);
    }
    display.write_to_opc(client);
}

