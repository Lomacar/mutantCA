#version 300 es

precision lowp float;
precision lowp int;

out vec4 fragColor;
in vec2 vTexCoord;
uniform sampler2D lifeTex;
uniform float scale;

void main() {
  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;
  
	fragColor = vec4(1.,1.,0.,1.);
  
	vec4 me = vec4(texture(lifeTex, uv));
	
	int count = 0;
	int weight = 1;
	int n = int(me.r*255.);
	while (n > 0) {
	  count += n*weight;
	  n >>= 1;
	  weight++;
	}
	fragColor.r = float(count)/255.;
	
	count = 0;
	weight = 1;
	n = int(me.g*255.);
	while (n > 0) {
	  count += n*weight;
	  n >>= 1;
	  weight++;
	}
	fragColor.g = float(count)/255.;
  
	
	//fragColor = vec4(float(bitweight(me.r))/255., float(bitweight(me.g))/255., 0., 0.);
}