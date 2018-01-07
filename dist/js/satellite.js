
window.onload = function () {

  (function () {

    var gl;

    var Scene = function (id) {
      if (!(this instanceof Scene))
        return new Scene();

      this._cvs = document.getElementById('cvs');
      this._cvs.width = 500;
      this._cvs.height = 300;
      this._objs = [];
      this._matrixStack = [];
      this.initGL();
      this.initShaders();
    }

    Scene.prototype.initGL = function () {
      gl = this._cvs.getContext('experimental-webgl');
      gl.viewportWidth = this._cvs.width;
      gl.viewportHeight = this._cvs.height;

      this._mvMatrix = mat4.create();
      this._pMatrix = mat4.create();
    }

    Scene.prototype.initShaders = function () {
      var vertexShader = Scene.getShader(gl, 'shader-vs');
      var fragmentShader = Scene.getShader(gl, 'shader-fs');

      var shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader)
      gl.attachShader(shaderProgram, fragmentShader)
      gl.linkProgram(shaderProgram);
      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
        throw new Error('Unable to link shaders');
      gl.useProgram(shaderProgram);


      // This section depend on shaders, variable mapping
      shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
      gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
      shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');
      gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

      shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, 'aVertexNormal');
      gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

      shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
      shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
      shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, 'uNMatrix');

      shaderProgram.uAmbiantColor = gl.getUniformLocation(shaderProgram, 'uAmbiantColor');
      shaderProgram.uDirectionalColor = gl.getUniformLocation(shaderProgram, 'uDirectionalColor');
      shaderProgram.uLightingDirection = gl.getUniformLocation(shaderProgram, 'uLightingDirection');

      this._shaders = shaderProgram;
    }

    Scene.prototype.createFloatBuffer = function (data) {
      var buf = gl.createBuffer();
      var arr = new Float32Array(data);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      return buf;
    }

    Scene.prototype.createShortBuffer = function (data) {
      var buf = gl.createBuffer();
      var arr = new Uint16Array(data);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      return buf;
    }

    Scene.prototype.createMesh = function (vertices, colors, indexes, normals) {
      var mtx = mat4.create();
      mat4.identity(mtx);
      var mesh = {
        vertices: this.createFloatBuffer(vertices),
        numItems: vertices.length / 3,
        method: gl.TRIANGLES,
        matrix: mtx,
      }

      if (colors)
        mesh.colors = this.createFloatBuffer(colors);

      mesh.normals = this.createFloatBuffer(normals != null ? normals : vertices);
      if (indexes) {
        mesh.indexes = this.createShortBuffer(indexes);
        mesh.indexCount = indexes.length
      }

      return mesh;
    }

    Scene.prototype.addObject = function (mesh) {
      this._objs.push(mesh);
    }

    Scene.prototype.resetScene = function () {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);

      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, this._pMatrix);
    }

    Scene.prototype.drawScene = function () {
      this.resetScene();
      for (var k in this._objs)
        this.drawMesh(this._objs[k]);
    }

    Scene.prototype.pushMatrix = function () {
      var matrix = mat4.create();
      mat4.set(this._mvMatrix, matrix);
      this._matrixStack.push (matrix);
    }

    Scene.prototype.popMatrix = function () {
      mat4.set(this._matrixStack.pop(), this._mvMatrix);
    }

    Scene.prototype.drawMesh = function (mesh, linked) {
      if (linked) {
        this.pushMatrix();
        var copy = mat4.create();
        mat4.set(this._mvMatrix, copy);
        mat4.multiply(copy, mesh.matrix, this._mvMatrix);
      } else {
        this._mvMatrix = mesh.matrix
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
      gl.vertexAttribPointer(this._shaders.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normals);
      gl.vertexAttribPointer(this._shaders.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.colors);
      gl.vertexAttribPointer(this._shaders.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

      this.setMatrixUniforms();
      if (mesh.indexes) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);
        gl.drawElements(mesh.method, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawArrays(mesh.method, 0, mesh.numItems);
      }

      if (mesh.children) {
        for (var i = 0; i<mesh.children.length; ++i) {
          this.drawMesh(mesh.children[i], true);
        }
      }

      if (linked) {
        this.popMatrix();
      }
    }

    Scene.prototype.setMatrixUniforms = function () {
      gl.uniform3f(this._shaders.uAmbiantColor, 0.7, 0.7, 0.7);
      gl.uniform3f(this._shaders.uDirectionalColor, 0.6, 0.6, 0.6);
      gl.uniform3f(this._shaders.uLightingDirection, 1.0, 1.0, 0.0);

      gl.uniformMatrix4fv(this._shaders.pMatrixUniform, false, this._pMatrix);
      gl.uniformMatrix4fv(this._shaders.mvMatrixUniform, false, this._mvMatrix);

      var nMatrix = mat3.create();
      mat4.toInverseMat3(this._mvMatrix, nMatrix);
      mat3.transpose(nMatrix);
      gl.uniformMatrix3fv(this._shaders.nMatrixUniform, false, nMatrix);
    }

    Scene.getShader = function (gl, id) {
      var shaderScript = document.getElementById(id);
      if (!shaderScript) throw new Error('Unable to locate source code: ' + id);
      var str = '';
      var k = shaderScript.firstChild;
      while(k) {
        if (k.nodeType == 3)
          str += k.textContent;
        k = k.nextSibling;
      }

      var shader;
      if (shaderScript.type == 'x-shader/x-fragment')
        shader = gl.createShader(gl.FRAGMENT_SHADER)
      else if (shaderScript.type == 'x-shader/x-vertex')
        shader = gl.createShader(gl.VERTEX_SHADER)
      else
        throw new Error('Undefined shader-type: ' + id);

      gl.shaderSource(shader, str);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))  {
        alert(gl.getShaderInfoLog(shader));
        throw new Error('unable to compile: ' + id);
      }
      return shader;
    }

    this.Scene = Scene;
  }).call(this);


  var sg = {
    middle: function(a,b) { return [(a[0]+b[0])/2, (a[1]+b[1])/2]; },
    sub: function(a,b) { return [a[0]-b[0], a[1]-b[1]]; },
    add: function(a,b) { return [a[0]+b[0], a[1]+b[1]]; },
    mul: function(a,b) { return [a[0]*b, a[1]*b]; },
    cross: function(a,b,c,d) {
      var dx1 = a[0] - b[0],
          dy1 = a[1] - b[1],
          dx2 = c[0] - d[0],
          dy2 = c[1] - d[1],
          cf1 = dy1 / dx1,
          cf2 = dy2 / dx2,
          ov1 = a[1] - cf1 * a[0],
          ov2 = c[1] - cf2 * c[0]
          x = (ov2 - ov1) / (cf1 - cf2),
          y = cf1 * x + ov1;
      return [x, y]
    },
    affine: function(a,b,v) { return a*v+b; },
    length: function (a) { return Math.sqrt(a[0]*a[0] + a[1]*a[1]); },
    normalize: function(a) {
      var lg = sg.length(a);
      return [a[0]/lg, a[1]/lg];
    }
  };

  (function () {
    var Mesh = {}

    Mesh.unpack = function (arr) {
      var buf = [];
      for (var i=0; i<arr.length; ++i) {
        for (var j=0; j<arr[i].length; ++j) {
          buf.push(arr[i][j]);
        }
      }
      return buf;
    }

    var CylindricMesh = function () {
      this._lnPos = []
      this._lnNor = []
      this._lnClr = []
    }

    CylindricMesh.prototype.line = function (p1, p2, color, ctx)
    {
      var df = sg.sub(p2, p1);
      var ag = Math.atan2(df[1], df[0]) - Math.PI/2;
      var nor = [Math.cos(ag), Math.sin(ag)]

      this._lnPos.push(p1);
      this._lnPos.push(p2);
      this._lnNor.push(nor);
      this._lnNor.push(nor);
      this._lnClr.push(color);
      this._lnClr.push(color);

      if (ctx != null) {
        var cn = [ctx.canvas.width / 2, ctx.canvas.height / 2];
        var sz = 20;
        ctx.beginPath();
        ctx.moveTo(sg.affine(sz, cn[0], p1[0]), sg.affine(sz, cn[1], -p1[1]));
        ctx.lineTo(sg.affine(sz, cn[0], p2[0]), sg.affine(sz, cn[1], -p2[1]));
        ctx.lineWidth = 3
        ctx.strokeStyle = 'rgb(' +
          (color[0]*512).toFixed(0)+','+
          (color[1]*512).toFixed(0)+','+
          (color[2]*512).toFixed(0)+')'
        ctx.stroke();
      }
    }

    CylindricMesh.prototype.quatric = function (p1, p2, p3, cn, n, k, color) {
      var m1 = sg.middle(p1, p2)
      var m2 = sg.middle(p3, p2)
      if (n > 0) {
        var m3 = sg.cross(p1, m2, p3, m1);
        this.quatric(p1, m1, m3, cn, n-1, k, color);
        this.quatric(m3, m2, p3, cn, n-1, k, color);
      } else {
        this._lnPos.push(p1);
        this._lnNor.push(sg.mul(sg.sub(cn, p1), k));
        this._lnClr.push(color);
      }
    }

    CylindricMesh.prototype.curve = function (p1, p2, p3, color, opt, ctx)
    {
      var ptMid = sg.middle(p1, p2);
      var ptSym = sg.add(sg.mul(sg.sub(ptMid, p3),2), p3);

      this.quatric(p1, p3, p2, ptSym, opt[0], opt[1], color);

      this._lnPos.push(p2);
      this._lnNor.push(sg.mul(sg.sub(ptSym, p2), opt[1]));
      this._lnClr.push(color);

      if (ctx != null) {
        var cn = [ctx.canvas.width / 2, ctx.canvas.height / 2];
        var sz = 20;

        ctx.beginPath()
        ctx.moveTo(sg.affine(sz, cn[0], p1[0]), sg.affine(sz, cn[1], -p1[1]));
        ctx.quadraticCurveTo(
          sg.affine(sz, cn[0], p3[0]), sg.affine(sz, cn[1], -p3[1]),
          sg.affine(sz, cn[0], p2[0]), sg.affine(sz, cn[1], -p2[1]));
        ctx.lineWidth = 3
        ctx.strokeStyle = 'rgb(' +
          (color[0]*512).toFixed(0)+','+
          (color[1]*512).toFixed(0)+','+
          (color[2]*512).toFixed(0)+')'
        ctx.stroke();
      }
    }

    CylindricMesh.prototype.compile = function (scene)
    {
      var vertexes = [], colors = [], indexes = [], normals = [];

      // Normalize Normals
      for (var i=0; i<this._lnNor.length; ++i) {

        var lg = sg.length(this._lnNor[i])
        this._lnNor[i] = sg.normalize(this._lnNor[i])
      }

      var sk = this._lnPos;
      var sn = this._lnNor;
      var sc = this._lnClr;

      var n = sk.length;
      var s = 32
      var a = 2*Math.PI/s;
      // s = 2
      // Create vertexes attributes
      for (var i=0; i<s; ++i) {
        for (var j=0; j<n; ++j) {
          vertexes.push([
            sk[j][0] * Math.cos(i * a),
            sk[j][1],
            sk[j][0] * Math.sin(i * a),
          ]);
          normals.push([
            sn[j][0] * Math.cos(i * a),
            sn[j][1],
            sn[j][0] * Math.sin(i * a),
          ]);
          colors.push(sc[j]);
        }
      }

      // Create face indexes
      for (var i=0; i<s-1; ++i) {
        var m = i*n
        for (var j=0; j<n-1; ++j) {
          indexes.push([j+m, j+m+1, j+m+n]);
          indexes.push([j+m+n, j+m+n+1, j+m+1]);
        }
      }

      for (var j=0; j<n-1; ++j) {
        indexes.push([j, j+1, j+m+n]);
        indexes.push([j+m+n, j+m+n+1, j+1]);
      }


      vertexes = Mesh.unpack(vertexes);
      colors = Mesh.unpack(colors);
      indexes = Mesh.unpack(indexes);
      normals = Mesh.unpack(normals);
      return scene.createMesh(vertexes, colors, indexes, normals);
    }

    this.CylindricMesh = CylindricMesh;
  }).call(this);


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

  var cy_part = false

  var ctx = document.getElementById('cvs2').getContext('2d')
  ctx.canvas.width = 300
  ctx.canvas.height = 300


  var Color = {
    BLACK: [0.1, 0.1, 0.1, 1.0],
    GRAY: [0.4, 0.4, 0.4, 1.0],
    GREEN: [0.1, 0.4, 0.1, 1.0],
    YELLOW: [0.4, 0.4, 0.0, 1.0],
    BLUE: [0.1, 0.3, 0.5, 1.0],
  }

  var sc = Scene();

  //var mesh1 = sc.createMesh(sat1Vertex, sat1Color, sat1Index, sat1Normal);
  var sat1 = new CylindricMesh();
  sat1.curve([0, -4.5], [1, -4], [1, -4.2], Color.BLACK, [2,-1], ctx);
  sat1.line([1, -4], [1, -5], Color.GREEN, ctx);
  sat1.line([1, -5], [3, -5], Color.GREEN, ctx);
  sat1.line([3, -5], [3, -4], Color.GRAY, ctx);
  sat1.line([3, -4], [4, -3], Color.GRAY, ctx);
  sat1.line([4, -3], [4, 0], Color.GRAY, ctx);
  sat1.curve([4.0, 0.0], [3.5, 0.5], [3.8, 0.5], Color.YELLOW, [4,-1], ctx);
  sat1.curve([3.5, 0.5], [3.0, 1.5], [3.2, 0.7], Color.YELLOW, [4,1], ctx);
  sat1.line([3, 1.5], [3, 3], Color.GRAY, ctx);
  sat1.line([3, 3], [2, 4], Color.GRAY, ctx);
  sat1.curve([2, 4], [0, 5], [1, 5], Color.BLUE, [4,1], ctx);

  var sat2 = new CylindricMesh();
  sat2.curve([0, -4.5], [1, -4], [1, -4.2], Color.BLACK, [2,-1], ctx);
  sat2.line([1, -4], [1, -5], Color.GREEN, ctx);
  sat2.line([1, -5], [3, -5], Color.GREEN, ctx);
  sat2.line([3, -5], [3, -4], Color.GRAY, ctx);
  sat2.line([3, -4], [3.2, -3.8], Color.GRAY, ctx);
  sat2.line([3.2, -3.8], [3.2, 3.8], Color.GRAY, ctx);
  sat2.line([3.2, 3.8], [3, 4], Color.GRAY, ctx);
  sat2.line([3, 4], [3, 5], Color.GRAY, ctx);
  sat2.line([3, 5], [1, 5], Color.GREEN, ctx);
  sat2.line([1, 5], [1, 4], Color.GREEN, ctx);
  sat2.curve([0, 4.5], [1, 4], [1, 4.2], Color.BLACK, [2,-1], ctx);

  var mesh1 = sat1.compile(sc);
  mat4.translate(mesh1.matrix, [0.0, -5.0, -45.0]);
  sc.addObject(mesh1)

  var mesh2 = sat2.compile(sc);
  mat4.translate(mesh2.matrix, [0.0, -10.0, 0.0]);
  mesh1.children = [mesh2]

  var mesh3 = sat2.compile(sc);
  mat4.translate(mesh3.matrix, [0.0, -10.0, 0.0]);
  mesh2.children = [mesh3]

  var mesh4 = sat2.compile(sc);
  mat4.translate(mesh4.matrix, [0.0, -10.0, 0.0]);
  mat4.rotate(mesh4.matrix, Math.PI /2, [0, 0, 1]);
  mesh3.children = [mesh4]

  var mesh5 = sat2.compile(sc);
  mat4.rotate(mesh5.matrix, Math.PI /2, [1, 0, 0]);
  // mat4.translate(mesh5.matrix, [-20.0, 0.0, 0.0]);
  // mat4.rotate(mesh5.matrix, Math.PI /2, [0, 0, 1]);
  var mesh6 = sat2.compile(sc);
  mat4.rotate(mesh6.matrix, Math.PI /2, [0, 0, 1]);

  mesh4.children = [mesh5, mesh6]

  var mesh7 = sat2.compile(sc);
  mat4.translate(mesh7.matrix, [0.0, -10.0, 0.0]);
  // mesh5.children = [mesh7]

  var mesh8 = sat2.compile(sc);
  mat4.translate(mesh8.matrix, [0.0, 10.0, 0.0]);
  mesh5.children = [mesh7, mesh8]


  //mat4.rotate(mesh1.matrix, Math.PI /2, [0, 0, 1]);
  mat4.rotate(mesh1.matrix, Math.PI /6, [0, 1, 0]);
  tick = 0
  setInterval(function () {
    ++tick;
    // mat4.rotate(mesh1.matrix, 0.05, [0, 1, 0]);
    var plg = 100
    var prd = parseInt((tick + plg) / plg / 2)
    //if ((prd % 2) == 0)
    mat4.translate(mesh1.matrix, [0, 0.01, 0]);
    mat4.rotate(mesh1.matrix, 0.01, [1, 0, 0]);
    //else
      //mat4.rotate(mesh1.matrix, -0.01, [1, 0, 0]);
    sc.drawScene();
  }, 25);
  // sc.dispose()
}
