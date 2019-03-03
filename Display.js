// Display module for handling color strips independently of 
// display.  Essentially creates a buffer that can be
// copied en-masse to the fadecandy display
var util = require('util');
var tc = require('./tinycolor');

module.exports = function Display() { 
    this.strips = [];
    this.changes = [];
    this.strip_attributes = [];


    // create a strip and initialize it;
    this.setup_strip = function(strip_num, opts) {
        var strip_len;
        this.strip_attributes[strip_num] = {
            strip_len: opts.strip_len,
            reversed: false,
            // adjustments = hue / saturation / luminosity
//            adjustments: {}
        };

        if (typeof opts.reversed == 'boolean') {
            this.strip_attributes[strip_num].reversed = opts.reversed;
        }
        if (typeof opts.adjustments == 'object') {
            this.strip_attributes[strip_num].adjustments = opts.adjustments;
        }
        if (Array.isArray(opts.default_color)) {
            this.strip_attributes[strip_num].default_color = this.get_color.apply(this, opts.default_color);
        } else {
            this.strip_attributes[strip_num].default_color = [0,0,0];
        }
        console.log("strip_attributes", this.strip_attributes[strip_num]);
        strip_len = this.strip_attributes[strip_num].strip_len;

        this.strips[strip_num] = new Array(strip_len);
        this.changes[strip_num] = new Array(strip_len);
        var default_color = this.strip_attributes[strip_num].default_color.slice();
        for (var i = 0; i < strip_len; i++) {
            this.strips[strip_num][i] = default_color;
            this.changes[strip_num][i] = true;
        }
        console.log(this.strips);
    };

    // resets entire strip to color provided, or if not provided, default_color;
    // (does not run the change, just resets the colors)
    this.clear_strip = function(strip_num, optional_color) {
        var color;
        var strip_len = this.strip_attributes[strip_num].strip_len;

        if (Array.isArray(optional_color)) {
            color = optional_color.slice();
        } else {
           color = this.strip_attributes.default_color.slice();
        }

        for (var i = 0; i < strip_len; i++) {
            this.strips[strip_num][i] = color;
            this.changes[strip_num][i] = true;
        }
    }
    
    this.get_color = function(red, green, blue) {
        return this.clean_color([ red, green, blue ]);
    };

    this.clean_color = function(color) {
        for (var i = 0; i < 3; i++) {
            if (color[i] > 255) {
                color[i] = 255;
            }
            if (color[i] < 0) {
                color[i] = 0;
            }
        }
        return color;
    };

    function to_triple(rgb_object) {
        return [ rgb_object.r, rgb_object.g, rgb_object.b ];
    }

    // perform hsl adjustments on a given rgb triplet.
    this.adjust_color = function(color_triple, adjustment) {
        var color = tc({
            r: color_triple[0],
            g: color_triple[1],
            b: color_triple[2]
        });
        if (typeof adjustment.hue == 'number') {
            color = color.spin(adjustment.hue);
        }
        if (typeof adjustment.saturation == 'number') {
            if (adjustment.saturation > 0) {
                color = color.saturate(adjustment.saturation);
            } else {
                color = color.desaturate(Math.abs(adjustment.saturation));
            }
        }
        if (typeof adjustment.luminosity == 'number') {
            if (adjustment.luminosity > 0) {
                color = color.lighten(adjustment.luminosity);
            } else {
                color = color.darken(Math.abs(adjustment.luminosity));
            }
        }

        //console.log(color.toHex())

        return to_triple(color.toRgb())
    }
    
    this.set_pixel= function( strip, position, color) {
        var c = this.clean_color(color);
        if (typeof this.strip_attributes[strip].adjustments == 'object') {
            c = this.adjust_color(c, this.strip_attributes[strip].adjustments);
        }
        if (this.strips[strip].length > position) {
//            var d= this.strips[strip][position].slice();
            // we only change the color if the color actually changed
            if (this.strips[strip][position][0] != c[0] || 
                this.strips[strip][position][1] != c[1] || 
                this.strips[strip][position][2] != c[2]) {
                this.strips[strip][position] = c;
                this.changes[strip][position] = true;
            }
        }
    };

    this.set_pixels= function( strip, startpos, endpos, color) {
        var c = this.clean_color(color);
        if (typeof this.strip_attributes[strip].adjustments == 'object') {
            c = this.adjust_color(c, this.strip_attributes[strip].adjustments);
        }
        for (var i = startpos; i < endpos; i++) {
            if (this.strips[strip][i][0] != c[0] || this.strips[strip][i][1] != c[1] || this.strips[strip][i][1] != c[1]) {
                this.changes[strip][i] = true;
                this.strips[strip][i] = c;
            }
        }
    };

    this.get_strip= function(strip) {
        return this.strips[strip];
    };

    this.write_to_opc = function(client) {
        // when talking to a fadecandy, each physical connection is expected
        // to have 64 pixels.  Therefore to go to the second strip, we must advance
        // the pixel position by 64 for each one.
        
        var strip, reversed = false, pixel_offset = 0, cur_pixel;
//        var count =0;
        for (var i = 0, l = this.strips.length; i < l; i++) {
            strip = this.strips[i];
            for (var j = 0, k = strip.length; j < k; j++) {
                reversed = this.strip_attributes[i].reversed;
                color = strip[j];
                if (this.changes[i][j] == true) {
//                    count++;
                    if (reversed) {
                        cur_pixel = pixel_offset + (k - j -1);
                    } else {  
                        cur_pixel = pixel_offset + j;
                    }
                    client.setPixel(cur_pixel, color[0], color[1], color[2]);
                    this.changes[i][j] = false;
                }
            }
            pixel_offset += 64;
        }
        client.writePixels();
//        console.log('Updated ' +count + ' pixels.');
    };

    return this;
};

