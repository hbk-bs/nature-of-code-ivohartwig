const x = (n) => width * n;
const y = (n) => height * n;
const s = (n) => (height > width ? height * n : width * n);


function setup(){
 createCanvas (400,400)
 strokeWeight(0)
  
 colorMode(HSL, 360, 100, 100, 100);
	const myPrimaryColor = color(80, 30, 50);
  
 background (myPrimaryColor)
  
 const secondaryColor = color((hue(myPrimaryColor) + 180) % 360, 100,  50);
 console.log(hue(myPrimaryColor) + 180); 
  
  
  let h = hue(secondaryColor)
  let sat = saturation(secondaryColor)
  
  let l = lightness(secondaryColor)
  let l1 = lightness(secondaryColor)+10
  let l2 = lightness(secondaryColor)+20
  let l3 = lightness(secondaryColor)+30
  
  
  
  fill(h,sat,l)
  ellipse(x(0.2),y(0.5),s(0.2))
  fill(h,sat,l1)
  ellipse(x(0.4),y(0.5),s(0.3))
  fill(h,sat,l2)
  ellipse(x(0.6),y(0.5),s(0.4))
  fill(h,sat,l3)
  ellipse(x(0.8),y(0.5),s(0.5))
}

 //save images 
  function keyPressed(){
    if(key==="s"){
      save("overlap");
    }
  }


