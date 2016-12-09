"use strict";

var canvas;
var gl;

var numTimesToSubdivide = 3;

var index = 0;

var pointsArray = [];
var normalsArray = [];

var near = -10;
var far = 10;
var radius = 2.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -3.0;
var right = 3.0;
var ytop =3.0;
var bottom = -3.0;

var lightPosition = vec4(0.0, 0.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;
var phongFragmentShading = false;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //

    if(phongFragmentShading == true)
    {
        var program = initShaders( gl, "vertex-shader-phong", "fragment-shader-phong");
    }
    else
    {
        var program = initShaders (gl, "vertex-shader", "fragment-shader");
    }

    gl.useProgram( program );

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    //establishes points on sphere
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    document.getElementById("Controls").onclick = function(event){
        switch(event.target.index)
        {
            case 0:
                phongFragmentShading = false;
                break;
            case 1:
                phongFragmentShading = true;
                break;
        }
        init();
    }

    document.getElementById("slider").onchange = function(event) {
        numTimesToSubdivide = event.target.value;
        index = 0;
        pointsArray = [];
        normalsArray = [];
        document.getElementById("subdivisionsText").innerHTML = event.target.value; //update HTML text
        init();
    };

     document.getElementById("MAR").onchange = function(event) {
        materialAmbient [0] = event.target.value;
        document.getElementById("martext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("MAG").onchange = function(event) {
        materialAmbient [1] = event.target.value;
        document.getElementById("magtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("MAB").onchange = function(event) {
        materialAmbient [2] = event.target.value;
        document.getElementById("mabtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("MDR").onchange = function(event) {
        materialDiffuse[0] = event.target.value;
        document.getElementById("mdrtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("MDG").onchange = function(event) {
        materialDiffuse[1] = event.target.value;
        document.getElementById("mdgtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("MDB").onchange = function(event) {
        materialDiffuse[2] = event.target.value;
        document.getElementById("mdbtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("MSR").onchange = function(event) {
        materialSpecular[0] = event.target.value;
        document.getElementById("msrtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("MSG").onchange = function(event) {
        materialSpecular[1] = event.target.value;
        document.getElementById("msgtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("MSB").onchange = function(event) {
        materialSpecular[2] = event.target.value;
        document.getElementById("msbtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("MShiny").onchange = function(event) {
        materialShininess = event.target.value;
        document.getElementById("mshinetext").innerHTML = event.target.value; //update HTML text
        init();
    };


    //Light properties


    document.getElementById("LAR").onchange = function(event) {
        lightAmbient [0] = event.target.value;
        document.getElementById("lartext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("LAG").onchange = function(event) {
        lightAmbient [1] = event.target.value;
        document.getElementById("lagtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("LAB").onchange = function(event) {
        lightAmbient [2] = event.target.value;
        document.getElementById("labtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("LDR").onchange = function(event) {
        lightDiffuse[0] = event.target.value;
        document.getElementById("ldrtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("LDG").onchange = function(event) {
        lightDiffuse[1] = event.target.value;
        document.getElementById("ldgtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("LDB").onchange = function(event) {
        lightDiffuse[2] = event.target.value;
        document.getElementById("ldbtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("LSR").onchange = function(event) {
        lightSpecular[0] = event.target.value;
        document.getElementById("lsrtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("LSG").onchange = function(event) {
        lightSpecular[1] = event.target.value;
        document.getElementById("lsgtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("LSB").onchange = function(event) {
        lightSpecular[2] = event.target.value;
        document.getElementById("lsbtext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("phiPos").onchange = function(event) {
        phi = event.target.value;
        document.getElementById("phitext").innerHTML = event.target.value; //update HTML text
        init();
    };

    document.getElementById("thetaPos").onchange = function(event) {
        theta = event.target.value;
        document.getElementById("thetatext").innerHTML = event.target.value; //update HTML text
        init();
    };

 
    lightPosition[0] = radius*Math.sin(theta);
    lightPosition[1] = radius*Math.sin(phi);
    lightPosition[2] = radius;


    gl.uniform4fv( gl.getUniformLocation(program, 
        "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );

    render();
}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0,0,1.5);

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );

    for( var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 );

    window.requestAnimFrame(render);
}
