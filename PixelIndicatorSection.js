const {AnimatedSection} = require('./AnimatedSection')

class PixelIndicatorSection extends AnimatedSection{
    constructor({start_led,lit_callback,on_rgb_color,color_callback,end_led}){
        super({start_led,end_led})
        this.lit_callback = lit_callback
        this.color_callback = color_callback
        this.on_rgb_color = on_rgb_color
        this.fade_speed = 5
        this.length = (this.end_led-this.start_led)+1
    }
    /**
     * Updates the section of the strip array that this object is responsible for
     * @param {Array<Object>} strip_array 
     * @param {Object} demo_conditions 
     */
    UpdateStrip(strip_array,demo_conditions){
        this.FadeStrip(strip_array,this.fade_speed)
        let lit = this.lit_callback(demo_conditions)
        if(this.color_callback){
            this.on_rgb_color = this.color_callback(demo_conditions)
        }
        if(lit){
            for(let i = 0; i < this.length; i++){
                this.SetRelativePixelColor(strip_array,i,this.on_rgb_color)
            }
        }
    }
}

module.exports = {PixelIndicatorSection}