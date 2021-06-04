const postgres_manager = require('./PostgresManager')
const {RNG} = require('./helpers')

const lastVoltageReading = 230

function generate_fake_data(simulation_conditions){
    console.log(simulation_conditions)
    console.log(generate_phase_pq(simulation_conditions))
}

function generate_phase_pq(simulation_conditions){
    let voltage_readings = []
    for(let i = 0; i < 5; i++){
        voltage_readings.push(get_voltage_reading(simulation_conditions))
    }
    const sum = voltage_readings.reduce((a, b) => a + b, 0);
    const average = (sum / voltage_readings.length) || 0;
    let pq = {
        MIN:Math.min(...voltage_readings),
        MAX:Math.max(...voltage_readings),
        SMA:average
    }
    return pq
}


function get_voltage_reading({network_load_float}){
    let min_voltage = 230-(network_load_float*15)
    let max_voltage = min_voltage+(2+(network_load_float*3))
    return RNG(min_voltage,max_voltage)
}

module.exports = {generate_fake_data}