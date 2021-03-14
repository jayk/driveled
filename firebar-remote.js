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

var leds = new Array(strip_size);
var heat = new Array(strip_size);
var heat_colors = fire.get_heat_color_table();

for (var i = 0, l = heat.length; i < l; i++) {
    heat[i] = 0;
    leds[i] = [0,0,0];
}

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

setTimeout(function() {
    display.write_to_opc(client);
    setInterval(function() {
        var colors = fire.fire_simulation_frame(heat, heat_colors, 50, 120);
        draw(client, display, colors);
    }, 40);
}, 150);
//console.log(util.inspect(display.strips));

function draw(client, display, colors) {
    for (var i = 0, l = colors.length; i < l; i++) {
        display.set_pixel(0, i, colors[i]);
        display.set_pixel(1, i, colors[i]);
        display.set_pixel(2, i, colors[i]);
    }
    display.write_to_opc(client);
}

