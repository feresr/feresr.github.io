var vertexShaderText = `
precision mediump float;
attribute vec2 vertPosition;
void main() {
    gl_Position = vec4(vertPosition, 0.0, 1.0);
}
`

var fragmentShaderText = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;

const float THRESHOLD = 0.9;
const int CIRCLE_COUNT = 6;

void main()
{
    struct Circle {
    	vec2 pos;
        float radius;
    };
    Circle circles[CIRCLE_COUNT];

    
    circles[0] = Circle(vec2(-0.25, 0.26), .55);     // fixed
    circles[1] = Circle(vec2(-.1, -0.68), .37);    // down fixed
    circles[2] = Circle(vec2(-.25, 0.2), .58);
    circles[3] = Circle(vec2( -0.33, 0.5), .40);
    circles[4] = Circle(vec2(-.26    , -0.45), .5); // down
    circles[5] = Circle(iMouse * 2.0, .3); //mouse controlled
    
        
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (2.0 * (gl_FragCoord.xy) - iResolution.xy)/iResolution.y;

    float f = 0.0;
    for(int i=0; i < CIRCLE_COUNT; i++) {
    	Circle circle = circles[i];
        
        float dx = .10;
        float dy = .12;
        if (i < 2) {
            dx = .02;
            dy = .07;
        }

        circle.pos.x += dx * cos(float(i + 1) * iTime);
        circle.pos.y += dy * sin(float(i + 1) * iTime); 
        
        float dist = length(uv - circle.pos);
        
        f += smoothstep(circle.radius, circle.radius - THRESHOLD, dist);
	}
   
    if (f >= .05) {
        vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4)) * 0.6;
    	gl_FragColor = vec4(.2 + col.x * .3, col.y, col.z + col.x, .9);
    } else {
        gl_FragColor = vec4(0,0,0,0);   
    }
}
`

var gl;
var mousex = 500;
var mousey = -80;

var loadBackground = function () {

    var canvas = document.getElementById('surface');

    const getMousePos = (evt) => {
        const pos = evt.currentTarget.getBoundingClientRect();
        return {
          x: evt.clientX - pos.left,
          y: evt.clientY - pos.top
        };
      };
      

      document.querySelector("#header").style.cursor = "none";
    document.querySelector("#header").addEventListener('mousemove', (evt) => {
        
        const mPos = getMousePos(evt);
        
        mousex = mPos.x;
        mousey = -mPos.y;
        
      });

    gl = canvas.getContext('webgl');

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
            canvas.width = Math.max(window.innerWidth / 2, 500);
            canvas.height = window.innerHeight;
            
            if (!gl) {
                console.log('WebGL not supported, falling back on experimental-webgl');
                gl = canvas.getContext('experimental-webgl');
            }
        
            if (!gl) alert('Your browser does not support WebGL');
    }

    resizeCanvas();
    requestAnimationFrame(draw);

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }

    var triangleVertices = [
        -1.0, -1.0,
        1.0, 1.0,
        1.0, -1.0,

        -1.0, -1.0, 
        1.0, 1.0,
        -1.0, 1.0
    ];

    var triangleVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    
    var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location
        2, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        gl.FALSE,
        2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
    );    

    gl.enableVertexAttribArray(positionAttribLocation);

    gl.useProgram(program);

    var timeLocation = gl.getUniformLocation(program, "iTime");
    var mouseLocation = gl.getUniformLocation(program, "iMouse");
    var resolutionLocation = gl.getUniformLocation(program, "iResolution");
    function draw(now) {

        if (window.innerWidth/window.innerHeight < 1.25) {
            canvas.width = 0;
            canvas.height = 0;
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            requestAnimationFrame(draw);
            return;
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        now *= 0.0001;

        gl.uniform1f(timeLocation, now);
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);


        console.log(mousex / gl.canvas.width - .5);

        gl.uniform2f(mouseLocation, mousex / gl.canvas.width - .5, mousey / gl.canvas.height + .5);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    
        requestAnimationFrame(draw);
    }

}



