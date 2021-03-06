const environment = {
    TIMESCALE_MASTER_ADDRESS:String(process.env.TIMESCALE_MASTER_ADDRESS || `127.0.0.1`),
    TIMESCALE_MASTER_USER:String(process.env.TIMESCALE_MASTER_USER || `postuser`),
    TIMESCALE_MASTER_PASSWORD:String(process.env.TIMESCALE_MASTER_PASSWORD || `IOtSt4ckpostgresDbPw`),
    TIMESCALE_MASTER_DATABASE:String(process.env.TIMESCALE_MASTER_DATABASE || `postgres`),
    TIMESCALE_MASTER_PORT:parseInt(process.env.TIMESCALE_MASTER_PORT || 5432),
    TIMESCALE_MASTER_USESSL:Boolean(process.env.TIMESCALE_MASTER_USESSL || false),
    LEDS_TOTAL:109,
    LEDS_GPIO:21,
    LEDS_TYPE:"grb",
    LEDS_DMA:10,
    SOLAR_PANEL_POWER:-20,
    HOT_WATER_POWER:12,
    CAR_CHARGER_POWER:12,
    CONDUCTOR_DOWN_ENERGY_MULTIPLIER:0.25,
    DEMO_BOARD_TYPE:parseInt(process.env.DEMO_BOARD_TYPE || 2),//1 = original, 2 = pelican
    STARTUP_DATE:(process.env.STARTUP_DATE || false),
}

console.log("Loaded environment variables",environment)


module.exports = environment