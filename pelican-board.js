const {EnergyDirectionSection} = require('./EnergyDirectionSection')
const {PixelIndicatorSection} = require('./PixelIndicatorSection')
const {SOLAR_PANEL_POWER,HOT_WATER_POWER,CAR_CHARGER_POWER,CONDUCTOR_DOWN_ENERGY_MULTIPLIER,DEMO_BOARD_TYPE} = require('./environment')

function pelican_board_setup(strip_manager){
    //big test
    /*
    let big_test = new EnergyDirectionSection({
        start_led: 0,
        end_led: 108,
        flow_callback: ({ conductor_down }) => { return 100 }
    })
    strip_manager.add_animated_section(big_test)
    */
    let conductor_down_strip = new EnergyDirectionSection({
        start_led: 0,
        end_led: 13,
        flow_callback: () => {
            let direction = 0
            return direction
        },
        reverse_direction: false,
        pulse_for_conductor_down: true
    })
    strip_manager.add_animated_section(conductor_down_strip)

    let m11_to_m31_flow_callback = function ({ solar_generation, hot_water, ev_charger, network_load_float, conductor_down }) {
        let consumption_multiplier = CONDUCTOR_DOWN_ENERGY_MULTIPLIER
        if (!conductor_down) {
            consumption_multiplier = 1
        }
        let direction = (!conductor_down * solar_generation * SOLAR_PANEL_POWER) + (((50 * network_load_float) + 15 + (hot_water * HOT_WATER_POWER) + (ev_charger * CAR_CHARGER_POWER)) * consumption_multiplier)
        return direction
    }

    let m31_to_pole_s1 = new EnergyDirectionSection({
        start_led: 14,
        end_led: 44,
        reverse_direction: true,
        flow_callback: (parameters)=>{
            if(parameters.conductor_down){
                return 0
            }else{
                return m11_to_m31_flow_callback(parameters)
            }
        }
    })
    strip_manager.add_animated_section(m31_to_pole_s1)

    let m31_to_pole_s1_condutor_down = new EnergyDirectionSection({
        start_led: 23,
        end_led: 44,
        reverse_direction: true,
        flow_callback: () => {
            let direction = null
            return direction
        },
        pulse_for_conductor_down: true
    })
    strip_manager.add_animated_section(m31_to_pole_s1_condutor_down)

    let m31_to_pole_s2 = new EnergyDirectionSection({
        start_led: 45,
        end_led: 74,
        reverse_direction: true,
        flow_callback:m11_to_m31_flow_callback
    })
    strip_manager.add_animated_section(m31_to_pole_s2)

    let m11_to_pole = new EnergyDirectionSection({
        start_led: 75,
        end_led: 81,
        reverse_direction: true,
        flow_callback: ({ solar_generation, hot_water, ev_charger, network_load_float, conductor_down })=>{
            let consumption_multiplier = CONDUCTOR_DOWN_ENERGY_MULTIPLIER
            if (!conductor_down) {
                consumption_multiplier = 1
            }
            let direction = (!conductor_down * solar_generation * SOLAR_PANEL_POWER) + (((50 * network_load_float) + 15 + (hot_water * HOT_WATER_POWER) + (ev_charger * CAR_CHARGER_POWER)) * consumption_multiplier)*0.3
            return direction
        }
    })
    strip_manager.add_animated_section(m11_to_pole)

    let indicator_hot_water = new PixelIndicatorSection({
        start_led: 82,
        end_led: 83,
        lit_callback: ({ hot_water }) => { return hot_water },
        color_callback: () => {
            if (!this.sun_pulse) {
                this.sun_pulse = 128
                this.sun_pulse_direction = 0.2
            }
            if (this.sun_pulse >= 255) {
                this.sun_pulse_direction *= -1
            }
            if (this.sun_pulse <= 200) {
                this.sun_pulse_direction *= -1
            }
            this.sun_pulse = Math.max(200, Math.min(255, this.sun_pulse + this.sun_pulse_direction))
            return { r: this.sun_pulse, g: 0, b: 0 }
        }
    })
    strip_manager.add_animated_section(indicator_hot_water)

    let indicator_ev_charging = new PixelIndicatorSection({
        start_led: 84,
        end_led: 85,
        lit_callback: ({ ev_charger }) => { return ev_charger },
        color_callback: () => {
            if (!this.sun_pulse) {
                this.sun_pulse = 200
                this.sun_pulse_direction = 0.2
            }
            if (this.sun_pulse >= 255) {
                this.sun_pulse_direction *= -1
            }
            if (this.sun_pulse <= 128) {
                this.sun_pulse_direction *= -1
            }
            this.sun_pulse = Math.max(200, Math.min(255, this.sun_pulse + this.sun_pulse_direction))
            return { r: this.sun_pulse, g: this.sun_pulse*0.5, b: this.sun_pulse*0.1 }
        }
    })
    strip_manager.add_animated_section(indicator_ev_charging)

    let indicator_day = new PixelIndicatorSection({
        start_led: 86,
        end_led: 106,
        lit_callback: ({ solar_generation }) => { return solar_generation },
        color_callback: () => {
            if (!this.sun_pulse) {
                this.sun_pulse = 128
                this.sun_pulse_direction = 0.2
            }
            if (this.sun_pulse >= 255) {
                this.sun_pulse_direction *= -1
            }
            if (this.sun_pulse <= 200) {
                this.sun_pulse_direction *= -1
            }
            this.sun_pulse = Math.max(200, Math.min(255, this.sun_pulse + this.sun_pulse_direction))
            return { r: this.sun_pulse, g: this.sun_pulse * 0.7, b: this.sun_pulse * 0.2 }
        }
    })
    strip_manager.add_animated_section(indicator_day)

    let indicator_conductor_down = new PixelIndicatorSection({
        start_led: 108,
        end_led: 108,
        lit_callback: ({ conductor_down }) => { return conductor_down },
        on_rgb_color: { r: 255, g: 0, b: 0 }
    })
    strip_manager.add_animated_section(indicator_conductor_down)

    let indicator_rcd = new PixelIndicatorSection({
        start_led: 107,
        end_led: 107,
        lit_callback: ({ rcd_switch }) => { return !rcd_switch },
        on_rgb_color: { r: 255, g: 0, b: 0 }
    })
    strip_manager.add_animated_section(indicator_rcd)
}

module.exports = {pelican_board_setup}