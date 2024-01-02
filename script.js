const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');
const interval = 1000 / 60; // For 60 frames per second
let lastTime = 0;
let startTime = Date.now() * 0.001; // Initialize start time in seconds
let programInfo;

if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
}

async function loadShaderFile(url) {
    const response = await fetch(url);
    return response.text();
}

async function init() {
    const vertexShaderSource = await loadShaderFile('vertexShader.glsl');
    const fragmentShaderSource = await loadShaderFile('fragmentShader.glsl');

    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    if (shaderProgram === null) {
        console.error("Unable to initialize the shader program.");
        return;
    }

    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            resolution: gl.getUniformLocation(shaderProgram, 'resolution'),
            time: gl.getUniformLocation(shaderProgram, 'time'),
            seed: gl.getUniformLocation(shaderProgram, 'seed'),
        },
    };

    const buffers = initBuffers(gl);

    function render(now) {
        /* now *= 0.001;  // convert to seconds */
        const deltaTime = now - lastTime;
        lastTime = now;

        if (deltaTime > interval * 0.001) {
            let elapsedTime = now - startTime; // Total elapsed time in seconds
            console.log("rendering ");
            drawScene(gl, programInfo, buffers, elapsedTime);
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    
    initInputButton();
}

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        1.0,  1.0,
        -1.0,  1.0,
        1.0, -1.0,
        -1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
    };
}

function drawScene(gl, progInfo, buffers, elapsedTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(progInfo.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        progInfo.attribLocations.vertexPosition,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(
        progInfo.attribLocations.vertexPosition
    );

    gl.uniform1f(progInfo.uniformLocations.seed, Math.random()); 
    gl.uniform2fv(progInfo.uniformLocations.resolution, [gl.canvas.width, gl.canvas.height]);
    gl.uniform1f(progInfo.uniformLocations.time, elapsedTime);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initInputButton() {
    document.getElementById('sendButton').addEventListener('click', async function() {
        var userInput = document.getElementById('userInput').value;
    
        if (userInput) {
            try {
                const response = await fetch('http://localhost:3000/api/openai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: userInput }]
                    })
                });
    
                const data = await response.json();
                updateShader(data.choices[0].message.content);
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });
}

// Function to update the shader files 
async function updateShader(glslCode) {
    console.log(glslCode);

    // Determine shader type (fragment or vertex) - This may vary depending on OpenAI's response
    let isFragmentShader = true; // Set this based on the response or user input

    // Re-fetch the original vertex/fragment shader if only one is being updated
    let vertexShaderSource = isFragmentShader ? await loadShaderFile('vertexShader.glsl') : null;
    let fragmentShaderSource = isFragmentShader ? glslCode : await loadShaderFile('fragmentShader.glsl');

    // If updating vertex shader, fetch the original fragment shader
    if (!isFragmentShader) {
        vertexShaderSource = glslCode;
    }

    // Reinitialize the shader program with the new source

    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    
    if (shaderProgram === null) {
        console.error("Unable to initialize the shader program with the new source.");
        return;
    }

    // Update program info - You might need to rebind attributes and uniforms
    programInfo.program = shaderProgram;

    // ... other necessary updates to programInfo

    // Consider reinitializing any buffers or other WebGL state as needed
}

init().catch(e => {
    console.error(e);
    alert("Failed to load shaders.");
});



