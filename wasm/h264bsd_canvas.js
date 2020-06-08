//
//  Copyright (c) 2014 Sam Leitch. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to
//  deal in the Software without restriction, including without limitation the
//  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
//  sell copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
//  IN THE SOFTWARE.
//

/**
 * This class can be used to render output pictures from an H264bsdDecoder to a canvas element.
 * If available the content is rendered using WebGL.
 */
function H264bsdCanvas(canvas, forceNoGL, mbcanvas) {
    this.canvasElement = canvas;
    this.mbcanvasElement = mbcanvas;

    if (!forceNoGL) this.initContextGL();

    if (this.contextGL) {
        this.initProgram();
        this.initBuffers();
        this.initTextures();
    }
}

/**
 * Returns true if the canvas supports WebGL
 */
H264bsdCanvas.prototype.isWebGL = function () {
    return this.contextGL;
}

/**
 * Create the GL context from the canvas element
 */
H264bsdCanvas.prototype.initContextGL = function () {
    var canvas = this.canvasElement;
    var gl = null;

    var validContextNames = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
    var nameIndex = 0;

    while (!gl && nameIndex < validContextNames.length) {
        var contextName = validContextNames[nameIndex];

        try {
            gl = canvas.getContext(contextName);
        } catch (e) {
            gl = null;
        }

        if (!gl || typeof gl.getParameter !== "function") {
            gl = null;
        }

        ++nameIndex;
    }

    this.contextGL = gl;
}

/**
 * Initialize GL shader program
 */
H264bsdCanvas.prototype.initProgram = function () {
    var gl = this.contextGL;

    var vertexShaderScript = [
        'attribute vec4 vertexPos;',
        'attribute vec4 texturePos;',
        'varying vec2 textureCoord;',

        'void main()',
        '{',
        'gl_Position = vertexPos;',
        'textureCoord = texturePos.xy;',
        '}'
    ].join('\n');

    var fragmentShaderScript = [
        'precision highp float;',
        'varying highp vec2 textureCoord;',
        'uniform sampler2D ySampler;',
        'uniform sampler2D uSampler;',
        'uniform sampler2D vSampler;',
        'const mat4 YUV2RGB = mat4',
        '(',
        '1.1643828125, 0, 1.59602734375, -.87078515625,',
        '1.1643828125, -.39176171875, -.81296875, .52959375,',
        '1.1643828125, 2.017234375, 0, -1.081390625,',
        '0, 0, 0, 1',
        ');',

        'void main(void) {',
        'highp float y = texture2D(ySampler,  textureCoord).r;',
        'highp float u = texture2D(uSampler,  textureCoord).r;',
        'highp float v = texture2D(vSampler,  textureCoord).r;',
        'gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;',
        '}'
    ].join('\n');

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderScript);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log('Vertex shader failed to compile: ' + gl.getShaderInfoLog(vertexShader));
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderScript);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log('Fragment shader failed to compile: ' + gl.getShaderInfoLog(fragmentShader));
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log('Program failed to compile: ' + gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);

    this.shaderProgram = program;
}

/**
 * Initialize vertex buffers and attach to shader program
 */
H264bsdCanvas.prototype.initBuffers = function () {
    var gl = this.contextGL;
    var program = this.shaderProgram;

    var vertexPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

    var vertexPosRef = gl.getAttribLocation(program, 'vertexPos');
    gl.enableVertexAttribArray(vertexPosRef);
    gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0);

    var texturePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

    var texturePosRef = gl.getAttribLocation(program, 'texturePos');
    gl.enableVertexAttribArray(texturePosRef);
    gl.vertexAttribPointer(texturePosRef, 2, gl.FLOAT, false, 0, 0);

    this.texturePosBuffer = texturePosBuffer;
}

/**
 * Initialize GL textures and attach to shader program
 */
H264bsdCanvas.prototype.initTextures = function () {
    var gl = this.contextGL;
    var program = this.shaderProgram;

    var yTextureRef = this.initTexture();
    var ySamplerRef = gl.getUniformLocation(program, 'ySampler');
    gl.uniform1i(ySamplerRef, 0);
    this.yTextureRef = yTextureRef;

    var uTextureRef = this.initTexture();
    var uSamplerRef = gl.getUniformLocation(program, 'uSampler');
    gl.uniform1i(uSamplerRef, 1);
    this.uTextureRef = uTextureRef;

    var vTextureRef = this.initTexture();
    var vSamplerRef = gl.getUniformLocation(program, 'vSampler');
    gl.uniform1i(vSamplerRef, 2);
    this.vTextureRef = vTextureRef;
}

/**
 * Create and configure a single texture
 */
H264bsdCanvas.prototype.initTexture = function () {
    var gl = this.contextGL;

    var textureRef = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureRef);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return textureRef;
}

/**
 * Draw picture data to the canvas.
 * If this object is using WebGL, the data must be an I420 formatted ArrayBuffer,
 * Otherwise, data must be an RGBA formatted ArrayBuffer.
 */
H264bsdCanvas.prototype.drawNextOutputPicture = function (width, height, croppingParams, data) {
    var gl = this.contextGL;

    if (gl) {
        this.drawNextOuptutPictureGL(width, height, croppingParams, data);
    } else {
        this.drawNextOuptutPictureRGBA(width, height, croppingParams, data);
    }
}

H264bsdCanvas.prototype.drawMbs = function (width, height, croppingParams, data, mbsHeight, mbsWidth) {

    console.log("width, height", width, height)
    console.log("drawNextOutputMbs -> data", mbsHeight, mbsWidth, data)

    var canvas = this.mbcanvasElement;

    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, width, height);
    // imageData.data.set(origdata);

    // console.log("imageData", typeof imageData, imageData.data.length)

    var heightStep = height / mbsHeight
    var widthStep = width / mbsWidth

    console.log("heightStep", heightStep, widthStep)

    for (var i = 0; i < imageData.data.length; i++) {
        imageData.data[i] = 0
    }

    var divisor = 8 
    var divisor2 = 400
    var lineslengths = []

    for (var j = 0; j < mbsHeight; j += 1) {
        for (var i = 0; i < mbsWidth; i += 1) {


                for (var sqy = 0; sqy < 1; sqy++) {
                    for (var sqx = 0; sqx < 1; sqx++) {
                        
                        var hvalue = data.hor16[(i + j * mbsWidth) * 16 + sqx + sqy * 4] / divisor2
                        var vvalue = data.ver16[(i + j * mbsWidth) * 16 + sqx + sqy * 4] / divisor2
                        
                        var barlength = Math.sqrt(Math.pow(hvalue, 2) + Math.pow(vvalue, 2)) 

                        lineslengths.push(barlength)
                    }
                }


        }
    }

    var averagelength = lineslengths.reduce((acc, len) => acc + len, 0) / lineslengths.length

    // console.log("averagelength", averagelength)
    // var positions = []
    for (var j = 0; j < mbsHeight; j += 1) {
        for (var i = 0; i < mbsWidth; i += 1) {

            // x = (i * widthStep) * 4
            // y = (j * heightStep) * 4 * width

            // imageData.data[x + y + 3] = 250
            // for (var sqy = 0; sqy < 4; sqy++) {
            //     for (var sqx = 0; sqx < 4; sqx++) {
                    
            //         var hvalue = data.hor16[(i + j * mbsWidth) * 16 + sqx + sqy * 4]
                    
            //         // values.push(value)
            //         x = (i * widthStep + sqx) * 4
            //         y = (j * heightStep + sqy) * 4 * width

            //         if(hvalue >= 0) {
            //             imageData.data[x + y] = 0 //x / 10
            //             imageData.data[x + y + 1] = 0
            //             imageData.data[x + y + 2] = Math.abs(parseInt(hvalue)) / divisor//value / Math.pow(2, 16) * 255
            //         } else {
            //             imageData.data[x + y] = 0//x / 10
            //             imageData.data[x + y + 1] = Math.abs(parseInt(hvalue)) / divisor//value / Math.pow(2, 16) * 255
            //             imageData.data[x + y + 2] = 0
            //         }
            //         imageData.data[x + y + 3] = Math.sqrt(hvalue * hvalue) / divisor //parseInt(value) / 65536 * 256
            //     }
            // }

            // for (var sqy = 0; sqy < 4; sqy++) {
            //     for (var sqx = 0; sqx < 4; sqx++) {
                    
            //         // var hvalue = data.hor16[(i + j * mbsWidth) * 16 + sqx + sqy * 4]
            //         var vvalue = data.ver16[(i + j * mbsWidth) * 16 + sqx + sqy * 4]
                    
            //         // values.push(value)
            //         x = (i * widthStep + sqx) * 4 + 4 * 4
            //         y = (j * heightStep + sqy + 4) * 4 * width

            //         if(vvalue >= 0) {
            //             imageData.data[x + y] = Math.abs(parseInt(vvalue)) / divisor//x / 10
            //             imageData.data[x + y + 1] = 0
            //             imageData.data[x + y + 2] = Math.abs(parseInt(vvalue)) / divisor//value / Math.pow(2, 16) * 255
            //         } else {
            //             imageData.data[x + y] = Math.abs(parseInt(vvalue)) / divisor //x / 10
            //             imageData.data[x + y + 1] = Math.abs(parseInt(vvalue)) / divisor//value / Math.pow(2, 16) * 255
            //             imageData.data[x + y + 2] = 0
            //         }
            //         imageData.data[x + y + 3] = Math.sqrt(vvalue * vvalue) / divisor //parseInt(value) / 65536 * 256
            //     }
            // }


                // for (var sqy = 0; sqy < 1; sqy++) {
                //     for (var sqx = 0; sqx < 1; sqx++) {
                        
                //         var hvalue = data.hor16[(i + j * mbsWidth) * 16 + sqx + sqy * 4]
                //         var vvalue = data.ver16[(i + j * mbsWidth) * 16 + sqx + sqy * 4]
                        
                //         // values.push(value)
                //         x = (i * widthStep + sqx) * 4
                //         y = (j * heightStep + sqy) * 4 * width

                //         imageData.data[x + y ] = parseInt(i * 5) // (parseInt(hvalue)) / divisor + 100 //Math.abs(parseInt(hvalue)) / divisor//value / Math.pow(2, 16) * 255
                //         imageData.data[x + y + 1] = parseInt(j * 8)
                //         imageData.data[x + y + 2] = 0 // Math.abs(parseInt(vvalue)) / divisor

                //         // if(hvalue >= 0) {
                //         //     imageData.data[x + y] = 0 //(parseInt(vvalue)) / divisor + 100 //0 //x / 10
                //         //     imageData.data[x + y + 1] = Math.abs(parseInt(hvalue)) / divisor
                //         //     imageData.data[x + y + 2] = 0 //Math.abs(parseInt(hvalue)) / divisor //value / Math.pow(2, 16) * 255
                //         // } else {
                //         //     imageData.data[x + y ] = Math.abs(parseInt(hvalue)) / divisor // (parseInt(hvalue)) / divisor + 100 //Math.abs(parseInt(hvalue)) / divisor//value / Math.pow(2, 16) * 255
                //         //     imageData.data[x + y + 1] = 0
                //         //     imageData.data[x + y + 2] = 0 // Math.abs(parseInt(vvalue)) / divisor
                //         // }
                //         imageData.data[x + y + 3] = 254 //Math.sqrt(hvalue * hvalue) / divisor //parseInt(value) / 65536 * 256
                //     }
                // }

                var parts = 10
                var hvalue = parseInt(data.hor16[(i + j * mbsWidth) * 16] / divisor2 )
                var vvalue = parseInt(data.ver16[(i + j * mbsWidth) * 16 ] / divisor2 )
                var fullbarlength = Math.sqrt(Math.pow(hvalue, 2) + Math.pow(vvalue, 2)) 
                // console.log('fullbarlength', fullbarlength)

                for(var p = 1 ; p <= parts ; p++ ) {
                    var hvalue = -1 * parseInt(data.hor16[(i + j * mbsWidth) * 16 + sqx + sqy * 4] / divisor2 / parts * p)
                    var vvalue = -1 * parseInt(data.ver16[(i + j * mbsWidth) * 16 + sqx + sqy * 4] / divisor2 / parts * p)
                    
                    var barlength = Math.sqrt(Math.pow(hvalue, 2) + Math.pow(vvalue, 2)) 
                    if(barlength < 500) {

                        for (var sqy = 0; sqy < 1; sqy++) {
                            for (var sqx = 0; sqx < 1; sqx++) {
                                
                                // values.push(value)
                                x = (i * widthStep + sqx) * 4 + hvalue * 4
                                y = (j * heightStep + sqy + vvalue) * 4 * width
        
                                imageData.data[parseInt(x + y)] = ( fullbarlength - averagelength ) * 100 // (parseInt(hvalue)) / divisor + 100 //Math.abs(parseInt(hvalue)) / divisor//value / Math.pow(2, 16) * 255
                                imageData.data[parseInt(x + y + 1)] = 0 // parseInt(j * 8)
                                imageData.data[parseInt(x + y + 2)] = 0 // Math.abs(parseInt(vvalue)) / divisor
        
                                // if(hvalue >= 0) {
                                //     imageData.data[x + y] = 0 //(parseInt(vvalue)) / divisor + 100 //0 //x / 10
                                //     imageData.data[x + y + 1] = Math.abs(parseInt(hvalue)) / divisor
                                //     imageData.data[x + y + 2] = 0 //Math.abs(parseInt(hvalue)) / divisor //value / Math.pow(2, 16) * 255
                                // } else {
                                //     imageData.data[x + y ] = Math.abs(parseInt(hvalue)) / divisor // (parseInt(hvalue)) / divisor + 100 //Math.abs(parseInt(hvalue)) / divisor//value / Math.pow(2, 16) * 255
                                //     imageData.data[x + y + 1] = 0
                                //     imageData.data[x + y + 2] = 0 // Math.abs(parseInt(vvalue)) / divisor
                                // }
                                imageData.data[x + y + 3] = 254 //Math.sqrt(hvalue * hvalue) / divisor //parseInt(value) / 65536 * 256
                            }
                        }

                    }
                }


                // var sqy = 0
                // var sqx = 0
                // // for (var sqy = 0; sqy < 4; sqy++) {
                // //     for (var sqx = 0; sqx < 4; sqx++) {
                        
                // var hvalue = data.hor16[(i + j * mbsWidth) * 16 + sqx + sqy * 4]
                // var vvalue = data.ver16[(i + j * mbsWidth) * 16 + sqx + sqy * 4]
    
                // var pieces = 100
    
                // for(var di = 1 ; di <= pieces ; di ++) {
    
                // // for(var hi = Math.abs(hvalue) ; hi > 0 ; hi -= Math.abs(hvalue) / 10) {
                // //     for(var vi = Math.abs(vvalue) ; vi > 0 ; vi -= Math.abs(vvalue) / 10) {
                //         hi = hvalue / pieces * di / 1000
                //         vi = vvalue / pieces * di / 1000
    
                //         x =  (i * widthStep + sqx) * 4 + hi * 4
                //         y =  (j * heightStep + sqy + vi) * 4 * width
    
                //         // if(vvalue >= 0) {
                //         //     imageData.data[x + y] = 0 //Math.abs(parseInt(vvalue)) / divisor//x / 10
                //         //     imageData.data[x + y + 1] = 0
                //         //     imageData.data[x + y + 2] = 0 //Math.abs(parseInt(vvalue)) / divisor//value / Math.pow(2, 16) * 255
                //         // } else {
                //             imageData.data[parseInt(x + y)] = 200 //Math.abs(parseInt(vvalue)) / divisor //x / 10
                //             imageData.data[parseInt(x + y + 1)] = 0 //Math.abs(parseInt(vvalue)) / divisor//value / Math.pow(2, 16) * 255
                //             imageData.data[parseInt(x + y + 2)] = 0
                //         // }
                //         imageData.data[x + y + 3] = 200 // Math.sqrt(vvalue * vvalue) / divisor //parseInt(value) / 65536 * 256
    
                // //     }
                // // }
                // // console.log('values', values)
                // //     }
                // // }
    
                // }

            // console.log(values)


            // for (var hv = 0; hv < (hval / 255 * 16); hv++) {
            //     x = (i * widthStep + hv) * 4 + 8 * 4
            //     y = (j * heightStep + 8) * 4 * width

            //     // imageData.data[x + y] = 0
            //     // imageData.data[x + y + 1] = 0
            //     // imageData.data[x + y + 2] = 0
            //     // imageData.data[x + y + 3] = 250


            //     // positions.push([i, j, x, y, val])

            //     // imageData.data[x + y] = 250 - val     // R
            //     imageData.data[x + y + 1] = hval // G
            //     // imageData.data[x + y + 2] = 250 - val // B
            //     imageData.data[x + y + 3] = hval       // A

            // }

            // for (var vv = 0; vv < (vval / 255 * 16); vv++) {
            //     x = (i * widthStep) * 4 + 8 * 4
            //     y = (j * heightStep + 8 + vv) * 4 * width

            //     // imageData.data[x + y] = 0
            //     // imageData.data[x + y + 1] = 0
            //     // imageData.data[x + y + 2] = 0
            //     // imageData.data[x + y + 3] = 250


            //     // positions.push([i, j, x, y, val])

            //     // imageData.data[x + y] = 250 - val     // R
            //     // imageData.data[x + y + 1] = 250 - val // G
            //     imageData.data[x + y + 2] = 250 - hval // B
            //     imageData.data[x + y + 3] = hval       // A

            // }

            // console.log(i, j)
            // rgba = rgba.concat([0,0,0,1])
        }
    }
    // console.log(positions)

    // imageData.data.set(imageData);

    // if(croppingParams === null) {
    ctx.putImageData(imageData, 0, 0);
    // } else {
    //     ctx.putImageData(imageData, -croppingParams.left, -croppingParams.top, 0, 0, croppingParams.width, croppingParams.height);
    // }

    // this.drawOutputMbsPicture
}

/**
 * Draw the next output picture using WebGL
 */
H264bsdCanvas.prototype.drawNextOuptutPictureGL = function (width, height, croppingParams, data) {
    var gl = this.contextGL;
    var texturePosBuffer = this.texturePosBuffer;
    var yTextureRef = this.yTextureRef;
    var uTextureRef = this.uTextureRef;
    var vTextureRef = this.vTextureRef;

    if (croppingParams === null) {
        gl.viewport(0, 0, width, height);
    } else {
        gl.viewport(0, 0, croppingParams.width, croppingParams.height);

        var tTop = croppingParams.top / height;
        var tLeft = croppingParams.left / width;
        var tBottom = croppingParams.height / height;
        var tRight = croppingParams.width / width;
        var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);
    }

    var i420Data = data;

    var yDataLength = width * height;
    var yData = i420Data.subarray(0, yDataLength);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);

    var cbDataLength = width / 2 * height / 2;
    var cbData = i420Data.subarray(yDataLength, yDataLength + cbDataLength);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width / 2, height / 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, cbData);

    var crDataLength = cbDataLength;
    var crData = i420Data.subarray(yDataLength + cbDataLength, yDataLength + cbDataLength + crDataLength);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width / 2, height / 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, crData);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Draw next output picture using ARGB data on a 2d canvas.
 */
H264bsdCanvas.prototype.drawNextOuptutPictureRGBA = function (width, height, croppingParams, data) {
    var canvas = this.canvasElement;

    var croppingParams = null;

    var argbData = data;

    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, width, height);
    imageData.data.set(argbData);

    if (croppingParams === null) {
        ctx.putImageData(imageData, 0, 0);
    } else {
        ctx.putImageData(imageData, -croppingParams.left, -croppingParams.top, 0, 0, croppingParams.width, croppingParams.height);
    }
}

H264bsdCanvas.prototype.drawNextOuptutPictureRGBA = function (width, height, croppingParams, data) {
    var canvas = this.canvasElement;

    var croppingParams = null;

    var argbData = data;

    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, width, height);
    imageData.data.set(argbData);

    if (croppingParams === null) {
        ctx.putImageData(imageData, 0, 0);
    } else {
        ctx.putImageData(imageData, -croppingParams.left, -croppingParams.top, 0, 0, croppingParams.width, croppingParams.height);
    }
}
