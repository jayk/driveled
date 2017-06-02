// Fire simulation code
var util = require('util')

module.exports = function Effects() { 

    this.get_heat_color_table = function() {
        var heatramp = new Array(255);
        var level_in_segment;
        var segment;

        for (var i = 0; i < 256; i++) {
            segment = Math.floor(i / 85);
            level_in_segment = (i % 85);
            heat_level = level_in_segment * 3;

            if (segment == 2) {
                // hottest - red and green are full brightness, blue is ramped
                heatramp[i] = [
                    255,        // red
                    255,        // green
                    heat_level  // blue
                ]; 
            } else if (segment == 1) {
                // medium heat - red is full brightness, green is ramped, blue is off
                heatramp[i] = [
                    255,        // red
                    heat_level, // green
                    0           // blue
                ]; 

            } else {
                // lowest heat - red is ramped, green and blue are off
                heatramp[i] = [
                    heat_level, // red
                    0,          // green
                    0           // blue
                ]; 

            }
        }
        // heatramp now contains an RGB color ramp for fire colors based on
        // a heat value
        return heatramp;
    }

    function byte_clamp(byte) {
        if (byte <= 255) {
            return byte;
        } else {
            return 255;
        }
    }

    function random_byte(max) {
        if (typeof max == 'undefined' || max > 255) {
            max = 255;
        }
        return Math.floor(Math.random() * max);
    }

    // fire_simulation_frame
    // returns a new fire animation frame based on a heat_color_map which maps 
    // heat values to colors, the current array of heat values, a cooling speed
    // (higher = quicker cooling) and a spark level, or if an array is provided
    // sparks for the first x leds
    // heat_array will be modified in place with new heat values.  
    // returns an array of color values
    this.fire_simulation_frame = function(heat_color_map, heat_array, cooling, sparks) {
        var size = heat_array.length;
        var colors_out = new Array(size);

        // cool all the cells down a little
        for (var i = 0; i < size; i++) {
            heat_array[i] = heat_array[i] - random_byte(((cooling * 10) / size) + 2) ;
        }

        // heat spreads upwards  
        for (var j = size - 3; size > 0; j--) {
            heat_array[j] = Math.floor( (heat_array[j-1] + heat_array[j-2] + heat_array[j-2]) / 3);
        }
        
        // sparking.  Two possibilities, we have a number, or we have an array.
        // if we have a number, it's a random possibility of sparking (between 0 and 255)
        // if we have an array, it's actual sparks to feed in.
        if (Array.isArray(sparks)) {
            // do array spark thing
            for (var k = 0, l = sparks.length; k < l; k++) {
                if (random_byte(255) < sparks[k]) {
                    heat_array[k] = byte_clamp(heat_array[k]+random_byte(95)+160);
                }
            }
        } else {
            if (random_byte(255) < sparks) {
                heat_array[random_byte(6)] = byte_clamp(heat_array[y]+random_byte(95)+160);
            }
        }

        for (var m = 0; m < size; m++) {
            colors_out[m] = heat_color_map[heat_array[m]];
        }
        return colors_out;
    }

    return this;
}
