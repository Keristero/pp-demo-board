const {AnimatedSection} = require('./AnimatedSection')

class DayNightSection extends AnimatedSection{
    constructor({start_led,end_led,is_day_callback}){
        super({start_led,end_led})
        this.is_day_callback = is_day_callback

        this.fade_speed = 2
        this.tics_till_next_position = 0
    }
    /**
     * Updates the section of the strip array that this object is responsible for
     * @param {Array<Object>} strip_array 
     * @param {Object} demo_conditions 
     */
    UpdateStrip(strip_array,demo_conditions){
        this.FadeStrip(strip_array,this.fade_speed)
        let is_day = this.is_day_callback(demo_conditions)

        let rgb = {r:0,g:0,b:0}

        if(is_day){
            //Set to day color
            rgb = {r:255,g:225,b:100}
        }else{
            //Set to night color
            rgb = {r:70,g:70,b:100}
        }
        for(let i = 0; i < this.length; i++){
            this.SetRelativePixelColor(strip_array,i,rgb)
        }
    }
}

module.exports = {DayNightSection}