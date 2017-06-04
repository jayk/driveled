#!/usr/bin/env node

// Simple red/blue fade with Node and opc.js
//

var OPC = new require('./opc')
var client = new OPC('localhost', 7890);
var Display = require('./Display');
var Fire = require('./Fire');
var util = require('util');

var display = new Display();
var fire = new Fire();

var strip_size = 54;

var leds = new Array(strip_size);
var heat = new Array(strip_size);
var heat2 = new Array(strip_size);
var heat_colors = fire.get_heat_color_table();

for (var i = 0, l = heat.length; i < l; i++) {
    heat[i] = 0;
    heat2[i] = 0;
    leds[i] = [0,0,0];
}

display.setup_strip(0, strip_size, display.get_color(1,0,0), true);
display.setup_strip(1, strip_size, display.get_color(1,0,0), true);
/*
for (var i = 0, l = leds.length; i < l; i++) {
    display.set_pixel(0, i, leds[i]);
    display.set_pixel(1, i, leds[i]);
}
*/
setTimeout(function() {
    display.write_to_opc(client);
    setInterval(function() {
        heat2[1] = heat[3];
        heat2[3] = heat[1];
        var colors = fire.fire_simulation_frame(heat, heat_colors, 50, 100);
        var colors2 = fire.fire_simulation_frame(heat2, heat_colors, 50, 100);
        draw(client, display, 0, colors);
        draw(client, display, 1, colors2);
    }, 40);
}, 150);
//console.log(util.inspect(display.strips));




function draw(client, display, strip, colors) {

    for (var i = 0, l = colors.length; i < l; i++) {
        display.set_pixel(strip, i, colors[i]);
    }
    display.write_to_opc(client);
}

