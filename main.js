const { Board, Sensor, Switch, Pin } = require("johnny-five");
const board = new Board();
const {EnergyDirectionSection} = require('./EnergyDirectionSection')
const {PixelIndicatorSection} = require('./PixelIndicatorSection')
const {DayNightSection} = require('./DayNightSection')
const StripManager = require('./StripManager')
const {SOLAR_PANEL_POWER,HOT_WATER_POWER,CAR_CHARGER_POWER} = require('./environment')
const {generate_fake_data,clear_fake_data} = require('./FakeDataGenerator')
var pot_reading;
var switch_state = false

const MAX_POT_VALUE = 1023
const MIN_POT_VALUE = 0

let inputs = {
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
            if(inputs.network_load_pot > debounce_pot_threshhold(0.8,!last_coditions.ev_charger,0.05)){
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

board.on("ready", function(){
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

//Led strip sections
let day_night_section = new DayNightSection({start_led: 0,end_led: 30,
    is_day_callback: ({solar_generation}) => {return solar_generation}
})
strip_manager.add_animated_section(day_night_section)

let pixel_high_network_load_section = new PixelIndicatorSection({led_index:31,
    lit_callback:({high_network_load})=>{return high_network_load},
    on_rgb_color:{r:255,g:0,b:0}
})
strip_manager.add_animated_section(pixel_high_network_load_section)

let pixel_conductor_down_section = new PixelIndicatorSection({led_index:32,
    lit_callback:({conductor_down})=>{return conductor_down},
    on_rgb_color:{r:255,g:0,b:0}
})
strip_manager.add_animated_section(pixel_conductor_down_section)

let solar_to_house = new EnergyDirectionSection({start_led: 33,end_led: 43,
    direction_callback: ({solar_generation}) => {return (solar_generation*SOLAR_PANEL_POWER)}
})
strip_manager.add_animated_section(solar_to_house)

let pixel_hot_water_section = new PixelIndicatorSection({led_index:44,
    lit_callback:({hot_water})=>{return hot_water},
    on_rgb_color:{r:255,g:128,b:0}
})
strip_manager.add_animated_section(pixel_hot_water_section)

let pixel_ev_charger_section = new PixelIndicatorSection({led_index:45,
    lit_callback:({ev_charger})=>{return ev_charger},
    on_rgb_color:{r:255,g:128,b:0}
})
strip_manager.add_animated_section(pixel_ev_charger_section)

let house_to_m11 = new EnergyDirectionSection({
    start_led: 250,
    end_led: 299,
    direction_callback: ({solar_generation,hot_water,ev_charger}) => {
        let direction = (solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)+50
        return direction
    }
})
strip_manager.add_animated_section(house_to_m11)

let m11_to_m31 = new EnergyDirectionSection({
    start_led: 62,
    end_led: 77,
    direction_callback: ({solar_generation,hot_water,ev_charger}) => {
        let direction = (-10)+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
strip_manager.add_animated_section(m11_to_m31)

let m31_to_grid = new EnergyDirectionSection({
    start_led: 78,
    end_led: 98,
    direction_callback: ({solar_generation,hot_water,ev_charger,network_load_float}) => {
        let direction = (-50*network_load_float)+(-10)+(solar_generation*SOLAR_PANEL_POWER)+(hot_water*HOT_WATER_POWER)+(ev_charger*CAR_CHARGER_POWER)
        return direction
    }
})
strip_manager.add_animated_section(m31_to_grid)


//Main loop
let network_conditions
setInterval(() => {
    network_conditions = determineNetworkConditions(inputs,network_conditions)
    //strip_manager.loop(network_conditions)
}, 5)

clear_fake_data()

//Fake data generation
setInterval(() => {
    generate_fake_data(network_conditions)
}, 1000)

//control S11 relays
setInterval(() => {
    generate_fake_data(network_conditions)
}, 100)