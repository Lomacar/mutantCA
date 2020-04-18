#version 300 es

precision lowp float;
precision lowp int;

out vec4 fragColor;
in vec2 vTexCoord;

uniform vec2 mousepos;
uniform bool mousepressed;
uniform float scale;
uniform sampler2D tex0, tex1;

vec2 unsmooth (vec2 val) {
  float factor = 1./scale;
  return vec2(int(val.x*factor),int(val.y*factor))/factor;
}

void main(void)
{
	vec4 me;
  vec2 coord = vTexCoord;
  coord.y = 1.0 - coord.y;
  vec2 mouse = mousepos*scale;
  //mouse.x = 1.0 - mouse.x;
	
	
	//zoom window
	if(mousepressed){
		//me = vec4(texture(tex0, vec2(mousepos.x+((coord.x+.05)/10.)-.1, mousepos.y-((coord.y+.05)/-10.)-.1))); 
		float zoomAmount = 4.;
		vec2 offset = (zoomAmount-1.0)*-clamp(mouse, 0.,1.);
		vec2 sampleCoord = unsmooth(coord-offset)/zoomAmount;
		me = vec4(texture( tex0, sampleCoord)); 
	} else {
		me = vec4(texture(tex0, coord));
	}

	
	// vec4 you = vec4(texture( tex1, vec2(me.r*12., me.g*3.) ));
	// if (me==vec4(0.,0.,0.,1.)) {you=vec4(0.,0.,0.,1.);};
	// fragColor = you;
  
  vec4 you = vec4(texture( tex1, vec2(min(pow(me.r,0.5)*2., 0.999), me.g*2.) ));
	you *= me.b*0.5+0.5;
  if (me==vec4(0.,0.,0.,1.)) {you=vec4(0.,0.,0.,1.);};
	fragColor = you;
  
  //fragColor = vec4(texture( tex0, coord ) );
  //fragColor.a = 1.;
}