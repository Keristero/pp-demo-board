const postgres_manager = require('./PostgresManager')
const { RNG } = require('./helpers')
const { SOLAR_PANEL_POWER, HOT_WATER_POWER, CAR_CHARGER_POWER,CONDUCTOR_DOWN_ENERGY_MULTIPLIER} = require('./environment')

const M11_name = "M11"
const M11_phase = 0
const M31_name = "M31"

//Note from Rodger
//235 loaded at transformer
//240 normally at transformer

//225 loaded at house
//235 normally at house

//Storage for fake generated readings of current and voltage, generated every second for each phase.
//Every time data is saved to the database the readings are cleared from here
let fake_readings = {
    "M11": {
        voltage: { 0: [] },
        current: { 0: [] },
        power: { 0: [] }
    },
    "M31": {
        voltage: { 0: [], 1: [], 2: [] },
        current: { 0: [], 1: [], 2: [] },
        power: { 0: [], 1: [], 2: [] },
    }
}

let last_conductor_down_alarm_state = false
let last_rcd_alarm_state = false

postgres_manager.Query('DELETE from fake_data');

function m11_flow_callback({ solar_generation, hot_water, ev_charger, network_load_float, conductor_down }) {
    let consumption_multiplier = CONDUCTOR_DOWN_ENERGY_MULTIPLIER
    if (!conductor_down) {
        consumption_multiplier = 1
    }
    let direction = (!conductor_down * solar_generation * SOLAR_PANEL_POWER) + (((50 * network_load_float) + 15 + (hot_water * HOT_WATER_POWER) + (ev_charger * CAR_CHARGER_POWER)) * consumption_multiplier)
    return direction
}

function generate_m11_fake_data(simulation_conditions) {
    let m11_power_flow = m11_flow_callback(simulation_conditions)
    let voltage_pq_red = generate_pq_readings("voltage", fake_readings["M11"].voltage[M11_phase])
    let current_pq_red = generate_pq_readings("current", fake_readings["M11"].current[M11_phase])
    let power_pq_red = generate_pq_readings("power", fake_readings["M11"].power[M11_phase])

    //Voltage should be higher / lower on the m11 based on if it is generating or not
    //but the lower the network load, the smaller the difference from the m31
    let maximum_voltage_difference_multiplier = Math.max(0.3,simulation_conditions.network_load_float)
    let voltage_difference = (m11_power_flow*0.2*maximum_voltage_difference_multiplier)*-1
    for(let readingname in voltage_pq_red){
        voltage_pq_red[readingname] += voltage_difference
    }

    let m11_data = {
        time: new Date(),
        phase: M11_phase,
        devicename: M11_name,
        ...voltage_pq_red,
        ...current_pq_red,
        ...power_pq_red
    }
    postgres_manager.Query('INSERT INTO public.fake_data VALUES(${this:csv})', m11_data);
}

function generate_m31_fake_data(simulation_conditions) {
    if (simulation_conditions.conductor_down != last_conductor_down_alarm_state) {
        generate_conductor_down_alarm(simulation_conditions.conductor_down)
        last_conductor_down_alarm_state = simulation_conditions.conductor_down
    }
    if (simulation_conditions.rcd_switch != last_rcd_alarm_state) {
        generate_rcd_alarm(simulation_conditions.rcd_switch)
        last_rcd_alarm_state = simulation_conditions.rcd_switch
    }
    for (let phase_id = 0; phase_id <= 2; phase_id++) {
        let voltage_pq = generate_pq_readings("voltage", fake_readings["M31"].voltage[phase_id])
        let current_pq = generate_pq_readings("current", fake_readings["M31"].current[phase_id])
        let power_pq = generate_pq_readings("power", fake_readings["M31"].power[phase_id])
        let m31_data = {
            time: new Date(),
            phase: phase_id,
            devicename: M31_name,
            ...voltage_pq,
            ...current_pq,
            ...power_pq
        }
        postgres_manager.Query('INSERT INTO public.fake_data VALUES(${this:csv})', m31_data);
    }
}

function generate_rcd_alarm(rcd_state) {
    let alarm_type = rcd_state ? "RCD closed" : "RCD open"
    let alarm = {
        time: new Date(),
        type: alarm_type,
        devicename: M11_name
    }
    console.log('new alarm', alarm)
    postgres_manager.Query('INSERT INTO public.fake_alarms VALUES(${this:csv})', alarm);
}

function generate_conductor_down_alarm(conductor_is_down) {
    let alarm_type = conductor_is_down ? "Grounded Conductor" : "👍"
    let alarm = {
        time: new Date(),
        type: alarm_type,
        devicename: M31_name
    }
    console.log('new alarm', alarm)
    postgres_manager.Query('INSERT INTO public.fake_alarms VALUES(${this:csv})', alarm);
}

function generate_fake_readings(simulation_conditions) {
    //function called frequently to record fake readings
    //generate voltage readings
    for (let device_name in fake_readings) {
        let device = fake_readings[device_name]
        //generate fake voltage readings for each phase
        for (let phase_id in device.voltage) {
            device.voltage[phase_id].push(fake_voltage_reading({ simulation_conditions, device_name, phase_id }))
        }
        //generate fake current readings for each phase
        for (let phase_id in device.current) {
            device.current[phase_id].push(fake_current_reading({ simulation_conditions, device_name, phase_id }))
        }
        //generate fake power readings for each phase
        //must be called after fake voltage and current
        for (let phase_id in device.current) {
            device.power[phase_id].push(fake_power_reading(device,phase_id))
        }
    }
}

function generate_fake_data(simulation_conditions) {
    generate_m11_fake_data(simulation_conditions)
    generate_m31_fake_data(simulation_conditions)
    //Clear voltage readings till next data is generated
    clear_fake_readings()
}

function clear_fake_readings() {
    for (let device_name in fake_readings) {
        let device = fake_readings[device_name]
        //generate fake voltage readings for each phase
        for (let phase_id in device.voltage) {
            device.voltage[phase_id].splice(0, device.voltage[phase_id].length)
        }
        //generate fake current readings for each phase
        for (let phase_id in device.current) {
            device.current[phase_id].splice(0, device.current[phase_id].length)
        }
    }
}

async function clear_fake_data() {
    await postgres_manager.Query(`drop * from public.fake_alarms`)
    await postgres_manager.Query(`drop * from public.fake_data`)
}


function generate_pq_readings(reading_name_prefix, data_array) {
    //process fake voltage readings since last check to generate voltage pq info
    let sum = data_array.reduce((a, b) => a + b, 0);
    let average = (sum / data_array.length) || 0;
    let readings = {}
    readings[`${reading_name_prefix}min`] = Math.min(...data_array)
    readings[`${reading_name_prefix}max`] = Math.max(...data_array),
        readings[`${reading_name_prefix}sma`] = average
    data_array.splice(0, data_array.length)
    return readings
}

function fake_power_reading(device,phase_id){
    return device.voltage[phase_id][device.voltage[phase_id].length-1]*device.current[phase_id][device.current[phase_id].length-1]
}

function fake_voltage_reading({ simulation_conditions }) {
    let { network_load_float } = simulation_conditions
    let min_voltage = 239 - (network_load_float * 10)
    let max_voltage = min_voltage + (2 + (network_load_float * 3))
    let fake_voltage = RNG(min_voltage, max_voltage)
    return fake_voltage
}

function fake_current_reading({ simulation_conditions, phase_id, device_name }) {
    let current = 0
    if (device_name == M31_name) {
        current += 225*simulation_conditions.network_load_float
    }

    if (phase_id == M11_phase) {
        if (simulation_conditions.hot_water) {
            current += HOT_WATER_POWER
        }
        if (simulation_conditions.ev_charger) {
            current += CAR_CHARGER_POWER
        }
        if (simulation_conditions.solar_generation) {
            current += SOLAR_PANEL_POWER
        }
    }

    if (simulation_conditions.conductor_down) {
        current *= 0.2
    }

    return current
}

module.exports = { generate_fake_data, clear_fake_data, generate_fake_readings }