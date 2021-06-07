const postgres_manager = require('./PostgresManager')
const {RNG} = require('./helpers')
const {SOLAR_PANEL_POWER,HOT_WATER_POWER,CAR_CHARGER_POWER} = require('./environment')

const lastVoltageReading = 230
const M11_name = "M11"
const M11_phase = 0

postgres_manager.Query('DELETE from fake_data');

function generate_m11_fake_data(simulation_conditions){
    let voltage_pq = generate_voltage_pq(simulation_conditions)
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
        ...voltage_pq,
        current:current
    }
    //console.log(`adding fake m11 data`,m11_data)
    postgres_manager.Query('INSERT INTO public.fake_data VALUES(${this:csv})', m11_data);
}

function generate_fake_data(simulation_conditions){
    generate_m11_fake_data(simulation_conditions)
}

async function clear_fake_data(){
    await postgres_manager.Query(`drop * from public.fake_alarms`)
    await postgres_manager.Query(`drop * from public.fake_data`)
}


function generate_voltage_pq(simulation_conditions){
    let voltage_readings = []
    for(let i = 0; i < 5; i++){
        voltage_readings.push(get_voltage_reading(simulation_conditions))
    }
    let sum = voltage_readings.reduce((a, b) => a + b, 0);
    let average = (sum / voltage_readings.length) || 0;
    let voltages = {
        voltagemin:Math.min(...voltage_readings),
        voltagemax:Math.max(...voltage_readings),
        voltagesma:average
    }
    return voltages
}


function get_voltage_reading({network_load_float}){
    let min_voltage = 230-(network_load_float*15)
    let max_voltage = min_voltage+(2+(network_load_float*3))
    return RNG(min_voltage,max_voltage)
}

module.exports = {generate_fake_data,clear_fake_data}