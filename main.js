const ws281x = require('rpi-ws281x');
const { Board, Sensor, Switch } = require("johnny-five");
const { rgb_to_decimal } = require('./helpers.js')
const board = new Board();
const {EnergyDirectionSection} = require('./EnergyDirectionSection')
const {PixelIndicatorSection} = require('./PixelIndicatorSection')
const {DayNightSection} = require('./DayNightSection')
var pot_reading;
var switch_state = false

const MAX_POT_VALUE = 1023
const MIN_POT_VALUE = 0

const SOLAR_PANEL_POWER = 5 //5kw
const HOT_WATER_POWER = -2.4 //5kw
const CAR_CHARGER_POWER = -8 //5kw

let inputs = {
    network_load_pot:0,
    day_night:true,
    hot_water:true,
    ev_charger:true,
    conductor_down:false
}

function determineNetworkConditions({network_load_pot,day_night,hot_water,ev_charger,conductor_down}){
    let conditions = {
        network_load_float:network_load_pot,
        hot_water:true,
        ev_charger:true,
        high_network_load:false,
        solar_generation:false,
        conductor_down:conductor_down
    }
    if(network_load_pot > 0.6){
        conditions.high_network_load = true
        conditions.hot_water = false
        if(inputs.network_load_pot > 0.8){
            conditions.ev_charger = false
        }
    }
    if(day_night){
        conditions.solar_generation = true
    }
    if(!hot_water){
        conditions.hot_water = false
    }
    if(!ev_charger){
        conditions.ev_charger = false
    }
    return conditions
}

board.on("ready", () => {
    const potentiometer = new Sensor("A0");
    potentiometer.on("change", () => {
        inputs.network_load_pot = potentiometer.fscaleTo(0,1)
    });

    const day_night_switch = new Switch({
        pin: 4,
        type: "NC"
    });
    day_night_switch.on("close", () => {
        inputs.day_night = false
        console.log("closed");
    });
    day_night_switch.on("open", () => {
        inputs.day_night = true
        console.log("open");
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
        let simulation_conditions = determineNetworkConditions(inputs)
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

//Led strip sections
let day_night_section = new DayNightSection({start_led: 0,end_led: 30,
    is_day_callback: ({solar_generation}) => {return solar_generation}
})
animated_sections.push(day_night_section)

let pixel_high_network_load_section = new PixelIndicatorSection({led_index:31,
    lit_callback:({high_network_load})=>{return high_network_load},
    on_rgb_color:{r:255,g:0,b:0}
})
animated_sections.push(pixel_high_network_load_section)

let pixel_conductor_down_section = new PixelIndicatorSection({led_index:32,
    lit_callback:({conductor_down})=>{return conductor_down},
    on_rgb_color:{r:255,g:0,b:0}
})
animated_sections.push(pixel_conductor_down_section)

let solar_to_house = new EnergyDirectionSection({start_led: 33,end_led: 43,
    direction_callback: ({solar_generation}) => {return (solar_generation*SOLAR_PANEL_POWER)}
})
animated_sections.push(solar_to_house)

let pixel_hot_water_section = new PixelIndicatorSection({led_index:44,
    lit_callback:({hot_water})=>{return hot_water},
    on_rgb_color:{r:255,g:128,b:0}
})
animated_sections.push(pixel_hot_water_section)

let pixel_ev_charger_section = new PixelIndicatorSection({led_index:45,
    lit_callback:({ev_charger})=>{return ev_charger},
    on_rgb_color:{r:255,g:128,b:0}
})
animated_sections.push(pixel_ev_charger_section)

let house_to_m11 = new EnergyDirectionSection({
    start_led: 46,
    end_led: 61,
    direction_callback: ({solar_generation,hot_water,ev_charger}) => {
        let direction = (solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
animated_sections.push(house_to_m11)

let m11_to_m31 = new EnergyDirectionSection({
    start_led: 62,
    end_led: 77,
    direction_callback: ({solar_generation,hot_water,ev_charger}) => {
        let direction = (-10)+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
animated_sections.push(m11_to_m31)

let m31_to_grid = new EnergyDirectionSection({
    start_led: 78,
    end_led: 98,
    direction_callback: ({solar_generation,hot_water,ev_charger,network_load_float}) => {
        let direction = (-50*network_load_float)+(-10)+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
animated_sections.push(m31_to_grid)

const simulation_conditions = {}
strip_manager.run();