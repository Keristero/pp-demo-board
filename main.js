const ws281x = require('rpi-ws281x');
const { Board, Sensor, Switch } = require("johnny-five");
const { rgb_to_decimal } = require('./helpers.js')
const board = new Board();
const {AnimatedSection} = require('./AnimatedSection')
var pot_reading;
var switch_state = false

board.on("ready", () => {
    var toggle = new Switch({
        pin: 4,
        type: "NC"
    });
    const potentiometer = new Sensor("A0");

    potentiometer.on("change", () => {
        const { value, raw } = potentiometer;
        pot_reading = value
        console.log(pot_reading)
    });

    // Switch Event API

    // "closed" the switch is closed
    toggle.on("close", () => {
        console.log("closed");
        switch_state = false
    });

    // "open" the switch is opened
    toggle.on("open", () => {
        console.log("open");
        switch_state = true
    });
});


class StripManager {
    constructor() {
        // Set my Neopixel configuration
        this.config = {
            leds: 300,
            gpio: 12,
            stripType: 'grb',
            dma: 10
        };

        this.rgb_pixels = []
        for (let i = 0; i < this.config.leds; i++) {
            this.rgb_pixels.push({ r: 0, g: 0, b: 0 })
        }
        this.uint_pixels = new Uint32Array(this.config.leds);

        // Configure ws281x
        ws281x.configure(this.config);
    }

    loop() {
        // Move on to next
        if (switch_state) {
            this.offset = (this.offset + 1) % this.config.leds;
        }

        for (let animated_section of animated_sections) {
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

var strip_manager = new StripManager();
const animated_sections = []
let test_strip_section = new AnimatedSection({
    start_led: 0,
    end_led: 20,
    direction_callback: (conditions) => {
        return -20
    }
})
animated_sections.push(test_strip_section)
let test_strip_section_2 = new AnimatedSection({
    start_led: 21,
    end_led: 41,
    direction_callback: (conditions) => {
        return -20
    }
})
animated_sections.push(test_strip_section_2)
let test_strip_section_3 = new AnimatedSection({
    start_led: 50,
    end_led: 100,
    direction_callback: (conditions) => {
        return -5
    }
})
animated_sections.push(test_strip_section_3)

const simulation_conditions = {}
strip_manager.run();