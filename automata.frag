#version 300 es

precision lowp float;
precision lowp int;

out vec4 outState;

in vec2 vTexCoord;
uniform sampler2D tex0, tex1;
uniform float scale;

uniform float clock_data;
uniform vec2 randpos;
uniform int randnum, randnum2, seed;


int survival(in vec4 who){ //retrieves the survival rules for a cell
 return int(who.g*255.);
}

int birth(in float who){ //retrieves the birth rules for a cell
 return int(who*255.);
}


// A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm.
uint hash( uint x ) {
    x += ( x << 10u );
    x ^= ( x >>  6u );
    x += ( x <<  3u );
    x ^= ( x >> 11u );
    x += ( x << 15u );
    return x;
}

// Compound versions of the hashing algorithm I whipped together.
uint hash( uvec3 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ); }

// Construct a float with half-open range [0:1] using low 23 bits.
// All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
float floatConstruct( uint m ) {
    const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
    const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32

    m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
    m |= ieeeOne;                          // Add fractional part to 1.0

    float  f = uintBitsToFloat( m );       // Range [1:2]
    return f - 1.0;                        // Range [0:1]
}

// Pseudo-random value in half-open range [0:1].
float random( vec3  v ) { 
	return floatConstruct(hash(floatBitsToUint(v)));
}


void main(void)
{
  vec2 tex = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  tex.y = 1.0 - tex.y;
  
	//rename some clunky variables
	float cx = clock_data;
	float cx2 = cx * 0.01;
	
	//the pixel data
	vec4 me = vec4(texture(tex0, tex)); //the current pixel rules
	vec4 w = vec4(texture(tex1, tex)); //the current pixel rule "weights"
	
	//some basic variables for the loop and rules
	int i = 0; int j = 0; vec4 tmp, tmpw; float tmpweight = 0.;
    int sum = 8; bool kill = false; int live;
	float br = 0.; float sr = 0.;
	
  //repeatedly applying operations to the noise evetually produces something pretty good.
  vec3  inputs = vec3( tex, cx );
  float noise = random( inputs );
	//float noise = fract((sin(tex.x*1900.+cx*10.)+(sin(-tex.x*10100.+cx*0.4))+(sin(tex.x*6400.+cx*3.2)))/3.852147906);
	//noise += fract((sin(tex.y*1500.+cx*11.)+(sin(-tex.y*10600.+cx*0.7))+(sin(tex.y*6110.+cx*2.3)))/4.3120465789);
	//noise = fract(noise * 101.101 / sin(tex.x * tex.y * 999.1111) / sin(randpos.x));
	//sinuous waviness
	float wave = (sin(sin(cx2/3.)+tex.x*2.+sin(cx2+tex.y*4.))+sin(cx2-tex.y*5.))/2.;
        wave = wave/3. + .6;
  //concentric  circles travelling inward
	float wave2 = sin(sqrt(pow((tex.x-0.5)*5.,2.)+pow((tex.y-0.5)*5.,2.))+cx2*.05) * 0.3 + 0.5;
	
	//this funky vector causes the loop to change directions each generation
	//to avoid directional favoritism between rules
	vec2 cycler = vec2( int(cx)%8>3? -1. : 1. , int(cx+2.)%8>3? -1. : 1. );
	
	//the LOOP
	for(i=-1;i<=1;i++ ){
		for(j=-1;j<=1;j++ ){
			//counter+=1.;
			tmp = vec4( texture( tex0, tex.xy + scale * vec2(i,j) * cycler ) );
			tmpw = vec4( texture( tex1, tex.xy + scale * vec2(i,j) * cycler ) );
			//n+=tmp.g;
			if (tmp.g > 0. ){ sum--; } //&& (tmp.g==me.g || me.g==0.)
			//if (tmp.g > 0. && tmpw.g<w.g ){ kill = true; } //so cells with higher survival rules are treated as dead space by their neighbors
			//if (tmpw.r>w.r && tmp.r != 0. ){ kill = true; } //so cells with higher birth rules are treated as dead space by their neighbors
      //if (tmp.r > 0. && tmpw.g > w.g){ kill = true; } //so cells with higher survival rules are treated as dead space by their neighbors
      if (tmp.r > 0. && (w.r+tmpw.g<w.g+tmpw.r) || (tmpw.g+0.26<w.g)){ kill = true; }
      if (tmp.r > 0. && me.b==0.) {kill = true; } //so cells with 0 energy will die if next to something else
      
      //determine the rules for a cell to adopt if it becomes alive
      //currently awarded to the cell with a mix of the lowest birth rule, the least energy, with a bit of random noise
			if ( tmp.r > 0. && ( br==0. || tmpw.r+tmp.b/30. < tmpweight+me.b/30.+float(noise-0.5)*0.003 ) ){ //
				tmpweight = tmpw.r;
				br = tmp.r;
				sr = tmp.g;
				// br = br > 0. ? min(br,tmp.r): tmp.r; 
				// sr = sr > 0. ? min(sr,tmp.g): tmp.g;
			}
	}}
	sum = me.g > 0. ? sum+1 : sum;
	if (kill) {me=vec4(0.); }	
	outState = vec4(0.,0.,0.,1.);
	
	if ( noise > 0.8 ) {
		
		if (wave > 0. && w.g > wave+noise/20.){
			me=vec4(0.);
		} else if (-w.g > wave+noise/20.) {
			me=vec4(0.);
		}
	}
	//if (wave - w.g - w.r - wave2 < 0. ) { me.b -= 0.002; }
	//else {me.b -= 0.2;}
	
	//the RULES
	if (me.g > 0. && me.b > 0.){ //survival
		live = survival(me) & int(pow(2., float(sum)));
		if(live > 0) {
			outState.r = me.r;
			outState.g = me.g;
			outState.b = (noise*0.01) + float(int(cx)%20) < float(randnum)*wave ? me.b - .003 : me.b;    
      //outState.b = me.g < 1. && int(cx)%20==3 && randnum < 10 ? me.b - .003 : me.b;
		}
	} else { //birth
		live = birth(br) & int(pow(2., float(sum)));
		if(live > 0 ){ //&& abs(wave - w.r)+fract(33./noise)/15. > 0.05
			outState.r = br;
			outState.g = min(sr, 254./255.);
			outState.b = 1.;
    } //else {outState = me;}
	}
	
	//MUTATION
	if (live > 0  &&  randpos.x+scale*2. > tex.x && randpos.x-scale*2. < tex.x 
	&& randpos.y+scale*5. > tex.y && randpos.y-scale*5. < tex.y)
	{outState.r = float(randnum ^ int(outState.r * 255.)) / 255.;}
	
	if (live > 0 && randpos.x+scale*5. > tex.x && randpos.x-scale*5. < tex.x 
	&& randpos.y+scale*2. > tex.y && randpos.y-scale*2. < tex.y)
	{outState.g = float(randnum2 ^ int(outState.g * 255.)) / 255.;}
	
	//prevent rules with births of 2 or 1
	//outState.r = min(outState.r, 127./255.);
	
	outState.r = float( int(outState.r*255.) & 63 )/255.; 
  
  //environmental rule culling
	if (wave+noise > 0.9) {outState.r = float( int(outState.r*255.) & 63 )/255.;}
	if (wave2+noise > 0.5) {outState.g = float( int(outState.g*255.) & 127 )/255.;}		

	//outState = 1.0-vec4(texture(tex0, tex.xy));
	//outState = vec4(noise)-0.5;
	//outState.a = 1.;
	// outState.g += wave;
	// outState.r -= wave2; 
}