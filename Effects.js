// OBSOLETE AND BROKEN.
// DO NOT USE
//   color adjustment module for working with color strips.
var util = require('util')

module.exports = function Effects() { 

    function normalize_rgb_value(color, m) {
        color = Math.floor((color + m) * 255);
        if (color < 0) {
            color = 0;
        }
        return color;
    }

    // takes a rgb color triplet array and returns an HSL object
    function rgb_to_hsl(rgb) {
        var r = rgb[0];
        var g = rgb[1];
        var b = rgb[2];
        var max = Math.max(r, g, b),
            min = Math.min(r, g, b),
            difference = max - min,
            h = 0,
            s = 0,
            l = (max + min) / 2;

        if (difference == 0) {
            h = 0;
        } else if (max == r) {
            h = 60 * (((g - b) / difference) % 6);
        } else if (max == g) {
            h = 60 * (((b - r) / difference) + 2);
        } else {
            h = 60 * (((r - g) / difference) + 4);
        }

        if (difference == 0) {
            s = 0;
        } else {
            s = (difference/(1-Math.abs(2*l - 1)))
        }

        return {
            h: h,
            s: s,
            l: l
        }
    }

    // expects an object and returns a string
    function hsl_to_rgb(hsl) {
        var h = hsl.h,
            s = hsl.s,
            l = hsl.l,
            c = (1 - Math.abs(2*l - 1)) * s,
            x = c * ( 1 - Math.abs((h / 60 ) % 2 - 1 )),
            m = l - c/ 2,
            r, g, b;

        if (h < 60) {
            r = c;
            g = x;
            b = 0;
        } else if (h < 120) {
            r = x;
            g = c;
            b = 0;
        } else if (h < 180) {
            r = 0;
            g = c;
            b = x;
        } else if (h < 240) {
            r = 0;
            g = x;
            b = c;
        } else if (h < 300) {
            r = x;
            g = 0;
            b = c;
        } else {
            r = c;
            g = 0;
            b = x;
        }

        r = normalize_rgb_value(r, m);
        g = normalize_rgb_value(g, m);
        b = normalize_rgb_value(b, m);

        return [r,g,b];
    }
    
    function clamp_value(byte, min, max) {
        if (byte <= max) {
            if (byte < min) {
                return min;
            } else {
                return byte;
            }
        } else {
            return max;
        }
    }

    // expose our functions;
    this.rgb_to_hsl = rgb_to_hsl;
    this.hsl_to_rgb = hsl_to_rgb;

    this.hue_shift_color = function(degree, rgb) {
        var hsl = rgb_to_hsl(rgb);
        hsl.h += degree;
        if (hsl.h > 360) {
            hsl.h -= 360;
        }
        else if (hsl.h < 0) {
            hsl.h += 360;
        }
        return hsl_to_rgb(hsl);
    }

    this.apply_adjustments = function(color, adjustments) {
        var new_color = color.slice();
        var hsl = rgb_to_hsl(rgb);
        if (typeof adjustments.hue != 'undefined') {
            hsl.h += adjustments.hue;
            if (hsl.h > 360) {
                hsl.h -= 360;
            }
            else if (hsl.h < 0) {
                hsl.h += 360;
            }
        }
        if (typeof adjustments.luminosity != 'undefined') {
            hsl.l = clamp_value(hsl.l + adjustments.luminosity, 0, 255);
        }
        if (typeof adjustments.saturation != 'undefined') {
            hsl.l = clamp_value(hsl.s + adjustments.saturation, 0, 255);
        }

    }


    // shifts an entire array of colors around the hue by degree
    this.hue_shift_array = function(degree, color_array) {
        var result = new Array(color_array.length);  

        for (var i = 0, l = color_array.length; i < l; i++) {
            result[i] = this.hue_shift_color(degree, color_array[i]);
        }
        return result;
    }

    return this;
};

