const {EnergyDirectionSection} = require('./EnergyDirectionSection')
const {PixelIndicatorSection} = require('./PixelIndicatorSection')
const {SOLAR_PANEL_POWER,HOT_WATER_POWER,CAR_CHARGER_POWER,CONDUCTOR_DOWN_ENERGY_MULTIPLIER,DEMO_BOARD_TYPE} = require('./environment')

function pelican_board_setup(strip_manager){
    let big_test = new EnergyDirectionSection({
        start_led: 0,
        end_led: 108,
        flow_callback: ({solar_generation,hot_water,ev_charger,conductor_down}) => {
            return 1
        },
    })
    strip_manager.add_animated_section(big_test)
}

module.exports = {pelican_board_setup}