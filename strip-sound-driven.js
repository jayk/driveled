#!/usr/bin/env node

// Simple red/blue fade with Node and opc.js

var OPC = new require('./opc')
var client = new OPC('lightbox.local', 7890);
var Display = require('./Display');
var display = new Display();

var multiplier = 2; //10;
var scale = 2;
var mirror = 0;

var max = 0;
var count = 0;
var over_count = 0;

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});
var prev_data = [];
var diff_samples = [];
var diff_sum = 0;
var sample_num = 0;

rl.on('line', function(data){
    var diff = 0;
    var max_diff = 0;
    //console.log(line);
    //console.log("recieved ", data)
    var parsed_data = data.split(';');
    var pixeldata = parsed_data.map( x => {
        return Math.floor(parseInt(x) * scale);
    });
   
    for (var i = 0, len = prev_data.length; i < len; i++) {
        diff = Math.abs(prev_data[i] - parsed_data[i]);
        if (diff > max_diff) {
            max_diff = diff;
        }
        if (diff > 5) {
            break;
        }
    }
    diff_samples[sample_num] = max_diff;
    if (sample_num >= 10) {
        sample_num = 0;
    }
    if (max_diff < 4) {
        diff_sum = 0;
        for (i = 0, len = diff_samples.length; i < len; i++) {
            diff_sum += diff_samples[i];
        }
    }
    
    //console.log('max_diff: ', max_diff);
    //console.log('diff_sum: ', diff_sum);
    //console.log('sample_num: ', sample_num);
    //console.log('diff_samples: ', diff_samples);
    sample_num++;
    prev_data = parsed_data;

//    console.log('pixel:', pixeldata);
    if (diff_sum > 16 && scale <= 2 ) {
        scale += 0.4;
    } else if (diff_sum <= 16) {
        scale -= 0.2;
        if (scale < 0) {
            scale = 0.01;
        }
    }
    draw(pixeldata);
});

var rotate = 0;
var strip_size = 48;
var vu_meter_top_level = 0;
var vu_meter_falloff_timer;

display.setup_strip(0, { 
    strip_len: strip_size, 
    default_color: display.get_color(200,0,0), 
    reversed: false,
});
display.setup_strip(1, { 
    strip_len: strip_size, 
    default_color: display.get_color(200,0,0), 
    reversed: true,
});
display.setup_strip(2, { 
    strip_len: strip_size, 
    default_color: display.get_color(0,0,0), 
    reversed: false,
});
//display.setup_strip(2, { strip_len: strip_size, default_color: display.get_color(200,0,0), reversed: false, });

function draw(channels) {

    var total_leds = strip_size;
    if (mirror) {
        total_leds = total_leds / 2;
    }

    var vu_color;
    var skew;
    var num_channels = channels.length - 1;
    var channels_per_side = Math.floor(num_channels/ 2);
    var width = Math.floor(total_leds / channels_per_side);
    var remainder = total_leds % num_channels;

//    console.log('channels: ', num_channels);
//    console.log('width: ', width);
    
    var red,green,blue;
    var base = 10;
    
    var r=1 ; // 0.5;
    var g= 0.5;
    var b= 0.75 ; // 1;
    
    var pos;
    var pixel;
    var combined_level = 0;
    var vu_meter_len = 0;
    var level = 0;

    for (pos = 0; pos < num_channels; pos++)
    {
	if (channels[pos] < 1001) {
                level = channels[pos]; //  multiplier * parseInt(channels[pos]); 
                combined_level += level;

		b = 1; //  1; 0.5 ;
		r = 0.9 * (level / 256);
		g = 0.5 * (level / 256);
		red = base + Math.floor( r * level); 
		green = base + Math.floor( g * level);
		blue = base + Math.floor( b * level);

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

		if (count > 60) {
		    count = 0;
		    // re-evaluate
		    if (max < 96 && multiplier < 30) {
			multiplier = multiplier + 1
			//console.log("Adjusted multiplier Upwards: ", multiplier);
		    } else if (over_count > 10 && max >= 250 && multiplier > 16) {
			multiplier = multiplier - 1;
			//console.log("Adjusted multiplier Downwards: ", multiplier);
		    }
		    max = 0;
                    over_count = 0;
		} else {
		    count++;
		    if (green > max) {
			max = green;
                        over_count++;
		    }
		    if (red > max) {
			max = red;
                        over_count++;
		    }
		    if (blue > max) {
			max = blue;
                        over_count++;
		    }
		} 

                //console.log('m r g b: ', multiplier, red, green, blue);
                if (pos < channels_per_side) {
		    pixel = pos * width;
                    display.set_pixels(0, pixel, pixel+width, display.get_color(red, green, blue));
                } else {
		    pixel = (pos - channels_per_side) * width;
                    display.set_pixels(1, pixel, pixel+width, display.get_color(red, green, blue));
                }
                // display.set_pixels(2, pixel, pixel+width, display.get_color(red, green, blue));
	//        var t = pixel * 0.2 + millis * 0.002;
	//        var red = 0;
	}
    }
    vu_meter_len = (Math.ceil(((combined_level / num_channels) / 256)  * strip_size) -1);
     //console.log('level, c, vu, max: ', level, combined_level, vu_meter_len, vu_meter_top_level);
    if (vu_meter_len > vu_meter_top_level) {
        vu_meter_top_level = vu_meter_len;
        if (vu_meter_falloff_timer != undefined) {
            clearTimeout(vu_meter_falloff_timer);
        }
        vu_meter_falloff_timer = setTimeout(function() {
            vu_meter_top_level = 0;
            vu_meter_falloff_timer = undefined;
        }, 1000);
    }

    for (var i = 0; i < strip_size; i++) {
        if (i > 0 && i == vu_meter_top_level) {
            display.set_pixel(2, i, display.get_color(255, 100, 100));
        } else if (i <= vu_meter_len) {
            vu_color = [ 0, 200, 50 ];
            if (i > 6) { 
                // skew - the closer to the end we get, the more red we add.
                skew = Math.floor(200 * (i - 6) / strip_size);
                vu_color[0] += 2* skew;
                vu_color[1] -= Math.floor(1.5 * skew);
            }
            display.set_pixel(2, i, display.get_color(vu_color[0], vu_color[1], vu_color[2]));
        } else {
            display.set_pixel(2, i, display.get_color(0, 0, 0));
        }

    }


    display.write_to_opc(client);
    //client.writePixels();
}

//setInterval(draw, 30);
