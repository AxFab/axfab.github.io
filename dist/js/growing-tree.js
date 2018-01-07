

var Grow = function (opt) {
  this.width = opt.width;
  this.height = opt.height;
  this.ratioSz = opt.ratioSz || 0.65;
  this.ratioLg = opt.ratioLg || 0.85;
  this.ratioAg = opt.ratioAg || 1.20;
  this.ratioSt = opt.ratioSt || 0.40;
  this.hue = opt.hue || Math.random() * 360;
  this.speed = opt.speed || 1;
  this.branchmax = opt.branchmax || 3;
  this.bgColor = opt.bgColor || 'black';
  this.getSaturation = opt.getSaturation || function (pts) {
    return (pts.sz * 5) + 50;
  }
  this.points = [
    {
      x:opt.width / 2,
      y:opt.height,
      ox:opt.width / 2,
      oy:opt.height,
      sz: 10 || opt.size,
      ttl: 100 || opt.ttl,
      to: 100 || opt.ttl,
      ag: 0
    }
  ];

}

Grow.prototype.run = function (ctx) {
  var self = this;
  self.init(ctx);
  setInterval(function () {
    self.life(ctx);
  }, 20);
}

Grow.prototype.init = function (ctx) {

  ctx.canvas.width = this.width;
  ctx.canvas.height = this.height;

  ctx.fillStyle = this.bgColor
  ctx.beginPath()
  ctx.rect(0, 0, this.width, this.height)
  ctx.fill();
}

Grow.prototype.life = function (ctx) {
  var points = this.points,
      n = this.points.length;
  for (var i = 0; i < n; ++i) {
    if (this.points[i].ttl < 0) {
      continue;
    }
    var sat = this.getSaturation(points[i]);
    ctx.fillStyle = 'hsl('+this.hue+',90%,'+sat.toFixed(0)+'%)'
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, points[i].sz, 0, 2* Math.PI);
    ctx.fill();

    points[i].x += Math.sin(points[i].ag) * this.speed;
    points[i].y -= Math.cos(points[i].ag) * this.speed;
    points[i].ttl -= this.speed;
    if (points[i].ttl <= 0 && points[i].to > 10) {
      var m = parseInt(Math.random() * this.branchmax) + 1;
      for (var j = 0; j < m; ++j) {
        var d = Math.random() * this.ratioSt + 1 - this.ratioSt,
            x = points[i].ox + d * (points[i].x - points[i].ox),
            y = points[i].oy + d * (points[i].y - points[i].oy);
        points.push({
          x: x,
          y: y,
          ox: x,
          oy: y,
          sz: points[i].sz * this.ratioSz,
          ttl: points[i].to * this.ratioLg,
          to: points[i].to * this.ratioLg,
          ag: points[i].ag + Math.random() * this.ratioAg - this.ratioAg * 0.5
        })
      }
    }
  }
}

window.onload = function () {
  var ctx = document.getElementById('cvs').getContext('2d');
  var btn = document.getElementById('grow');
  var btn2 = document.getElementById('grow2');
  var btn3 = document.getElementById('grow3');
  var tm = null;
  ctx.canvas.width = 600;
  ctx.canvas.height = 600;
  ctx.rect(0,0,600,600);
  ctx.fill();

  let start = function (g) {
    if (tm !== null)
      clearInterval(tm);
    let i = 0;
    g.init(ctx);
    tm = setInterval(function () {
      if (++i >= 530) {
        clearInterval(tm);
      }
      g.life(ctx);
      // ctx.fillStyle = 'black'
      // ctx.beginPath();
      // ctx.rect(0, 0, 30, 30)
      // ctx.fill();
      // ctx.fillStyle = 'white'
      // ctx.fillText('' + i, 10, 10);
    }, 20);
  };

  btn.onclick = function () {
    start(new Grow({ width:600, height:600 }));
  };

  btn2.onclick = function () {
    start(new Grow({
      width:600,
      height:600,
      getSaturation: function (pts) {
        return (pts.sz * 5) + pts.ttl;
      }
    }));
  };

  btn3.onclick = function () {
    start(new Grow({
      width:600,
      height:600,
      getSaturation: function (pts) {
        return 100;
      }
    }));
  };

  start(new Grow({
    width:600,
    height:600,
    getSaturation: function (pts) {
      return 100;
    }
  }));
};
