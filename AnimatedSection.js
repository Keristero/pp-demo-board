class AnimatedSection{
    constructor({start_led,end_led}){
        this.start_led = start_led
        this.end_led = end_led
        this.length = (this.end_led+1)-this.start_led
    }
    /**
     * 
     * @param {Array<Object>} strip_array 
     * @param {Number} relative_index 
     * @param {Object} rgb 
     */
    SetRelativePixelColor(strip_array,relative_index,rgb){
        let index = this.start_led+relative_index
        strip_array[index].r = rgb.r
        strip_array[index].g = rgb.g
        strip_array[index].b = rgb.b
    }
    /**
     * 
     * @param {Array<Object>} strip_array 
     * @param {Number} fade_amount decimal to fade all colors by
     */
    FadeStrip(strip_array,fade_amount){
        for(let i = this.start_led; i <= this.end_led; i++){
            let rgb = strip_array[i]
            rgb.r = Math.max(0,rgb.r-fade_amount)
            rgb.g = Math.max(0,rgb.g-fade_amount)
            rgb.b = Math.max(0,rgb.b-fade_amount)
        }
    }
}

module.exports = {AnimatedSection}