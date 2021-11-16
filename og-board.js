const {EnergyDirectionSection} = require('./EnergyDirectionSection')
const {PixelIndicatorSection} = require('./PixelIndicatorSection')
const {SOLAR_PANEL_POWER,HOT_WATER_POWER,CAR_CHARGER_POWER,CONDUCTOR_DOWN_ENERGY_MULTIPLIER,DEMO_BOARD_TYPE} = require('./environment')

function og_board_setup(strip_manager) {
    //
    //Pixel Indicators
    //
    let indicator_conductor_down = new PixelIndicatorSection({
        led_index: 0,
        lit_callback: ({ conductor_down }) => { return conductor_down },
        on_rgb_color: { r: 255, g: 0, b: 0 }
    })
    strip_manager.add_animated_section(indicator_conductor_down)

    let indicator_ev_charging = new PixelIndicatorSection({
        led_index: 1,
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
            return { r: this.sun_pulse, g: this.sun_pulse, b: this.sun_pulse }
        }
    })
    strip_manager.add_animated_section(indicator_ev_charging)

    let indicator_day = new PixelIndicatorSection({
        led_index: 2,
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

    let indicator_hot_water = new PixelIndicatorSection({
        led_index: 3,
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
    //
    //Energy direction sections
    //
    let house_to_m11 = new EnergyDirectionSection({
        start_led: 4,
        end_led: 13,
        flow_callback: ({ solar_generation, hot_water, ev_charger, conductor_down }) => {
            let consumption_multiplier = CONDUCTOR_DOWN_ENERGY_MULTIPLIER
            if (!conductor_down) {
                consumption_multiplier = 1
            }
            let direction = (!conductor_down * solar_generation * SOLAR_PANEL_POWER) + (((hot_water * HOT_WATER_POWER) + (ev_charger * CAR_CHARGER_POWER)) * consumption_multiplier)
            return direction
        },
    })
    strip_manager.add_animated_section(house_to_m11)

    let m11_to_m31_flow_callback = function ({ solar_generation, hot_water, ev_charger, network_load_float, conductor_down }) {
        let consumption_multiplier = CONDUCTOR_DOWN_ENERGY_MULTIPLIER
        if (!conductor_down) {
            consumption_multiplier = 1
        }
        let direction = (!conductor_down * solar_generation * SOLAR_PANEL_POWER) + (((50 * network_load_float) + 15 + (hot_water * HOT_WATER_POWER) + (ev_charger * CAR_CHARGER_POWER)) * consumption_multiplier)
        return direction
    }

    let m11_to_m31 = new EnergyDirectionSection({
        start_led: 14,
        end_led: 38,
        flow_callback: m11_to_m31_flow_callback
    })
    strip_manager.add_animated_section(m11_to_m31)

    let m31_to_grid_conductor_down = new EnergyDirectionSection({
        start_led: 39,
        end_led: 48,
        flow_callback: () => {
            let direction = null
            return direction
        },
        pulse_for_conductor_down: true
    })
    strip_manager.add_animated_section(m31_to_grid_conductor_down)
    let m31_to_grid_normal = new EnergyDirectionSection({
        start_led: 39,
        end_led: 60,
        flow_callback: ({ solar_generation, hot_water, ev_charger, network_load_float, conductor_down }) => {
            let direction = 0
            if (!conductor_down) {
                direction = (solar_generation * SOLAR_PANEL_POWER) + (50 * network_load_float) + 15 + (hot_water * HOT_WATER_POWER) + (ev_charger * CAR_CHARGER_POWER)
            }
            return direction
        },
    })
    strip_manager.add_animated_section(m31_to_grid_normal)

    let conductor_down_strip = new EnergyDirectionSection({
        start_led: 61,
        end_led: 71,
        flow_callback: () => {
            let direction = 0
            return direction
        },
        reverse_direction: true,
        pulse_for_conductor_down: true
    })
    strip_manager.add_animated_section(conductor_down_strip)
}

module.exports = { og_board_setup }