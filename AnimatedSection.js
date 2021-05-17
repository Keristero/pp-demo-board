class AnimatedSection{
    constructor({start_led,end_led,direction_callback}){
        this.start_led = start_led
        this.end_led = end_led
        this.direction_callback = direction_callback

        this.length = this.end_led-this.start_led
        this.fade_speed = 2

        this.local_led_index = 0
        this.tics_till_next_position = 0
    }
    /**
     * Updates the section of the strip array that this object is responsible for
     * @param {Array<Object>} strip_array 
     * @param {Object} demo_conditions 
     */
    UpdateStrip(strip_array,demo_conditions){
        this.FadeStrip(strip_array,this.fade_speed)
        let direction = this.direction_callback(demo_conditions)

        if(direction === 0){
            //If there is no movement of energy, return early
            return
        }

        //Reduce
        this.tics_till_next_position--

        let rgb = {r:0,g:0,b:0}

        if(this.tics_till_next_position <= 0){
            //If it is time to move onto next pixel
            if(direction > 0){
                //Move led index in direction, and use color based on direction
                this.local_led_index++
                rgb.g = Math.max(100,Math.min(255,100+(Math.abs(direction)*5)))
            }else{
                this.local_led_index--
                rgb.r = Math.max(100,Math.min(255,100+(Math.abs(direction)*5)))
            }
            if(this.local_led_index >= this.length){
                this.local_led_index = this.local_led_index-this.length
            }
            if(this.local_led_index < 0){
                this.local_led_index = this.local_led_index+this.length
            }
            //Wait x number of tics till next movement
            this.tics_till_next_position = 25/Math.abs(direction)+1
            //Set pixel color
            this.SetRelativePixelColor(strip_array,this.local_led_index,rgb)
        }
    }
    /**
     * 
     * @param {Array<Object>} strip_array 
     * @param {Number} relative_index 
     * @param {Object} rgb 
     */
    SetRelativePixelColor(strip_array,relative_index,rgb){
        let index = this.start_led+relative_index
        strip_array[index] = rgb
    }
    /**
     * 
     * @param {Array<Object>} strip_array 
     * @param {Number} fade_amount decimal to fade all colors by
     */
    FadeStrip(strip_array,fade_amount){
        for(let i = this.start_led; i < this.end_led; i++){
            let rgb = strip_array[i]
            rgb.r = Math.max(0,rgb.r-fade_amount)
            rgb.g = Math.max(0,rgb.g-fade_amount)
            rgb.b = Math.max(0,rgb.b-fade_amount)
        }
    }
}

module.exports = {AnimatedSection}