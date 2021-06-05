const environment = {
    TIMESCALE_MASTER_ADDRESS:String(process.env.TIMESCALE_MASTER_ADDRESS || `127.0.0.1`),
    TIMESCALE_MASTER_USER:String(process.env.TIMESCALE_MASTER_USER || `postuser`),
    TIMESCALE_MASTER_PASSWORD:String(process.env.TIMESCALE_MASTER_PASSWORD || `IOtSt4ckpostgresDbPw`),
    TIMESCALE_MASTER_DATABASE:String(process.env.TIMESCALE_MASTER_DATABASE || `postgres`),
    TIMESCALE_MASTER_PORT:parseInt(process.env.TIMESCALE_MASTER_PORT || 5432),
    TIMESCALE_MASTER_USESSL:Boolean(process.env.TIMESCALE_MASTER_USESSL || false),
    LEDS_TOTAL:300,
    LEDS_GPIO:12,
    LEDS_TYPE:"grb",
    LEDS_DMA:10,
    SOLAR_PANEL_POWER:5,
    HOT_WATER_POWER:-2.4,
    CAR_CHARGER_POWER:7.2
}

console.log("Loaded environment variables",environment)


module.exports = environment