function rgb_to_decimal({r,g,b}){
    return (r << 16) | (g << 8) | b;
}

function decimal_to_rgb(decimal_color){
    let base2string = decimal_color.toString(2)
    let rgb = {
        r:parseInt(base2string.slice(0,8),2),
        g:parseInt(base2string.slice(8,16),2),
        b:parseInt(base2string.slice(16,24),2)
    }
  return rgb
}

function RNG(min,max){
    return (Math.random()*(max-min+1)+min);
}

async function Sleep(time_ms){
    return new Promise((resolve)=>{
        setTimeout(resolve,time_ms)
    })
}

module.exports = {rgb_to_decimal,decimal_to_rgb,RNG,Sleep}