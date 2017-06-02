// Display module for handling color strips independently of 
// display.  Essentially creates a buffer that can be
// copied en-masse to the fadecandy display
var util = require('util')

module.exports = function Display() { 
    this.strips = [];
    this.changes = [];

    // create a strip and initialize it;
    this.setup_strip = function(strip_num, strip_len, default_color) {
        if (typeof default_color == 'undefined') {
            default_color = [0,0,0];
        }
        console.log(util.inspect(default_color));
        this.strips[strip_num] = new Array(strip_len);
        this.changes[strip_num] = new Array(strip_len);
        for (var i = 0; i < strip_len; i++) {
            this.strips[strip_num][i] = default_color.slice();
            this.changes[strip_num][i] = true;
        }
    };
    
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
    
    this.set_pixel= function( strip, position, color) {
        var c = this.clean_color(color);
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
        
        var strip, pixel_offset = 0;
//        var count =0;
        for (var i = 0, l = this.strips.length; i < l; i++) {
            strip = this.strips[i];
            for (var j = 0, k = strip.length; j < k; j++) {
                color = strip[j];
                if (this.changes[i][j] == true) {
//                    count++;
                    client.setPixel(pixel_offset + j, color[0], color[1], color[2]);
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

