var vertexShaderText = 
[
'precision mediump float;',
'',
'attribute vec2 vertPosition;',
'',
'void main()',
'{',
'  gl_Position = vec4(vertPosition, 0.0, 1.0);',
'}'
].join('\n');

// var fragmentShaderText =
// [
// 'precision mediump float;',
// '',
// 'void main()',
// '{',
// '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
// '}'
// ].join('\n');


var fragmentShaderText = `
precision mediump float;

float smoothstep2(float edge0, float edge1, float x) {
    //genType t;  /* Or genDType t; */
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

uniform vec2 iResolution;
uniform float iTime;

void main()
{
    struct Circle {
    	vec2 pos;
        float radius;
    };
    
    
    const int numCircles = 5;
    Circle circles[numCircles];
    
    circles[0] = Circle(vec2(0.05, 0.26), .55);     // fixed
    
    circles[1] = Circle(vec2(0.25, -0.68), .37);    // down fixed

    
    
    circles[2] = Circle(vec2(0.0, 0.0), .58);
    circles[3] = Circle(vec2( -0.1, 0.5), .40);
    circles[4] = Circle(vec2(0.0    , -0.45), .5); // down
    
    //circles[3] = Circle(vec2(-0.1, 0.45), .55);
    
    
        
    // Normalized pixel coordinates (from 0 to 1)
    
    vec2 uv = (2.0 * (gl_FragCoord.xy) - iResolution.xy)/iResolution.y;

    float f = 0.0;
    float threshold = 0.9;
    for(int i=0; i < numCircles; i++) {
    	Circle circle = circles[i];
        
        float dx = .10;
        float dy = .12;
        if (i < 2) {
            dx = .02;
            dy = .07;
        }

        circle.pos.x += dx * cos(float(i + 1) * iTime/2.0);// * cos(iTime);
        circle.pos.y += dy * sin(float(i + 1) * iTime/2.0); 
        
        
        float dist = length(uv - circle.pos);
    	f += smoothstep(circle.radius, circle.radius - threshold, dist);
	}
   
    
    // Time varying pixel color
    
    if (f >= .05) {
        vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4)) * .9;
    	gl_FragColor = vec4(.2 + col.x * .3, col.y, col.z + col.x, 10);
    } else {
    	gl_FragColor = vec4(0,0,0,0);   
    }
}
`

var gl;

var loadBackground = function () {

    var canvas = document.getElementById('surface');

    gl = canvas.getContext('webgl2');


    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
            canvas.width = window.innerWidth / 3;
            canvas.height = window.innerHeight;
            
            //
            // Create shaders
            // 
            if (!gl) {
                console.log('WebGL not supported, falling back on experimental-webgl');
                gl = canvas.getContext('experimental-webgl');
            }
        
            if (!gl) {
                alert('Your browser does not support WebGL');
            }
        
            
            gl.clearColor(0.75, 0.85, 0.1, 1.0);
    }

    resizeCanvas();
    requestAnimationFrame(draw);
    



    function draw(now) {

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


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
    

        //TIME

        now *= 0.0002;
        //now *= 0.001;
    
        var timeLocation = gl.getUniformLocation(program, "iTime");
        gl.uniform1f(timeLocation, now);
        ///

        var resolutionLocation = gl.getUniformLocation(program, "iResolution");
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    
        console.error(gl.getError());

        requestAnimationFrame(draw);
    }
}



