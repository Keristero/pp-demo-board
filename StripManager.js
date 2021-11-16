const {LEDS_TOTAL,LEDS_DMA,LEDS_GPIO,LEDS_TYPE} = require('./environment')
const { rgb_to_decimal } = require('./helpers.js')
const ws281x = require('rpi-ws281x');

class StripManager {
    constructor(leds,gpio) {
        // Set my Neopixel configuration
        this.config = {
            leds: leds,
            gpio: gpio,
            stripType: LEDS_TYPE,
            dma: LEDS_DMA
        };

        this.rgb_pixels = []
        for (let i = 0; i < this.config.leds; i++) {
            this.rgb_pixels.push({ r: 0, g: 0, b: 0 })
        }
        this.uint_pixels = new Uint32Array(this.config.leds);
        this.animated_sections = []

        // Configure ws281x
        ws281x.configure(this.config);
    }
    add_animated_section(new_section){
        this.animated_sections.push(new_section)
    }

    loop(simulation_conditions) {
        // Move on to next
        /*
        if (switch_state) {
            this.offset = (this.offset + 1) % this.config.leds;
        }
        */

        for (let animated_section of this.animated_sections) {
            animated_section.UpdateStrip(this.rgb_pixels,simulation_conditions)
        }

        // Convert rgb values to uint for rendering to strip
        for (let index in this.rgb_pixels) {
            let rgb = this.rgb_pixels[index]
            this.uint_pixels[index] = rgb_to_decimal(rgb)
        }
        // Render to strip
        ws281x.render(this.uint_pixels);
    }

    run() {
        // Loop every 100 ms
        setInterval(() => {
            this.loop()
        }, 5)
    }
};

module.exports = StripManager