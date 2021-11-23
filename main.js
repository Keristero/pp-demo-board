
const StripManager = require('./StripManager')
const { Sleep } = require('./helpers')
const { DEMO_BOARD_TYPE,STARTUP_DATE } = require('./environment')
const { generate_fake_data, clear_fake_data, generate_fake_readings } = require('./FakeDataGenerator')
const { pelican_board_setup } = require('./pelican-board')
const { og_board_setup } = require('./og-board')
const five = require("johnny-five");
var pot_reading;
var switch_state = false

let { exec } = require('child_process')

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
async function sh(cmd) {
    return new Promise(function (resolve, reject) {
        console.log(`running shell command "${cmd}"`)
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

if(STARTUP_DATE != false){
    console.log(`setting container date to ${STARTUP_DATE}`)
    sh(`date --set="${STARTUP_DATE}"`);
    console.log(`date set to ${new Date()}`)
}

//100 to 250
//235 loaded at transformer
//240 normally at transformer
//225 loaded at house
//235 low network load at house
if (DEMO_BOARD_TYPE == 1) {
    //Original Board
    console.log("Using original demo board config")

    //input pin to data name mapping
    var analog_pins = { "A0": "network_load_pot" }
    var bool_pins = { "A1": "day_night", "A2": "conductor_down", "A3": "hot_water", "A4": "ev_charger","A5":"rcd_switch" }
} else if (DEMO_BOARD_TYPE == 2) {
    //Pelican board
    console.log("Using pelican board config")

    //input pin to data name mapping
    var analog_pins = { "A0": "network_load_pot" }
    var bool_pins = { "A1": "ev_charger", "A2": "hot_water", "A3": "conductor_down", "A4": "day_night","A5":"rcd_switch"  }
}

let input_values = {
    network_load_pot: 0,
    day_night: true,
    hot_water: true,
    ev_charger: true,
    conductor_down: true,
    rcd_switch:true,
}
let network_conditions

const board = new five.Board({ repl: false });
board.on("ready", () => {
    const hot_water_relay = new five.Pin(12);
    const ev_charger_relay = new five.Pin(13);
    let last_hot_water_state = false
    let last_ev_charger_state = false
    setInterval(() => {
        if (network_conditions) {
            set_net_relay_state(hot_water_relay, network_conditions.hot_water, last_hot_water_state)
            set_net_relay_state(ev_charger_relay, network_conditions.ev_charger, last_ev_charger_state)
            last_hot_water_state = network_conditions.hot_water
            last_ev_charger_state = network_conditions.ev_charger
        }
    }, 250);

    //Read switch inputs
    for (let pin_id in bool_pins) {
        let name = bool_pins[pin_id]
        let pin = new five.Pin({ pin: pin_id, type: "analog", mode: 0, isPullup: true });
        pin.read((err, value) => {
            //normal old code
            if (value > 1000) {
                input_values[name] = true
            } else {
                input_values[name] = false
            }
        })
    }

    //Read potentiometer input
    for (let pin_id in analog_pins) {
        let name = analog_pins[pin_id]
        let sensor = new five.Sensor({ pin: pin_id });
        sensor.on('change', (err, value) => {
            input_values[name] = sensor.fscaleTo(0, 1)
        })
    }
});

function debounce_pot_threshhold(threshhold, was_over_threshold, debounce_amount) {
    if (!was_over_threshold) {
        return threshhold
    } else {
        return threshhold - debounce_amount
    }
}

function determineNetworkConditions({ network_load_pot, day_night, hot_water, ev_charger, conductor_down ,rcd_switch}, last_coditions) {
    let conditions = {
        network_load_float: network_load_pot,
        hot_water: true,
        ev_charger: true,
        high_network_load: false,
        solar_generation: false,
        conductor_down: !conductor_down,
        rcd_switch: rcd_switch
    }
    //Read pot with debounce
    if (last_coditions) {
        if (network_load_pot > debounce_pot_threshhold(0.6, !last_coditions.hot_water, 0.05)) {
            conditions.high_network_load = true
            conditions.hot_water = false
            if (input_values.network_load_pot > debounce_pot_threshhold(0.9, !last_coditions.ev_charger, 0.05)) {
                conditions.ev_charger = false
            }
        }
    }
    if (day_night) {
        conditions.solar_generation = true
    }
    if (!hot_water) {
        conditions.hot_water = false
    }
    if (!ev_charger) {
        conditions.ev_charger = false
    }
    return conditions
}

function set_net_relay_state(relay_gpio, state, last_state) {
    if (state != last_state) {
        if (state) {
            console.log('switched relay on')
            relay_gpio.high()
        } else {
            console.log('switched relay off')
            relay_gpio.low()
        }
    }
}

if (DEMO_BOARD_TYPE == 1) {
    //Original Board
    let leds = 72
    let gpio = 12
    var strip_manager = new StripManager(leds, gpio);
    og_board_setup(strip_manager)
} else if (DEMO_BOARD_TYPE == 2) {
    //Pelican board
    let leds = 109
    let gpio = 21
    var strip_manager = new StripManager(leds, gpio);
    pelican_board_setup(strip_manager)
}


//Main loop
setInterval(() => {
    network_conditions = determineNetworkConditions(input_values, network_conditions)
    strip_manager.loop(network_conditions)
}, 5)

clear_fake_data()

//Fake data generation
setInterval(() => {
    generate_fake_data(network_conditions)
}, 5000)

setInterval(() => {
    generate_fake_readings(network_conditions)
    console.log(input_values)
}, 1000)