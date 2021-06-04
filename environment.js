const environment = {
    TIMESCALE_MASTER_ADDRESS:String(process.env.TIMESCALE_MASTER_ADDRESS || `localhost`),
    TIMESCALE_MASTER_USER:String(process.env.TIMESCALE_MASTER_USER || `postgres`),
    TIMESCALE_MASTER_PASSWORD:String(process.env.TIMESCALE_MASTER_PASSWORD || `tea`),
    TIMESCALE_MASTER_DATABASE:String(process.env.TIMESCALE_MASTER_DATABASE || `postgres`),
    TIMESCALE_MASTER_PORT:parseInt(process.env.TIMESCALE_MASTER_PORT || 5432),
    TIMESCALE_MASTER_USESSL:Boolean(process.env.TIMESCALE_MASTER_USESSL || false),
    LEDS_TOTAL:300,
    LEDS_GPIO:12,
    LEDS_TYPE:"grb",
    LEDS_DMA:10
}

console.log("Loaded environment variables",environment)


module.exports = environment