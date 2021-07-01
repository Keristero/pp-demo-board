
const {EnergyDirectionSection} = require('./EnergyDirectionSection')
const {PixelIndicatorSection} = require('./PixelIndicatorSection')
const StripManager = require('./StripManager')
const {Sleep} = require('./helpers')
const {SOLAR_PANEL_POWER,HOT_WATER_POWER,CAR_CHARGER_POWER} = require('./environment')
const {generate_fake_data,clear_fake_data,generate_fake_readings} = require('./FakeDataGenerator')
const five = require("johnny-five");
var pot_reading;
var switch_state = false

//input pin to data name mapping
const analog_pins = {"A0":"network_load_pot"}
const bool_pins = {"A1":"day_night","A2":"conductor_down","A3":"hot_water","A4":"ev_charger"}

let input_values = {
    network_load_pot:0,
    day_night:true,
    hot_water:true,
    ev_charger:true,
    conductor_down:true
}
let network_conditions

const board = new five.Board({repl:false});
board.on("ready",()=>{
    const hot_water_relay = new five.Pin(12);
    const ev_charger_relay = new five.Pin(13);
    let last_hot_water_state = false
    let last_ev_charger_state = false
    setInterval(()=>{
        if(network_conditions){
            set_net_relay_state(hot_water_relay,network_conditions.hot_water,last_hot_water_state)
            set_net_relay_state(ev_charger_relay,network_conditions.ev_charger,last_ev_charger_state)
            last_hot_water_state = network_conditions.hot_water
            last_ev_charger_state = network_conditions.ev_charger
        }
    },250);

    //Read switch inputs
    for(let pin_id in bool_pins){
        let name = bool_pins[pin_id]
        let pin = new five.Pin({pin:pin_id,type:"analog",mode:0});
        pin.read((err,value)=>{
            if(value > 1000){
                input_values[name] = true
            }else{
                input_values[name] = false
            }
        })
    }

    //Read potentiometer input
    for(let pin_id in analog_pins){
        let name = analog_pins[pin_id]
        let sensor = new five.Sensor({pin:pin_id});
        sensor.on('change',(err,value)=>{
            input_values[name] = sensor.fscaleTo(0,1)
        })
    }
});

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
    on_rgb_color:{r:255,g:0,b:0}
})
strip_manager.add_animated_section(indicator_conductor_down)

let indicator_ev_charging = new PixelIndicatorSection({led_index:1,
    lit_callback:({ev_charger})=>{return ev_charger},
    on_rgb_color:{r:0,g:255,b:0}
})
strip_manager.add_animated_section(indicator_ev_charging)

let indicator_day = new PixelIndicatorSection({led_index:2,
    lit_callback:({solar_generation})=>{return solar_generation},
    color_callback:()=>{
        if(!this.sun_pulse){
            this.sun_pulse = 128
            this.sun_pulse_direction = 0.5
        }
        if(this.sun_pulse >= 255){
            this.sun_pulse_direction *= -1
        }
        if(this.sun_pulse <= 200){
            this.sun_pulse_direction *= -1
        }
        this.sun_pulse = Math.max(200,Math.min(255,this.sun_pulse+this.sun_pulse_direction))
        return {r:this.sun_pulse,g:this.sun_pulse*0.5,b:0}
    }
})
strip_manager.add_animated_section(indicator_day)

let indicator_hot_water = new PixelIndicatorSection({led_index:3,
    lit_callback:({hot_water})=>{return hot_water},
    on_rgb_color:{r:255,g:0,b:0}
})
strip_manager.add_animated_section(indicator_hot_water)
//
//Energy direction sections
//
let house_to_m11 = new EnergyDirectionSection({
    start_led: 4,
    end_led: 13,
    flow_callback: ({solar_generation,hot_water,ev_charger}) => {
        let direction = (solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    },
})
strip_manager.add_animated_section(house_to_m11)

let m11_to_m31 = new EnergyDirectionSection({
    start_led: 14,
    end_led: 38,
    flow_callback: ({solar_generation,hot_water,ev_charger,network_load_float}) => {
        let direction = (20*network_load_float)+15+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    },
})
strip_manager.add_animated_section(m11_to_m31)

let m31_to_grid_part_1 = new EnergyDirectionSection({
    start_led: 39,
    end_led: 48,
    flow_callback: ({solar_generation,hot_water,ev_charger,network_load_float}) => {
        let direction = 0
        return direction
    },
    pulse_for_conductor_down:true
})
strip_manager.add_animated_section(m31_to_grid_part_1)
let m31_to_grid_normal = new EnergyDirectionSection({
    start_led: 39,
    end_led: 60,
    flow_callback: ({solar_generation,hot_water,ev_charger,network_load_float,conductor_down}) => {
        let direction = 0
        if(!conductor_down){
            direction = (50*network_load_float)+15+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        }
        return direction
    },
})
strip_manager.add_animated_section(m31_to_grid_normal)

let conductor_down_strip = new EnergyDirectionSection({
    start_led: 61,
    end_led: 71,
    flow_callback: ({solar_generation,hot_water,ev_charger,network_load_float,conductor_down}) => {
        let direction = 0
        if(conductor_down){
            direction = (50*network_load_float)+10+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        }
        return direction
    },
    reverse_direction:true,
    pulse_for_conductor_down:true
})
strip_manager.add_animated_section(conductor_down_strip)

/*
let conductor_down_1 = new EnergyDirectionSection({
    start_led: 61,
    end_led: 67,
    flow_callback: ({solar_generation,hot_water,ev_charger,network_load_float}) => {
        let direction = (-50*network_load_float)+(-10)+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
strip_manager.add_animated_section(conductor_down_1)
*/

//Main loop
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