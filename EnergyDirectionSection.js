const {AnimatedSection} = require('./AnimatedSection')

class EnergyDirectionSection extends AnimatedSection{
    constructor({start_led,end_led,flow_callback,reverse_direction,pulse_for_conductor_down}){
        super({start_led,end_led})
        this.flow_callback = flow_callback
        this.reverse_direction = reverse_direction
        this.pulse_for_conductor_down = pulse_for_conductor_down

        this.fade_speed = 2
        this.local_led_index = 0
        this.tics_till_next_position = 0

        this.pulse_brightness = 0
        this.pulse_direction = 4
    }
    /**
     * Updates the section of the strip array that this object is responsible for
     * @param {Array<Object>} strip_array 
     * @param {Object} demo_conditions 
     */
    UpdateStrip(strip_array,demo_conditions){

        let rgb = {r:0,g:0,b:0}

        if(demo_conditions.conductor_down && this.pulse_for_conductor_down){
            this.pulse_brightness += this.pulse_direction
            if(this.pulse_brightness > 255){
                this.pulse_direction *= -1
            }
            if(this.pulse_brightness < 0){
                this.pulse_direction *= -1
            }
            rgb.r = Math.max(0,Math.min(this.pulse_brightness,255))
            rgb.g = Math.max(0,Math.min(this.pulse_brightness*0.5,255))
            for(let i = 0; i < this.length; i++){
                this.SetRelativePixelColor(strip_array,i,rgb)
            }
        }else{
            let flow = this.flow_callback(demo_conditions)
            if(flow === 0){
                this.FadeStrip(strip_array,this.fade_speed)
                //If there is no movement of energy, fade and return early
                return
            }else if(flow == null){
                //if flow is null, dont even fade, just return early
                return
            }
            this.FadeStrip(strip_array,this.fade_speed)
    
            //Reduce
            this.tics_till_next_position--
            if(this.tics_till_next_position <= 0){
                //If it is time to move onto next pixel
                if(flow < 0){
                    //Move led index in direction, and use color based on direction
                    if(!this.reverse_direction){
                        this.local_led_index++
                    }else{
                        this.local_led_index--
                    }
                    rgb.g = 255
                    rgb.b = 100
                }else{
                    if(!this.reverse_direction){
                        this.local_led_index--
                    }else{
                        this.local_led_index++
                    }
                    rgb.r = 255
                    rgb.b = 60
                }
                if(this.local_led_index >= this.length){
                    this.local_led_index = this.local_led_index-this.length
                }
                if(this.local_led_index < 0){
                    this.local_led_index = this.local_led_index+this.length
                }
                //Wait x number of tics till next movement
                this.tics_till_next_position = 100/Math.abs(flow)+1
                //Set pixel color
                this.SetRelativePixelColor(strip_array,this.local_led_index,rgb)
            }
        }
    }
}

module.exports = {EnergyDirectionSection}