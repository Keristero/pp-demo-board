const postgres_manager = require('./PostgresManager')
const {RNG} = require('./helpers')
const {SOLAR_PANEL_POWER,HOT_WATER_POWER,CAR_CHARGER_POWER} = require('./environment')

const M11_name = "M11"
const M11_phase = 0
const M31_name = "M31"

let voltage_readings = {0:[],1:[],2:[]}

//TODO generate current readings for each device every second, then aggregate them every 5 seconds
//Basically just like I am with voltage readings
let current_readings = {
    "M11":{0:[]},
    "M31":{0:[],1:[],2:[]}
}

let last_conductor_down_alarm_state = false

postgres_manager.Query('DELETE from fake_data');

function generate_m11_fake_data(simulation_conditions){
    let voltage_pq_red = generate_voltage_pq(phase_id)
    let current = 0
    if(simulation_conditions.hot_water){
        current+=HOT_WATER_POWER
    }
    if(simulation_conditions.ev_charger){
        current+=CAR_CHARGER_POWER
    }
    if(simulation_conditions.solar_generation){
        current+=SOLAR_PANEL_POWER
    }
    let m11_data = {
        time:new Date(),
        phase:M11_phase,
        devicename:M11_name,
        ...voltage_pq_red,
        current:current
    }
    postgres_manager.Query('INSERT INTO public.fake_data VALUES(${this:csv})', m11_data);
}

function generate_m31_fake_data(simulation_conditions){
    if(simulation_conditions.conductor_down != last_conductor_down_alarm_state){
        generate_conductor_down_alarm(simulation_conditions.conductor_down)
        last_conductor_down_alarm_state = simulation_conditions.conductor_down
    }
    for(let phase = 0; phase <= 2; phase++){
        let voltage_pq = generate_voltage_pq(phase)
        let current = 150
        if (phase == M11_phase){
            if(simulation_conditions.hot_water){
                current+=HOT_WATER_POWER
            }
            if(simulation_conditions.ev_charger){
                current+=CAR_CHARGER_POWER
            }
            if(simulation_conditions.solar_generation){
                current+=SOLAR_PANEL_POWER
            }
        }
        let m31_data = {
            time:new Date(),
            phase:phase,
            devicename:M31_name,
            ...voltage_pq,
            current:current
        }
        postgres_manager.Query('INSERT INTO public.fake_data VALUES(${this:csv})', m31_data);
    }
}

function generate_conductor_down_alarm(conductor_is_down){
    let alarm_type = conductor_is_down ? "Grounded Conductor" : "Balanced"
    let alarm = {
        time:new Date(),
        type:alarm_type,
        devicename:M31_name
    }
    postgres_manager.Query('INSERT INTO public.fake_alarms VALUES(${this:csv})', m11_data);
}

function generate_fake_readings(simulation_conditions){
    //function called frequently to record fake readings
    //generate voltage readings
    for(let phase = 0; phase <= 2; phase++){
        voltage_readings[phase].push(get_voltage_reading(simulation_conditions))
    }
}

function generate_fake_data(simulation_conditions){
    generate_m11_fake_data(simulation_conditions,voltage_pq_red)
    generate_m31_fake_data(simulation_conditions,voltage_pq_red)
    //Clear voltage readings till next data is generated
    for(let phase = 0; phase <= 2; phase++){
        voltage_readings[phase_id] = []
    }
}

async function clear_fake_data(){
    await postgres_manager.Query(`drop * from public.fake_alarms`)
    await postgres_manager.Query(`drop * from public.fake_data`)
}


function generate_voltage_pq(phase_id){
    //process fake voltage readings since last check to generate voltage pq info
    let sum = voltage_readings[phase_id].reduce((a, b) => a + b, 0);
    let average = (sum / voltage_readings[phase_id].length) || 0;
    let voltages = {
        voltagemin:Math.min(...voltage_readings[phase_id]),
        voltagemax:Math.max(...voltage_readings[phase_id]),
        voltagesma:average
    }
    voltage_readings[phase_id] = []
    return voltages
}

function generate_current_pq(phase_id){
    //process fake voltage readings since last check to generate voltage pq info
    let sum = voltage_readings[phase_id].reduce((a, b) => a + b, 0);
    let average = (sum / voltage_readings[phase_id].length) || 0;
    let voltages = {
        voltagemin:Math.min(...voltage_readings[phase_id]),
        voltagemax:Math.max(...voltage_readings[phase_id]),
        voltagesma:average
    }
    voltage_readings[phase_id] = []
    return voltages
}


function get_voltage_reading({network_load_float}){
    let min_voltage = 230-(network_load_float*15)
    let max_voltage = min_voltage+(2+(network_load_float*3))
    return RNG(min_voltage,max_voltage)
}

module.exports = {generate_fake_data,clear_fake_data,generate_fake_readings}