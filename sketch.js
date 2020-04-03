// the shader variables
// we will have one shader that blurs horizontally, and one that blurs vertically
let automata;
let weighter;
let scale, speed, paused, generation, seed;

// we need two createGraphics layers for our blur algorithm
let rulePass, colorPass, weightPass, passes, displayPass;

function preload(){
  // load the shaders, we will use the same vertex shader and frag shaders for both passes
  automata = loadShader('base.vert', 'automata.frag');
  weighter = loadShader('base.vert', 'weighter.frag');
  colorizer = loadShader('base.vert', 'colorize.frag');
}


function setup() {
  // shaders require WEBGL mode to work
  // at present time, there is no WEBGL mode image() function so we will make our createGraphics() in WEBGL, but the canvas renderer will be P2D (the default)
	scale = 512;
	speed = 2;
	paused = false;
	generation = 0;
	seed = 123;
    
	createCanvas(scale, scale);
	frameRate(1);
	
	initImage = loadImage('seed.png');
	spectrum = loadImage('spectrum.png');

	// initialize the createGraphics layers
	rulePass = createGraphics(scale, scale, WEBGL);
	colorPass = createGraphics(scale, scale, WEBGL);
	buffy = createGraphics(scale, scale);
	weightPass = createGraphics(scale, scale, WEBGL);
	weightBuffer = createGraphics(scale, scale);
	
	//put passes in an array so that the user can choose which one to display
	//by typing a number
	passes = [colorPass, rulePass, weightPass];
	displayPass = passes[0]

	rulePass.shader(automata);    
	colorPass.shader(colorizer);
	weightPass.shader(weighter);

	automata.setUniform('scale', 1/scale);
	automata.setUniform("seed", seed);
	colorizer.setUniform('scale', 1/scale);
    
	// turn off the cg layers stroke
	rulePass.noStroke();
	colorPass.noStroke();
	weightPass.noStroke();
	weightBuffer.noStroke();	
}

function draw() { 
	var state
	
	if(frameCount==1){
		state = initImage;
		frameRate(100)
	} else {
		state = rulePass;
	}
	
	var count = 0;
	var iterations = Math.min(32, speed);
	do {
		count++
		generation++
		
		automata.setUniform('clock_data', generation + seed);
		automata.setUniform("randpos", [random(1), random(1)]);
		automata.setUniform("randnum", random(pow(2., random(8)))-1);
		automata.setUniform("randnum2", pow(2., random(8)))-1;
		
		automata.setUniform('tex0', state);
		automata.setUniform('tex1', buffy);

		rulePass.rect(0,0,width, height);

		// weighter.setUniform('lifeTex', rulePass)
		// weightPass.rect(0,0,width, height);
		// weightBuffer.image(weightPass, 0, 0, width, height)

		buffy.image(rulePass, 0,0, width, height);

	} while (count < iterations);
	
	
	colorizer.setUniform('tex0', rulePass);
	colorizer.setUniform('tex1', spectrum);
	colorizer.setUniform('mousepos', [mouseX,mouseY]);
	colorizer.setUniform('mousepressed', mouseIsPressed);
	colorPass.rect(0,0,width, height);

	image(displayPass, 0,0, width, height);
}

function keyPressed() {
    if (keyCode==32){ //spacebar
        // Do something
        if (!paused) noLoop();
        else (loop());
        paused=!paused;
    }
    if (keyCode==UP_ARROW){
        speed*=2
        frameRate(Math.ceil(speed*30))
        console.log("speed: " + speed + ":" + frameRate())
    }
    if (keyCode==DOWN_ARROW){
        speed/=2
        frameRate(Math.ceil(speed*30))
        //speed=Math.max(speed,0.125)
        console.log("speed: " + speed + ":" + frameRate())
    }
}

function keyTyped() {
		if (!isNaN(key)){
			displayPass = passes[ Math.abs((key-1)%passes.length) ];
		}
}