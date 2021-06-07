
const {EnergyDirectionSection} = require('./EnergyDirectionSection')
const {PixelIndicatorSection} = require('./PixelIndicatorSection')
const StripManager = require('./StripManager')
const {Sleep} = require('./helpers')
const {SOLAR_PANEL_POWER,HOT_WATER_POWER,CAR_CHARGER_POWER} = require('./environment')
const {generate_fake_data,clear_fake_data,generate_fake_readings} = require('./FakeDataGenerator')
var pot_reading;
var switch_state = false

const Firmata = require("firmata");
const board = new Firmata('/dev/ttyUSB1');

//input pin to data name mapping
const analog_pins = {0:"network_load_pot"}
const digital_pins = {19:"day_night",18:"conductor_down",17:"hot_water",16:"ev_charger"}

//Wait time between reading arduino inputs
const read_wait_time = 100

function ReadPinAsync(board,pin_id,is_analog=false){
    return new Promise((resolve)=>{
        if(is_analog){
            board.analogRead(pin_id,(pin_value)=>{
                resolve(pin_value)
            })
        }else{
            board.digitalRead(pin_id,(pin_value)=>{
                resolve(pin_value)
            })
        }
    })
}

function OnAnalogValue(pin_id,value){
    if(analog_pins[pin_id]){
        input_values[analog_pins[pin_id]] = value
    }
}

function OnDigitalValue(pin_id,value){
    if(digital_pins[pin_id]){
        input_values[digital_pins[pin_id]] = value
    }
}

board.on("ready", async() => {
    console.log('board ready')
    console.log(board.pins)

    for(let pin_id in digital_pins){
        board.pinMode(pin_id,board.MODES.INPUT)
    }

    console.log('last analog index',board.pins.length-1)
    
    while(true){
        for(let pin_id in analog_pins){
            let pin_value = await ReadPinAsync(board,pin_id,true)
            board.reportAnalogPin(pin_id, 0) //stop checking this analog pin until our next reading
            OnAnalogValue(pin_id,pin_value) //record latest reading
            //console.log(pin_id,pin_value)
            await Sleep(read_wait_time)
        }
        for(let pin_id in digital_pins){
            let pin_value = await ReadPinAsync(board,pin_id,false)
            OnDigitalValue(pin_id,pin_value) //record latest reading
            //console.log(pin_id,pin_value)
            await Sleep(read_wait_time)
        }
    }
});

let input_values = {
    network_load_pot:0,
    day_night:true,
    hot_water:true,
    ev_charger:true,
    conductor_down:false
}

function debounce_pot_threshhold(threshhold,was_over_threshold,debounce_amount){
    if(!was_over_threshold){
        return threshhold
    }else{
        return threshhold-debounce_amount
    }
}

function determineNetworkConditions({network_load_pot,day_night,hot_water,ev_charger,conductor_down},last_coditions){
    let conditions = {
        network_load_float:network_load_pot,
        hot_water:true,
        ev_charger:true,
        high_network_load:false,
        solar_generation:false,
        conductor_down:conductor_down
    }
    //Read pot with debounce
    if(last_coditions){
        if(network_load_pot > debounce_pot_threshhold(0.6,!last_coditions.hot_water,0.05)){
            conditions.high_network_load = true
            conditions.hot_water = false
            if(input_values.network_load_pot > debounce_pot_threshhold(0.8,!last_coditions.ev_charger,0.05)){
                conditions.ev_charger = false
            }
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

/* johnny five
board.on("ready", function(){

    let frequency = 1000
    const sensors = new Sensors([ { pin: "A0",freq:300},  { pin: "A1",freq:700}, { pin: "A2",freq:frequency}, { pin: "A3",freq:frequency}, { pin: "A4",freq:frequency} ]);
    sensors.on('change',(sensor)=>{
        console.log(sensor.pin,sensor.value)
    })


    //old s11 relay control
    const hot_water_relay = new Pin(12);
    const ev_charger_relay = new Pin(13);
    let last_hot_water_state = false
    let last_ev_charger_state = false
    this.loop(250, ()=>{
        if(network_conditions){
            set_net_relay_state(hot_water_relay,network_conditions.hot_water,last_hot_water_state)
            set_net_relay_state(ev_charger_relay,network_conditions.ev_charger,last_ev_charger_state)
            last_hot_water_state = network_conditions.hot_water
            last_ev_charger_state = network_conditions.ev_charger
        }
    });
});
*/

function set_net_relay_state(relay_gpio,state,last_state){
    if(state != last_state){
        if(state){
            console.log('switched relay on')
            relay_gpio.high()
        }else{
            console.log('switched relay off')
            relay_gpio.low()
        }
    }
}

var strip_manager = new StripManager();
//
//Pixel Indicators
//
let indicator_conductor_down = new PixelIndicatorSection({led_index:0,
    lit_callback:({conductor_down})=>{return conductor_down},
    on_rgb_color:{r:255,g:100,b:100}
})
strip_manager.add_animated_section(indicator_conductor_down)

let indicator_ev_charging = new PixelIndicatorSection({led_index:1,
    lit_callback:({ev_charger})=>{return ev_charger},
    on_rgb_color:{r:255,g:128,b:0}
})
strip_manager.add_animated_section(indicator_ev_charging)

let indicator_day = new PixelIndicatorSection({led_index:2,
    lit_callback:({solar_generation})=>{return solar_generation},
    on_rgb_color:{r:255,g:225,b:100}
})
strip_manager.add_animated_section(indicator_day)

let indicator_hot_water = new PixelIndicatorSection({led_index:3,
    lit_callback:({hot_water})=>{return hot_water},
    on_rgb_color:{r:255,g:128,b:0}
})
strip_manager.add_animated_section(indicator_hot_water)
//
//Energy direction sections
//
let house_to_m11 = new EnergyDirectionSection({
    start_led: 4,
    end_led: 13,
    direction_callback: ({solar_generation,hot_water,ev_charger}) => {
        let direction = (solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
strip_manager.add_animated_section(house_to_m11)

let m11_to_m31 = new EnergyDirectionSection({
    start_led: 14,
    end_led: 38,
    direction_callback: ({solar_generation,hot_water,ev_charger}) => {
        let direction = (-20)+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
strip_manager.add_animated_section(m11_to_m31)

let m31_to_grid = new EnergyDirectionSection({
    start_led: 39,
    end_led: 60,
    direction_callback: ({solar_generation,hot_water,ev_charger,network_load_float}) => {
        let direction = (-50*network_load_float)+(-10)+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
strip_manager.add_animated_section(m31_to_grid)

let conductor_down_1 = new EnergyDirectionSection({
    start_led: 39,
    end_led: 60,
    direction_callback: ({solar_generation,hot_water,ev_charger,network_load_float}) => {
        let direction = (-50*network_load_float)+(-10)+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
strip_manager.add_animated_section(conductor_down_1)


//Main loop
let network_conditions
setInterval(() => {
    network_conditions = determineNetworkConditions(input_values,network_conditions)
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

//control S11 relays
setInterval(() => {
    generate_fake_data(network_conditions)
}, 100)