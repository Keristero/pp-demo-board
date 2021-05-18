const {AnimatedSection} = require('./AnimatedSection')

class PixelIndicatorSection extends AnimatedSection{
    constructor({led_index,lit_callback,on_rgb_color}){
        super({start_led:led_index,end_led:led_index})
        this.lit_callback = lit_callback
        this.on_rgb_color = on_rgb_color
        this.fade_speed = 5
    }
    /**
     * Updates the section of the strip array that this object is responsible for
     * @param {Array<Object>} strip_array 
     * @param {Object} demo_conditions 
     */
    UpdateStrip(strip_array,demo_conditions){
        this.FadeStrip(strip_array,this.fade_speed)
        let lit = this.lit_callback(demo_conditions)
        if(lit){
            this.SetRelativePixelColor(strip_array,0,this.on_rgb_color)
        }
    }
}

module.exports = {PixelIndicatorSection}