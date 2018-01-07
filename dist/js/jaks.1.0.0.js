jaks = {};

var Utilities = {}

// ---------------------------------------------------------------------------
Utilities.extends = function (model, obj)
{
  for (var k in obj)
    model[k] = obj[k];
  return model;
}

// ---------------------------------------------------------------------------
/** Formats date according to specification described in Java SE
 * SimpleDateFormat class.
 * @return {String}
 */
Utilities.formatDate = function (date, mask, utc)
{
  /* Form Open source code:
   *
   * Date Format 1.2.3
   * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
   * MIT license
   *
   * Includes enhancements by Scott Trenda and Kris Kowal
   */

  var dF = {
    masks:{
      "default":      "ddd mmm dd yyyy HH:MM:ss",
      shortDate:      "m/d/yy",
      mediumDate:     "mmm d, yyyy",
      longDate:       "mmmm d, yyyy",
      fullDate:       "dddd, mmmm d, yyyy",
      shortTime:      "h:MM TT",
      mediumTime:     "h:MM:ss TT",
      longTime:       "h:MM:ss TT Z",
      isoDate:        "yyyy-mm-dd",
      isoTime:        "HH:MM:ss",
      isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
      isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    },
    i18n:{
      dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
      ],
      monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
      ]
    }
  };


  var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
    timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    timezoneClip = /[^-+\dA-Z]/g,
    pad = function (val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) val = "0" + val;
      return val;
    };

  // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
  if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
    mask = date;
    date = undefined;
  }

  // Passing date through Date applies Date.parse, if necessary
  date = date ? new Date(date) : new Date;
  if (isNaN(date)) throw SyntaxError("invalid date");

  mask = String(dF.masks[mask] || mask || dF.masks["default"]);

  // Allow setting the utc argument via the mask
  if (mask.slice(0, 4) == "UTC:") {
    mask = mask.slice(4);
    utc = true;
  }

  var _ = utc ? "getUTC" : "get",
    d = date[_ + "Date"](),
    D = date[_ + "Day"](),
    m = date[_ + "Month"](),
    y = date[_ + "FullYear"](),
    H = date[_ + "Hours"](),
    M = date[_ + "Minutes"](),
    s = date[_ + "Seconds"](),
    L = date[_ + "Milliseconds"](),
    o = utc ? 0 : date.getTimezoneOffset(),
    flags = {
      d:    d,
      dd:   pad(d),
      ddd:  dF.i18n.dayNames[D],
      dddd: dF.i18n.dayNames[D + 7],
      m:    m + 1,
      mm:   pad(m + 1),
      mmm:  dF.i18n.monthNames[m],
      mmmm: dF.i18n.monthNames[m + 12],
      yy:   String(y).slice(2),
      yyyy: y,
      h:    H % 12 || 12,
      hh:   pad(H % 12 || 12),
      H:    H,
      HH:   pad(H),
      M:    M,
      MM:   pad(M),
      s:    s,
      ss:   pad(s),
      l:    pad(L, 3),
      L:    pad(L > 99 ? Math.round(L / 10) : L),
      t:    H < 12 ? "a"  : "p",
      tt:   H < 12 ? "am" : "pm",
      T:    H < 12 ? "A"  : "P",
      TT:   H < 12 ? "AM" : "PM",
      Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
      o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
      S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
    };

  return mask.replace(token, function ($0) {
    return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
  });
}


// ---------------------------------------------------------------------------
/** Returns a tabular 2D array representation of a CSV string using a custom
 * delimiter.
 * @return {string[][]}
 */
Utilities.parseCsv = function (data, opt)
{
  var doc = [];
  var arr = [];
  var value = '';
  var inquote = false;
  opt = Utilities.extends({
      separator: ',',
      quoteSym: '"',

  }, opt);

  for (var i = 0; i < data.length; ++i) {
    if (data[i] == opt.quoteSym && !inquote) {
      inquote = true;
    } else if (data[i] == opt.quoteSym) {
      if (i+1 < data.length && data[i+1] == opt.quoteSym) {
        value += opt.quoteSym;
        ++i;
      } else {
        inquote = false;
      }
    } else if (data[i] == opt.separator && !inquote) {
      arr.push(value);
      value = '';
    } else if (data[i] == '\n' || data[i] == '\r') {
      if (data[i] == '\r' && i+1 < data.length && data[i+1] == '\n') {
        ++i
      }
      if (!inquote) {
        arr.push(value);
        doc.push(arr);
        arr = [];
        value = '';
      } else {
        value += data[i];
      }
    } else {
      if (value == '' && !inquote && data[i] <= ' ')
        continue;
      value += data[i];
    }
  }

  if (arr.length > 0 || value != '') {
    arr.push(value);
    doc.push(arr);
  }
  return doc;
}


// ---------------------------------------------------------------------------
/** Compute a digest using SHA-1 on the specified value
 */
Utilities.sha1 = function (blob)
{

}


// ---------------------------------------------------------------------------
/** Sleeps for specified number of milliseconds.
 */
Utilities.sleep = function (milliseconds)
{
  throw "Not supported";
}


// ---------------------------------------------------------------------------
/** Takes a Blob representing a zip file and returns its component files.
 * @return {blob}
 */
Utilities.unzip = function (blob, name)
{

}


// ---------------------------------------------------------------------------
/** Creates a new Blob object that is a zip file containing the data from the
 * Blobs passed in.
 * @return {blob}
 */
Utilities.zip = function (blob, name)
{

}


// ===========================================================================

String.prototype.trim=function()
{
  return this.replace(/^\s+|\s+$/g, '');
}

String.prototype.ltrim=function()
{
  return this.replace(/^\s+/,'');
}

String.prototype.rtrim=function()
{
  return this.replace(/\s+$/,'');
}

String.prototype.fulltrim=function()
{
  return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
}

String.prototype.startwith=function(str)
{
  return this.substring(0, str.length) == str;
}

String.prototype.endswith=function(str)
{
  return this.substring(this.length - str.length, this.length) == str;
}

// ===========================================================================
Array.prototype.contains = function (item)
{
  for (var i=0; i<this.length; ++i)
    if (this[i] == item)
      return true;
  return false;
};


// ===========================================================================
Date.prototype.format = function (mask, utc)
{
  return Utilities.dateFormat(this, mask, utc);
};

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function() {

  this.getStyle = function(elm, rule) {
    var strValue = "";
    if (document.defaultView && document.defaultView.getComputedStyle) {
      strValue = document.defaultView.getComputedStyle(elm, "").getPropertyValue(rule);
    } else if (elm.currentStyle) {
      rule = rule.replace(/\-(\w)/g, function (strMatch, p1){
        return p1.toUpperCase();
      });
      strValue = elm.currentStyle[rule];
    }
    return strValue;
  };

}).apply (jaks);

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  this.Spreadsheet = function (data, callback, options) {

    var prv = jaks.extends({
      headRows:1,
      headCols:1,
      data:[[]],
      label:[]
    }, options);

    var lableIdx = function (field) {
      for (var i=0; i<prv.label.length; ++i) {
        if (prv.label[i] == field)
          return i;
      }
      return null;
    }

    var htmlLine = function (arr, opt)
    {
      var html = '<tr>';
      for (var i=0; i<arr.length; ++i) {
        if (opt.excludeCols != null && opt.excludeCols.contains(i))
          continue;
        if (i < opt.headCols)
          html += '<th>' + arr[i] +'</th>';
        else
          html += '<td>' + arr[i] +'</td>';
      }
      return html + '</tr>';
    }

    this.html = function (css, options)
    {
      var opt = jaks.extends({}, prv);
      var opt = jaks.extends(opt, options);
      // TODO options can overide prv

      if (typeof css !== 'string')
        css = ''
      var html = '<table class="' + css + '">';
      html += (opt.headRows > 0 ? '<thead>' : '<tbody>');
      for (var i=0; i<prv.data.length; ++i) {
        if (opt.excludeRows != null && opt.excludeRows.contains(i))
          continue;
        if (i == opt.headRows && opt.headRows > 0)
          html += '</thead><tbody>';
        html += htmlLine(prv.data[i], opt);
      }
      return html + '</tbody></table>';
    }

    this.compute = function (row, field) {
      if (typeof (field) == 'string') {
        var ex = jaks.Expression (field);
        return ex.compute ({ row:row, dataprovider:this });
      } else {
        return prv.data[row][field];
      }
    }

    this.get = function (row, field) {
      if (typeof (field) == 'string') {
        field = lableIdx(field);
        if (field == null)
          return null;
      }
      if (prv.data[row] == null)
        return null;
      return this.compute (row, field);
    }

    this.set = function (row, field, value) {
      if (typeof (field) == 'string') {
        field = lableIdx(field);
        if (field == null)
          return;
      }
      if (prv.data[row] == null)
        prv.data[row] = [];
      prv.data[row][field] = value;
    }

    this.rows = function () { return prv.data.length; }

    var that = this;
    {
      jaks.GetCSV (data, function (array) {
        prv.data = array;
        if (callback)
          callback (that)
      })
    }
  };

}).apply (jaks);

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  this.Wiki = function (container, opt)
  {
    var prv = jaks.extends({
      dir:'/papers',
      ext:'.md',
      home:'home',
      err:'err',
    }, opt);

    var getUrlOfWiki = function ()
    {
      var anchor = document.URL
      k = anchor.lastIndexOf('#')
      anchor = (k >=0) ? anchor.substring(k+1) : prv.home;

      var k = anchor.indexOf(':')
      var page = (k >=0)  ? anchor.substring (k+1) : anchor;
      var namespace = anchor.substring (0, k)

      var url = prv.dir + '/' + namespace + '/' + page + prv.ext
      return url;
    }

    this.reset = function (url)
    {
      if (url == null)
        url = getUrlOfWiki();

      jaks.GET (url, function (data) {

        var pager = document.getElementById(container);
        pager.innerHTML = jaks.Markdown (data);

        /* jaks.select (container + ' .wiki-intern').onclick (function () {
          that.reset();
        }); */
      });
    }

    var that = this;
    {
      this.reset ();
    }
  }

}).apply (jaks);
/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  /**
   * Create an instance of the Chart class. A chart is a generic graphical
   * representation of a data table. Charts need plotters to actualy represent
   * data.
   * @constructor
   * @param {string} id - Id that represent the container of the graph.
   * @param {string|array} data - Table of data to feed the graph or csv file.
   * @param {object} options - Options for the creation of this graph.
   */
  this.Chart = function (id, data, options) {

    jaks.EventDispatcher.apply(this); // Inherit form EventDispatcher

    var prv = jaks.extends({
      width:600,
      height:300,
      ctx: null,
      plot:'ClusteredLine',
      titleLayout:'',
      legendLayout:'east',
      padding: {
        right:10,
        left:10,
        top:10,
        bottom:10
      },
      grid: {
        areaOpacity:0.2,
        axisColor:'black',
        axisWidth:0.5,
        gridColor:'black',
        gridWidth:0.3,
        fontSize:20,
        fontFamily:'Arial',
        showAxis:'south',
        vwMin:0,
        vwMax:0,
        vwGap:0,
        vwSize:0,
        pad:0,
        width:3,
        mark_width:3,
        colors:['#a61010', '#1010a6', '#10a610', '#a610a6', '#a6a610', '#10a6a6'],
        gridSize:40,
        drawGrid:true,
      },
      graph:{
        x:0,
        y:0,
        w:0,
        h:0
      },
      select:{
        grp: 0,
        ser: 0,
        abs: 0
      }
    }, options);


    var drawMarkee = function (ctx, rect, grid, abscissa, group)
    {
      ctx.lineWidth = 2;

      for (var idx = 0; idx < grid.data[0].length; ++idx) {
        for (var x = 0; x < grid.data.length; ++x) {
          v = grid.data[x][idx];
          if (v == null || isNaN(v))
            continue;
          var px = rect.x + (abscissa.data[x][0] - abscissa.vwMin) * abscissa.scale;
          var py = rect.h + rect.y - (v - grid.vwMin) * grid.scale;
          ctx.fillStyle = grid.colors[idx % grid.colors.length];
          ctx.beginPath ();
          ctx.arc (px, py, grid.mark_width,0,2*Math.PI);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.beginPath ();
          ctx.arc (px, py, grid.mark_width*0.6,0,2*Math.PI);
          ctx.fill();
        }
      }
    }

    var drawAxisGeneric = function(ctx, grid, coords, ox, oy)
    {
      var pos;
      ctx.font= parseInt(grid.fontSize) + 'px ' + grid.fontFamily;
      ctx.strokeStyle = grid.gridColor;
      ctx.fillStyle = grid.axisColor;
      ctx.lineWidth = grid.gridWidth;

      for (var v = grid.axStart, k = 1;
          v <= grid.vwMax;
          v += grid.vwGap, ++k) {

        var tx = v.toFixed(grid.log);
        var w = ctx.measureText (tx).width;
        pos = coords (v, w)

        if (grid.drawGrid == true) {
          ctx.beginPath();
          ctx.moveTo(ox ? ox : pos.x, oy ? oy : pos.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke ();
        }

        ctx.fillText(tx, pos.sx, pos.sy);
      }

      ctx.strokeStyle = grid.axisColor;
      ctx.lineWidth = grid.axisWidth;

      ctx.beginPath();
      pos = coords (grid.vwMin)
      ctx.moveTo(pos.x, pos.y);
      pos = coords (grid.vwMax)
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke ();
    }

    var drawZone = function (ctx, grid, rect, coords, ori)
    {
      if (grid.background == 'full') {
        ctx.fillStyle = grid.bgColor;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      } else if (grid.background != null) {
        ctx.fillStyle = grid.bgColor;
        for (var v = grid.axStart, k = 1;
            v <= grid.vwMax;
            v += grid.vwGap, ++k) {
          if (grid.background == 'even' && (k & 1) == 0 ||
              grid.background == 'odd' && (k & 1) == 1) {

            pos = coords (v, 0)

            if (ori == 'south' || ori == 'north') {
              if (jaks.Plotter[grid.plot].stepGap == true) {
                x = pos.x - grid.scale / 2
              } else {
                x = pos.x;
              }
              if (v + grid.vwGap > grid.vwMax)
                w = (grid.vwMax - v) * grid.scale;
              else
                w = grid.vwGap * grid.scale;
              ctx.fillRect(x, rect.y, w, rect.h);

            } else {
              if (v + grid.vwGap > grid.vwMax)
                h = (grid.vwMax - v) * grid.scale;
              else
                h = grid.vwGap * grid.scale;
              ctx.fillRect(rect.x, pos.y, rect.w, -h);
            }
          }
        }
      }

      if (grid.zone == null)
        return;

      for (var i=0; i<grid.zone; i++) {
        var zone = grid.zone[i];

        if (zone.value == null) {
          pMin = coords (zone.min, 0)
          pMax = coords (zone.max, 0)
          ctx.fillStyle = zone.bgColor;

          if (ori == 'south' || ori == 'north')
            ctx.fillRect(pMin.x, rect.y, pMax.x - pMin.x, rect.h);
          else
            ctx.fillRect(rect.x, pMin.y, rect.w, pMax.y - pMin.y);
        } else {
          pVal = coords (zone.value, 0)
          ctx.strokeStyle = zone.bgColor;
          ctx.lineWidth = zone.width;

          if (ori == 'south' || ori == 'north') {
            ctx.moveTo(pVal.x, rect.y);
            ctx.lineTo(pVal.x, rect.y + rect.h);
          } else {
            ctx.moveTo(rect.x, pVal.y);
            ctx.lineTo(rect.x + rect.w, pVal.y);
          }
        }
      }
    }

    var drawAxis = function (ctx, rect, grid)
    {
      if (grid.showAxis == 'south') {

        var coords = function (value, width) {
          var pos = {
            x:rect.x + (value - grid.vwMin) * grid.scale,
            y:rect.h + rect.y,
            sx:0,
            sy:rect.h + rect.y + grid.fontSize + 5,
          };
          pos.sx = pos.x - width / 2;
          return pos;
        };

        drawAxisGeneric (ctx, grid, coords, null, rect.y);

      } else if (grid.showAxis == 'north') {

        var coords = function (value, width) {
          var pos = {
            x:rect.x + (value - grid.vwMin) * grid.scale,
            y:rect.y,
            sx:0,
            sy:rect.y - 5,
          };
          pos.sx = pos.x - width / 2;
          return pos;
        };

        drawAxisGeneric (ctx, grid, coords, null, rect.y + rect.h);

      } else if (grid.showAxis == 'west') {

        var coords = function (value, width) {
          var pos = {
            x:rect.x,
            y:rect.h + rect.y - (value - grid.vwMin) * grid.scale,
            sx:rect.x - width - 5,
            sy:0,
          };
          pos.sy = pos.y + 5;
          return pos;
        };

        drawAxisGeneric (ctx, grid, coords, rect.x + rect.w, null);

      } else if (grid.showAxis == 'east') {

        var coords = function (value, width) {
          var pos = {
            x:rect.x + rect.w,
            y:rect.h + rect.y - (value - grid.vwMin) * grid.scale,
            sx:rect.x + rect.w + 5,
            sy:0,
          };
          pos.sy = pos.y + 5;
          return pos;
        };

        drawAxisGeneric (ctx, grid, coords, rect.x, null);

      }

      if (coords != null)
        drawZone (ctx, grid, rect, coords, grid.showAxis);
    }

    var updateGrid = function (grid, name, size)
    {
      max = -99999999999999;
      min = 99999999999999;

      if (jaks.Plotter[grid.plot] == null) {
        err = {
          msg: "Unknown plotter " + grid.plot
        }
        console.error (err.msg)
        throw err;
      }

      if (jaks.Plotter[grid.plot].summedValue || grid.modif == 'percentage') {

        for (var i = 0; i < grid.data.length; ++i) {
          var sum = 0;
          for (var j = 0; j < grid.data[0].length; ++j) {
            value = grid.data[i][j];
            if (value == null || isNaN(value))
              continue;
            sum += value;
          }
          if (sum > max)
            max = sum;
          if (sum < min)
            min = sum;

          if (grid.modif == 'percentage') {
            for (var j = 0; j < grid.data[0].length; ++j) {
              value = grid.data[i][j];
              value *= 100 / sum;
              grid.data[i][j] = value;
            }
          }
        }

        if (grid.modif == 'percentage') {
          max = 100;
          min = 0;
        }

      } else {

        for (var i = 0; i < grid.data.length; ++i) {
          for (var j = 0; j < grid.data[0].length; ++j) {
            value = grid.data[i][j];
            if (value == null || isNaN(value))
              continue;
            if (value > max)
              max = value;
            if (value < min)
              min = value;
          }
        }
      }

      grid.vwMin = (grid.min != null ? grid.min : min);
      grid.vwMax = (grid.max != null ? grid.max : max);
      var gap = (grid.min == null ? grid.pad : 0) + (grid.max == null ? grid.pad : 0) + 1
      grid.scale = size / (grid.vwMax - grid.vwMin) / gap;

      // TODO realy bad design here !
      if (grid == prv.x) {
        if (jaks.Plotter[prv.y1.plot].stepGap == true) {
          grid.vwMax += 1;
          grid.scale = size / (grid.vwMax - grid.vwMin) / gap;
           grid.vwMin -= 0.5;
           grid.vwMax -= 0.5;
        }
      }

      if (grid.min == null)
        grid.vwMin -= (grid.vwMax - grid.vwMin) * grid.pad;
      if (grid.max == null)
        grid.vwMax += (grid.vwMax - grid.vwMin) * grid.pad;


      grid.log = Math.log (grid.vwMin) / Math.log (10)
      // console.log (log, isNaN(log))
      if (isFinite(grid.log)) {
        grid.axStart = parseFloat (grid.vwMin.toFixed(grid.log))

      } else {
        grid.log = 0
        grid.axStart = parseFloat (grid.vwMin.toFixed(grid.log))
        // grid.axStart = grid.vwMin
      }
      /*
      console.log (grid.vwMin/grid.vwMax, Math.log(grid.vwMin/grid.vwMax)/Math.log(10))
      grid.log = (Math.log(grid.vwMin/grid.vwMax)/Math.log(10) + 1)
      grid.

*/
      grid.vwGap = Math.round (grid.gridSize / grid.scale);
      if (grid.vwGap == 0) grid.vwGap = 1;
      // grid.axStart = grid.vwMin; // Align

    }

    this.resize = function (width, height)
    {
      prv.width = width;
      prv.height = height;
      prv.ctx.canvas.width = width;
      prv.ctx.canvas.height = height;
    }

    this.refreshlayout = function ()
    {
      width = prv.ctx.canvas.width;
      height = prv.ctx.canvas.height;

      prv.graph = {
        x: 0,
        y: 0,
        w: width - 0,
        h: height - 0,
      };

      // AXIS X
      if (prv.x.showAxis != 'none')
        prv.graph.h -= 30;

      // AXIS Y
      if (prv.severalAxis) {
        this.forEachGroup (function (grid) {
          if (grid.showAxis != 'none') {
            prv.graph.x += 60;
            prv.graph.w -= 60;
          }
        })
      } else if (prv.y1.showAxis != 'none') {
        prv.graph.x += 60;
        prv.graph.w -= 60;
      }

      switch (prv.titleLayout) {
        case 'north':
          prv.graph.y += prv.grid.fontSize * 2.8;
          prv.graph.h -= prv.grid.fontSize * 2.8;
          prv.titleInfo = {
            x:prv.graph.x,
            w:prv.graph.w,
            y:prv.grid.fontSize * 1.8
          }
          break;

        case 'south':
          prv.graph.h -= prv.grid.fontSize * 2.8;
          prv.titleInfo = {
            x:prv.graph.x,
            w:prv.graph.w,
            y:height - prv.grid.fontSize * 1.8
          }
          break;
      }

      var series = 0
      this.forEachGroup (function (grid) {
        series += grid.head.length;
      })

      switch (prv.legendLayout) {
        case 'north':
          prv.legend = {
            x:prv.graph.x,
            w:prv.graph.w,
            y:prv.graph.y,
            h:40 /* Compute */,
            s:series
          }
          prv.graph.y += prv.legend.h
          prv.graph.h -= prv.legend.h
          prv.legend.o = true;
          break;

        case 'south':
          prv.legend = {
            x:prv.graph.x,
            w:prv.graph.w,
            y:prv.graph.h-40,
            h:40 /* Compute */,
            s:series
          }
          prv.graph.h -= prv.legend.h
          prv.legend.o = true;
          break;

        case 'west':
          prv.legend = {
            x:prv.graph.x,
            w:100,
            y:10,
            h:height-20,
            s:series
          }
          prv.graph.x += prv.legend.w + 20
          prv.graph.w -= prv.legend.w + 20
          prv.legend.o = false;
          break;

        case 'east':
          lg = parseInt ((height - 20) / 25)
          lgc = Math.ceil(series/lg);
          prv.legend = {
            x:prv.graph.x + prv.graph.w - 110 * lgc,
            w:110 * lgc,
            y:10,
            h:height-20,
            s:series,
            sc:lg
          }
          prv.graph.w -= prv.legend.w + 10
          prv.legend.o = false;
          break;
      }

      if (prv.graph.x < prv.padding.left) {
        prv.graph.w -= prv.padding.left - prv.graph.x
        prv.graph.x += prv.padding.left - prv.graph.x
      }
      if (prv.graph.y < prv.padding.top) {
        prv.graph.h -= prv.padding.top - prv.graph.y
        prv.graph.y += prv.padding.top - prv.graph.y
      }
      if (width - prv.graph.x - prv.graph.w < prv.padding.right) {
        prv.graph.w-= prv.padding.right - (width - prv.graph.x - prv.graph.w)
      }/*
      if (width - prv.graph.w < prv.padding.right) {
        prv.graph.w -= prv.padding.right - width + prv.graph.w
      }*/
      if (height - prv.graph.y - prv.graph.h < prv.padding.bottom) {
        prv.graph.h -= prv.padding.bottom - (height - prv.graph.y - prv.graph.h)
      }
    };

    var updateGroup = function (grid, data)
    {
      grid.head = []
      grid.data = []
      if (grid.idx) {
        for (var l=0; l<grid.idx.length; ++l) {
          grid.head[l] = getHeader (data, grid.idx[l]);
        }

        for (var i=1; i<data.length; ++i) {
          grid.data[i-1] = [];
          for (var l=0; l<grid.idx.length; ++l) {
            j = grid.idx[l];
            grid.data[i-1][l] = parseFloat(data[i][j]);
          }
        }

      } else {
        for (var j=1; j<data[0].length; ++j) {
          grid.head[j-1] = getHeader (data, j);
        }

        for (var i=1; i<data.length; ++i) {
          grid.data[i-1] = [];
          for (var j=1; j<data[0].length; ++j) {
            grid.data[i-1][j-1] = parseFloat(data[i][j]);
          }
        }
      }
    }

    this.forEachGroup = function (callback)
    {
      var i = 1;
      while (true) {
        var grid = prv['y'+i]
        if (grid == undefined)
          break;
        callback (grid, 'y'+i);
        ++i;
        if (i > 9) // TODO Fix the limit where to look
          break;
      }
    }

    var getHeader = function (data, idx)
    {
      var head = {
        name: data[0][idx]
      }

      var value = data[1][idx];

      if (!isNaN(new Date(value).getTime ())) {
        head.type = 'date'
        head.parse = function (v) { return new Date(v).getTime(); }

      } else if (!isNaN(parseFloat(value))) {
        head.type = 'float'
        head.parse = parseFloat
      }

      return head;
    }

    this.update = function (data)
    {
      prv.x = jaks.extends (prv.x, prv.grid);
      prv.x = jaks.extends (prv.x, options.grid.x);
      prv.x.plot = prv.plot;

      var i = 1;
      while (true) {
        if (options.grid['y'+i] == undefined)
          break;
        prv['y'+i] = {}
        prv['y'+i] = jaks.extends ({}, prv.grid);
        prv['y'+i].plot = prv.plot;
        prv['y'+i].showAxis = 'west'
        prv['y'+i].pad = 0.05;
        prv['y'+i] = jaks.extends (prv['y'+i], options.grid['y'+i]);
        ++i;
        if (i > 9) // TODO Fix the limit where to look
          break;
      }

      /* Data - X */
      prv.x.head = getHeader (data, 0);

      prv.x.data = [];
      for (var i=1; i<data.length; ++i) {
        prv.x.data[i-1] = []
        prv.x.data[i-1][0] = prv.x.head.parse(data[i][0]);
      }

      /* Data - Y */
      this.forEachGroup (function (grid) {
        updateGroup (grid, data)
      })

      that.refreshlayout ();

      /* Update - Y */
      updateGrid (prv.x, 'x', prv.graph.w);
      this.forEachGroup (function (grid, grp) {
        updateGrid (grid, grp, prv.graph.h)
      })

      // console.log ('DATA', prv.x.data, prv.x.head, prv.y1.data, prv.y1.head, prv.x.vwMin, prv.x.vwMax)
    }

    var drawTitle = function  (ctx, prv)
    {
      if (prv.titleInfo != null) {
        ctx.font= parseInt(prv.grid.fontSize * 1.8) + 'px ' + prv.grid.fontFamily;
        ctx.fillText (prv.title, prv.titleInfo.x, prv.titleInfo.y);
      }
    }

    var drawLegend = function (ctx, prv)
    {
      if (prv.legend == null)
        return

      x = prv.legend.x
      y = prv.legend.y + prv.grid.fontSize

      /* TODO Style */
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = prv.grid.color;
      ctx.strokeStyle = prv.grid.color;
      ctx.font= parseInt(prv.grid.fontSize) + 'px ' + prv.grid.fontFamily;
      ctx.fillText ('Legend:', x, y);

      that.forEachGroup (function (grid) {

        ctx.font= parseInt(grid.fontSize) + 'px ' + grid.fontFamily;

        for (var i=0; i < grid.head.length; ++i) {

          if (prv.legend.o) {
            x += 110;
            if (x > prv.legend.x + prv.legend.w) {
              y += 25
              x = prv.legend.x
            }
          } else {
            y+=25;
            if (y > prv.legend.y + prv.legend.h) {
              x += 110;
              y = prv.legend.y + prv.grid.fontSize + 25
            }
          }

          ctx.fillStyle = grid.colors[i % grid.colors.length];
          ctx.strokeStyle = grid.colors[i % grid.colors.length];
          if (grid.selectedSerie == i)
            ctx.fillRect (
              x + prv.grid.fontSize * 0.1,
              y - prv.grid.fontSize * 0.8,
              prv.grid.fontSize * 0.8,
              prv.grid.fontSize * 0.8);
          else
            ctx.fillRect (
              x + prv.grid.fontSize * 0.2,
              y - prv.grid.fontSize * 0.7,
              prv.grid.fontSize * 0.6,
              prv.grid.fontSize * 0.6);

          if (grid.head[i].name.length <= 10) {
            w = ctx.measureText(grid.head[i].name).width
            ctx.fillText (grid.head[i].name, x + 20, y);
          }
          else {
            w = ctx.measureText(grid.head[i].name.substring(0, 8) + '...').width
            ctx.fillText (grid.head[i].name.substring(0, 8) + '...', x + 20, y);
          }

          if (grid.selectedSerie == i) {
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 2.0;
            ctx.beginPath()
            ctx.moveTo (x + 20, y + 2)
            ctx.lineTo (x + 20 + w, y + 2)
            ctx.stroke();
          }
        }
      });
    }

    var selectGrid = function (mouse) {

      x = mouse.x - prv.graph.x
      y = mouse.y - prv.graph.y

      vx = x / prv.x.scale + prv.x.vwMin;
      vy = (prv.graph.h - y) / prv.y1.scale + prv.y1.vwMin

      var idx = -1, dist = 99999999999;
      for (var i = 0; i < prv.x.data.length; i++) {
        d = Math.abs(vx - prv.x.data[i][0]);
        if (d < dist) {
          idx = i;
          dist = d
        }

      }

      if (false) {
        var jdx = -1, dist = 99999999999;
        for (var j=0; j< prv.y1.data[idx].length; ++j) {
          d = Math.abs(vy - prv.y1.data[idx][j]);
          if (d < dist) {
            jdx = j;
            dist = d
          }
        }
      } else {
        var jdx = -1, dist = 99999999999;
        var sum = 0;
        for (var j=0; j< prv.y1.data[idx].length; ++j) {
          sum += prv.y1.data[idx][j]
          if (jdx < 0 && sum > vy) {
            jdx = j;
          }
        }
      }

      return { grp: 1, ser:jdx, abs:idx }
    }

    var selectLegend = function (mouse) {

      sgrid = null;
      x = parseInt ((mouse.x - prv.legend.x) / 110)
      y = parseInt ((mouse.y - prv.legend.y) / 25) - 1;

      if (x < 0 || y < 0)
        return { };

      var v = (prv.legend.o)
        ? y * prv.legend.sc + x
        : x * prv.legend.sc + y;
      var grp = 1, ser = 0;
      that.forEachGroup (function (grid) {
        if (v < 0)
          return;
        if (v > grid.head.length-1) {
          v -= grid.head.length;
          grp++;
        } else {
          sgrid = grid;
          ser = v;
          v = -1;
        }
      })

      if (sgrid != null)
        return { grp:grp, ser:ser }
      return { };
    }

    this.mouseMotion = function (mouse)
    {
      var origin = prv.select,
        actual = {
          grp: 0,
          ser: 0,
          abs: 0,
        };

      var o = mouse.x > prv.graph.x && mouse.x < prv.graph.x + prv.graph.w &&
        mouse.y > prv.graph.y && mouse.y < prv.graph.y + prv.graph.h;

      if (prv.legend) {
        var l = mouse.x > prv.legend.x && mouse.x < prv.legend.x + prv.legend.w &&
          mouse.y > prv.legend.y && mouse.y < prv.legend.y + prv.legend.h;
      }

      if (o) {
        actual = jaks.extends(actual, selectGrid (mouse))

      } else if (l) {
        actual = jaks.extends(actual, selectLegend (mouse))

      } else {
      }

      if (origin.grp != actual.grp || origin.ser != actual.ser || origin.abs != actual.abs)
      {
        prv.select = actual;
        if (origin.grp != 0)
          prv['y' + origin.grp].selectedSerie = undefined
        if (actual.grp != 0)
          prv['y' + actual.grp].selectedSerie = actual.ser

        this.paint ()
      }
    }

    this.paint = function ()
    {
      prv.ctx.clearRect (0, 0, prv.$cvs.width, prv.$cvs.height)
      prv.ctx.save ()
      prv.ctx.beginPath ()
      prv.ctx.rect (0, 0, prv.width, prv.height)
      prv.ctx.clip ()

      drawAxis (prv.ctx, prv.graph, prv.x);
      drawAxis (prv.ctx, prv.graph, prv.y1);

      drawLegend (prv.ctx, prv);
      drawTitle (prv.ctx, prv);

      prv.ctx.beginPath ()
      prv.ctx.rect (prv.graph.x, prv.graph.y, prv.graph.w, prv.graph.h)
      prv.ctx.clip ()

      this.forEachGroup (function (grid) {
        jaks.Plotter[grid.plot].draw (prv.ctx, prv.graph, grid, prv.x);
        if (grid.mark != null) {
          drawMarkee (prv.ctx, prv.graph, grid, prv.x);
        }
      });

      this.trigger ('paint');
      prv.ctx.restore ()
    }

    var getMousePosition = function(evt) {
      var canvas = prv.ctx.canvas
      var rect = canvas.getBoundingClientRect();
      var x = evt.clientX - rect.left;
      var y = evt.clientY - rect.top;
      return {
        x: x,
        y: y
      };
    };


    var that = this;
    {
      prv.$cvs = document.getElementById(id);
      prv.ctx = prv.$cvs.getContext('2d');

      prv.grid.color = jaks.getStyle (prv.$cvs, 'color');
      prv.grid.fontFamily = jaks.getStyle (prv.$cvs, 'font-family');
      prv.grid.fontSize = parseInt (jaks.getStyle (prv.$cvs, 'font-size').replace('px', ''));

      jaks.GetCSV(data, function (data) {
        that.resize (prv.width, prv.height);
        that.update (data);
        that.paint ();

        window.addEventListener('mousemove', function(e) {
          var mouse = getMousePosition(e)
          that.mouseMotion (mouse);
        }, false);

      }, options.cvs);



    }
  };

}).apply (jaks);
/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
String.prototype.ltrim=function(){return this.replace(/^\s+/,'');};
String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};
String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');};
String.prototype.startwith=function(str){ return this.substring(0, str.length) == str;};
String.prototype.endswith=function(str){ return this.substring(this.length - str.length, this.length) == str;};


/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  this.GetCSV = function (data, callback, options) {

      if (Object.prototype.toString.call( data ) === '[object Array]') {
        for(var i=0; i<data.length; ++i) {
          if (Object.prototype.toString.call( data[i] ) !== '[object Array]') {
            return; // Bad format
          }
        }
        if (callback)
          callback(data)
      } else if (typeof (data) === 'string') {
        if (data.indexOf(',') >=0) {
          data = jaks.ParserCSV(data, options)
            if (!data)
              return; // Bad format
          if (callback)
            callback(data)
        } else {
          jaks.GET (data, function (content) {
            data = jaks.ParserCSV(content, options)
            if (!data)
              return; // Bad format
            if (callback)
              callback(data)
          })
        }
      }
      return; // Unknown format
  }

  this.ParserCSV = function (csv, options) {
    var opt = jaks.extends({
      separator: ',',
      quoteSym: '"',
      newValue:null,
      newLine:null
    }, options);

    var doc = [];
    var arr = [];
    var value = '';
    var inquote = false;
    for (var i = 0; i < csv.length; ++i) {
      if (csv[i] == opt.quoteSym && !inquote) {
        inquote = true;
      } else if (csv[i] == opt.quoteSym) {
        if (i+1 < csv.length && csv[i+1] == opt.quoteSym) {
          value += opt.quoteSym;
          ++i;
        } else {
          inquote = false;
        }
      } else if (csv[i] == opt.separator && !inquote) {
        if (opt.newValue) opt.newValue(value);
        arr.push(value);
        value = '';
      } else if (csv[i] == '\n' || csv[i] == '\r') {
        if (csv[i] == '\r' && i+1 < csv.length && csv[i+1] == '\n') {
          ++i
        }
        if (!inquote) {
          arr.push(value);
          doc.push(arr);
          if (opt.newValue) opt.newValue(value);
          if (opt.newLine) opt.newLine(arr);
          arr = [];
          value = '';
        } else {
          value += csv[i];
        }
      } else {
        if (value == '' && !inquote && csv[i] <= ' ')
          continue;
        value += csv[i];
      }
    }

    if (arr.length > 0 || value != '') {
      arr.push(value);
      doc.push(arr);
      if (opt.newValue) opt.newValue(value);
      if (opt.newLine) opt.newLine(arr);
    }
    return doc;
  };

}).apply (jaks);
/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  this.Expression = function (expr, rules)
  {

    this.parse = function (expr, rules)
    {
      var lexer = new jaks.Lexer (expr, rules);

      while (!lexer.endOfFile()) {

        token = lexer.getToken();
        this.pushToken(token);
      }

    }

    var stackToken = [];
    var subExpr = [];
    var curSub = null;
    this.pushToken = function (token)
    {
      console.log ('PUSH ', token)
      if (top != null)
        return;

      if (curSub != null) {
        ret = subExpr[curSub].pushToken (token);

        if (ret == 'next') {
          console.log ('  get next !')
          subExpr[curSub].compile ();
          curSub = subExpr.length;
          subExpr[curSub] = new jaks.Expression ();
          stackToken[stackToken.length-1].idx.push(curSub);

        } else if (ret == 'done') {
          console.log ('  get done !')
          subExpr[curSub].compile ();
          curSub = null;
        }

        return;
      }

      if (token.literal == '(') {

        if (stackToken[stackToken.length-1].type == 'identifier') {

          console.log ('  Function call')
          curSub = subExpr.length;
          subExpr[curSub] = new jaks.Expression ();
          stackToken.push({ type:'operator', literal:'CALL', idx:[curSub], child:1 });

        } else {

          console.log ('  Undefiend open parenthesis')
        }

        return;
      }

      if (token.literal == ',')   return 'next';
      if (token.literal == ')')   return 'done';

      stackToken.push(token);
    }

    var top = null;
    this.compile = function()
    {
      var stackVar = [],
        stackOper = [];
      while (stackToken.length > 0) {
        var token = stackToken.pop();
        if (token.type == 'operator')
          stackOper.push(token);
        else
          stackVar.push(token);
      }


      while (stackOper.length > 0) {
        var token = stackOper.pop();

        if (top == null) {
          var oLeft = stackVar.pop();
          var oRight = stackVar.pop();
          top = {
            operator: token,
            0:oLeft,
            1:oRight
          };
        } else {
          if (true /* top.operator.prio < token.prio */) {
            var instr = {
              operator: token,
              0:top,
              1:stackVar.pop()
            }
            top = instr;
          } else {
            var oLeft = top;
            while (oLeft.right.operator.prio > token.prio) {
              oLeft = oLeft.right;
            }
            var instr = {
              operator: token,
              0:oLeft.right,
              1:stackVar.pop()
            }
            oLeft.right = instr;
          }

        }


      }

      console.log (top);
    }

    var no = 1;
    this.translate = function (instr) {
      // GET ALL OTHER

 /*
      switch (instr.literal) {
        case '+':     console.log ('ADD', '$'+(no++), instr.0.value, instr.1.value);  break;
        case '+=':    console.log ('ADD', '$'+no, instr.0.value, instr.1.value);
                      console.log ('MOV', instr.0.value, '$'+(no++));                 break;
        case '-':     console.log ('SUB', '$'+(no++), instr.0.value, instr.1.value);  break;
        case '-=':    console.log ('SUB', '$'+no, instr.0.value, instr.1.value);
                      console.log ('MOV', instr.0.value, '$'+(no++));                 break;
        case '*':     console.log ('MUL', '$'+(no++), instr.0.value, instr.1.value);  break;
        case '*=':    console.log ('MUL', '$'+no, instr.0.value, instr.1.value);
                      console.log ('MOV', instr.0.value, '$'+(no++));                 break;
        case 'CALL':  console.log ('PUSH', instr.2.value);
                      console.log ('PUSH', instr.1.value);
                      console.log ('CALL', instr.0.value, );                          break;
      }
      */
    }


    var that = this;
    {
      if (expr == null)
        return;

      console.log ('LOOK FOR', expr);

      this.parse (expr, rules);
      this.compile();

    }
  }

}).apply (jaks);

/*
var nullDataProvider = {
  get: function (row, field) { return null },
  set: function (row, field, value) {},
  rows: function () { return 1; }
}

var DBProvider = {
  get: function (row, field) {
    var query = "SELECT {field} FORM {table} WHERE numrow={row}";
  },
  set: function (row, field, value) {
    var query = "UPDATE {table} SET {field}={value} WHERE numrow={row}";
  },
  rows: function () {
    var query = "SELECT max(numrow) FORM {table}";
  }
}

var MongoProvider = {
  get: function (row, field) {
    db.{table}.find ( { numrow:row } )[field];
  },
  set: function (row, field, value) {
    var obj = db.{table}.find ( { numrow:row } )
    obj[field] = value;
    obj.save ();
  },
  rows: function () {
    db.{table}.count ();
  }
}

*/

jaks.jaksLangRules = {
    id:[
      {
        first:['a-z', 'A-Z', '_', '$' ],
        get:function (lexer, str) {
          for (;;) {
            c = lexer.peekChar ();
            if (c == null) return str;
            if ((c >= '0' && c <= '9') ||
                (c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z') ||
                c == '_' || c == '$') {
              str = str + lexer.getChar();
            } else return str;
          }
        },
        name:'identifier'
      },
      {
        first:['0-9'],
        get:function (lexer, str) {

          var floatNum = function (lexer, str) {
            str = decimalNum (lexer, str);

            for (;;) {
              c = lexer.peekChar ();
              switch (c) {
                case '.':
                  if (str.indexOf('.' > 0))
                    return str;
                  str = str + '.' + decimalNum(lexer, '');
                  break;
                case 'e':
                case 'E':
                  c = lexer.getChar();
                  c = lexer.peekChar ();
                  str = str + 'E';
                  if (c == '+' || c == '-') {
                    str = str + lexer.getChar();
                  }
                  return str + decimalNum(lexer, '');
                  break;
              }
            }
          }

          var decimalNum = function (lexer, str) {
            for (;;) {
              c = lexer.peekChar ();
              if (c == null) return str;


              if ((c >= '0' && c <= '9')) {
                str = str + lexer.getChar();
              } else return str;
            }
          }

          var hexNum = function (lexer, str) {
            for (;;) {
              c = lexer.peekChar ();
              if (c == null) return str;
              if ((c >= '0' && c <= '9') ||
                  (c >= 'a' && c <= 'f') ||
                  (c >= 'A' && c <= 'F')) {
                str = str + lexer.getChar();
              } else return str;
            }
          }

          var octalNum = function (lexer, str) {
            for (;;) {
              c = lexer.peekChar ();
              if (c == null) return str;
              if ((c >= '0' && c <= '7')) {
                str = str + lexer.getChar();
              } else return str;
            }
          }

          if (str.length == 0) {
            if (c >= '0' && c <= '9')
                str += lexer.getChar();
            else
              return str;
          }

          if (str.startwith('0')) {

            if (str.length == 1) {
              c = lexer.peekChar();
              if (c >= '0' && c <= '7' ||
                c == 'x' || c == '.')
                str += lexer.getChar();
              else
                return str;
            }

            if (str.startwith('0x'))
              return hexNum(lexer, str);
            else if (str.startwith('0.'))
              return floatNum();
            else
              return octalNum(lexer, str);

          } else {

            str = decimalNum(lexer, str);

            if (lexer.peekChar == '.')
              return floatNum(lexer, str);
            return str;
          }
        },
        name:'number'
      },
    ],

    operators:[
      '+=', '-=', '*=', '-=', '%=',
      '+', '-', '*', '-', '%',
      '++', '--',
      '(', ')', '{', '}', '[', ']',
      '&=', '|=', '^=', '<<=', '>>=',
      '&', '|', '^', '<<', '>>',
      '<', '>', '<=', '>=', '==', '!=',
      '=', '&&', '||', '~', '!',
      ',', '.', '->', '=>', ':', '::' ],
    delimiters:[
      { open:'\'', close:'\'', escape:'\\' },
      { open:'"', close:'"', escape:'\\' },
      { open:'/*', close:'*/' }
    ],
    blank:[' ', '\t', '\r', '\n'],
  };


/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  this.Lexer = function (data, rules, options)
  {
    var prv = {
      tabs:4,
      str:data,
      cur:0,
      row:0,
      col:0,
      peek:null,
    };

    if (rules == null)
      rules = jaks.LangRules;

    var checkIdent = function (lexer, rules) {
      for (var i =0; i < rules.id.length; ++i) {
        var id = rules.id[i];
        for (var j=0; j < id.first.length; ++j) {
          if (id.first[j].length == 1 && id.first[j] == lexer.peekChar())
            return { type:id.name, literal:id.get (lexer, '') };
          else if (id.first[j].length == 3 &&
              id.first[j][0] <= lexer.peekChar() &&
              id.first[j][2] >= lexer.peekChar() ) {
            return { type:id.name, literal:id.get (lexer, '') };
          }
        }
      }
    }

    var checkOper = function (lexer, rules) {
      var str = '';
      pId = null;
      for (;;) {
        str += lexer.peekChar ();
        m = 0;
        id = null;
        for (var i =0; i < rules.operators.length; ++i) {
          if (rules.operators[i].startwith(str)) {
            m++;
            if (str.length == rules.operators[i].length)
              id = i;
          }
        }

        if (m == 0 && pId != null)
          return { type:'operator', literal:rules.operators[pId] };
        if (m == 0)
          return null;
        if (m == 1 && id != null) {
          lexer.getChar();
          return { type:'operator', literal:str };
        }
        lexer.getChar();
        pId = id;
      }
    }

    var checkDelimiter = function (lexer, rules) {

    }


    this.endOfFile = function () {
      return (prv.cur >= prv.str.length)
    }

    this.peekChar = function () {
      if (prv.peek == null)
        prv.peek = this.getChar();
      return prv.peek
    }


    this.getChar = function () {
      if (prv.peek != null) {
        var ret = prv.peek;
        prv.peek = null;
        return ret;
      }

      if (prv.cur >= prv.str.length)
        return null;

      c = prv.str[prv.cur++];
      if (c == '\r') {
        if (prv.str[prv.cur] == '\n')
          prv.cur++;
        c = '\n';
      }
      if (c == '\n') {
        prv.row++;
        prv.col = 0
      } else if (c == '\t') {
        prv.col += prv.tabs - prv.col % prv.tabs;
      } else {
        prv.col ++;
      }

      return c;
    }

    this.getToken = function () {

      c = this.peekChar();

      while (rules.blank.contains (c)) {
        this.getChar ();
        c = this.peekChar();
      }

      str = checkIdent (this, rules);
      if (str) return str;

      str = checkOper (this, rules);
      if (str) return str;

      str = checkDelimiter (this, rules);
      if (str) return str;

      return null;
    }

    var that = this
    {

    }
  }

}).apply(jaks);

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function() {

  this.EventDispatcher = function() {

    // Private field
    var prv = {
      callbacks: {}
    };

    // Public methods
    this.on = function (name, func) {
      if (prv.callbacks[name] == null)
        prv.callbacks[name] = [];
      prv.callbacks[name].push (func);
    }

    this.clearEvent = function (name) {
      prv.callbacks[name] = undefined;
    }

    this.clearAll = function (name) {
      prv.callbacks = {};
    }

    this.trigger = function (name, event) {
      if (event == null)
        event = {};
      event.name = name;
      event.sender = that;
      var arr = prv.callbacks[name]
      if (arr != null) {
        for (var i=0; i < arr.length; ++i) {
          if (arr[i] != null)
            arr[i](event);
        }
      }
    }

    // Constructor
    var that = this;
    {
    }
  };

}).apply (jaks);
/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function() {

  this.extends = function(destination, source) {
    if (source) {
      if (!destination)
        destination = {}
      for (var property in source) {
        if (typeof(destination[property]) == 'object' && destination[property].length == undefined)
          destination[property] = jaks.extends(destination[property], source[property]);
        else
        destination[property] = source[property];
      }
    }
    return destination;
  };

  this.shakerSort = function(list, comp_func, desc) {
    var b = 0;
    var t = list.length - 1;
    var swap = true;

    while(swap) {
      swap = false;
      for(var i = b; i < t; ++i) {
        var c = comp_func(list[i], list[i+1]);
        if (!desc) c = -c;
        if ( c > 0 ) {
          var q = list[i]; list[i] = list[i+1]; list[i+1] = q;
          swap = true;
        }
      }
      t--;

      if (!swap) break;

      for(var i = t; i > b; --i) {
        var c = comp_func(list[i], list[i-1]);
        if (!desc) c = -c;
        if ( c < 0 ) {
          var q = list[i]; list[i] = list[i-1]; list[i-1] = q;
          swap = true;
        }
      }
      b++;

    }
  }

}).apply (jaks);
/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/

Array.prototype.contains = function (item) {
  for (var i=0; i<this.length; ++i)
    if (this[i] == item)
      return true;
  return false;
};

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  if (jaks.Plotter == null) jaks.Plotter = {};
  jaks.Plotter['ClusteredColumn'] = {

    stepGap:true,
    draw: function (ctx, rect, grid, abscissa)
    {
      for (var idx = 0; idx < grid.data[0].length; ++idx) {
        jaks.Plotter['ClusteredColumn'].drawSerie(ctx, rect, grid, abscissa, idx);
      }
    },

    drawSerie: function (ctx, rect, grid, abscissa, idx)
    {
      ctx.lineWidth = grid.width;
      var series = grid.data[0].length;
      var gapf = abscissa.scale * 0.4
      var gaps = abscissa.scale * 0.1;
      var gapn = (abscissa.scale * 0.8 - gaps * (series-1)) / series;
      var gapm = gapn + gaps

      // var gapn = abscissa.scale * 0.8 / data[0][group].length - grid.width; //20; //

      ctx.strokeStyle = ctx.fillStyle = grid.colors[idx % grid.colors.length];
      for (var x = 0; x < grid.data.length; ++x) {
        v = grid.data[x][idx];
        if (v == null || isNaN(v))
          continue;
        px = rect.x + (abscissa.data[x][0] - abscissa.vwMin) * abscissa.scale;
        py = rect.h + rect.y - (v - grid.vwMin) * grid.scale;
        ctx.beginPath();
        // ctx.rect (px + gapm * idx + gapf, py, gapn, rect.h + rect.y - py);
        ctx.rect (px + gapm * idx - gapf, py, gapn, rect.h + rect.y - py);
        //ctx.rect (px + gapf, py, 10, rect.h + rect.y - py);
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha=1.0;
        ctx.stroke();
      }
    },

  }


}).apply (jaks);

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  var HttpRequest = function (method, url, callback) {

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open(method, url, true);
    xmlHttp.onreadystatechange = function() {
      // console.log ('GET', xmlHttp.readyState, xmlHttp.status)
      if (xmlHttp.readyState == 4) {
        if (callback)
          callback (xmlHttp.responseText);
      }
    };
    xmlHttp.send();
  }

  this.GET = function (url, callback) {
    return HttpRequest('GET', url, callback);
  }

  this.POST = function (url, callback) {
    return HttpRequest('POST', url, callback);
  }

}).apply (jaks);

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  if (jaks.Plotter == null) jaks.Plotter = {};
  jaks.Plotter['StackedColumn'] = {

    stepGap:true,
    summedValue:true,
    draw: function (ctx, rect, grid, abscissa)
    {
      var summedValue = []
      for (var idx = 0; idx < grid.data[0].length; ++idx) {
        jaks.Plotter['StackedColumn'].drawSerie(ctx, rect, grid, abscissa, idx, summedValue);
      }
    },

    drawSerie: function (ctx, rect, grid, abscissa, idx, summedValue)
    {
      ctx.lineWidth = grid.width;

      var gapf = abscissa.scale * 0.4
      var gaps = abscissa.scale * 0.1;
      var gapn = abscissa.scale * 0.8;

      ctx.strokeStyle = ctx.fillStyle = grid.colors[idx % grid.colors.length];
      for (var x = 0; x < grid.data.length; ++x) {
        vn = summedValue[x];
        if (vn == null)               vn = 0;
        vm = vn + grid.data[x][idx];
        if (v == null || isNaN(v))    continue;
        summedValue [x] = vm;

        px = rect.x + (abscissa.data[x][0] - abscissa.vwMin) * abscissa.scale;
        pny = rect.h + rect.y - (vn - grid.vwMin) * grid.scale;
        pmy = rect.h + rect.y - (vm - grid.vwMin) * grid.scale;
        ctx.beginPath();
        ctx.rect (px + gaps - gapf, pmy, gapn, pny - pmy);
        ctx.globalAlpha = (grid.selectedSerie == null
          ? 0.6
          : (grid.selectedSerie == idx
            ? 0.6
            : 0.2));
        ctx.fill();
        ctx.globalAlpha = (grid.selectedSerie == null
          ? 1.0
          : (grid.selectedSerie == idx
            ? 1.0
            : 0.4));
        ctx.stroke();
      }
    },

  }

}).apply (jaks);

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  if (jaks.Plotter == null) jaks.Plotter = {};

  jaks.Plotter['ClusteredLine'] = {

    draw: function (ctx, rect, grid, abscissa)
    {
      for (var idx = 0; idx < grid.data[0].length; ++idx) {
        jaks.Plotter['ClusteredLine'].drawSerie(ctx, rect, grid, abscissa, idx);
      }
    },

    drawSerie: function (ctx, rect, grid, abscissa, idx)
    {
      var prev = NaN;
      ctx.lineWidth = grid.width;
      ctx.strokeStyle = grid.colors[idx % grid.colors.length];

      ctx.beginPath ();
      v = grid.data[0][idx];
      px = rect.x + (abscissa.data[0][0] - abscissa.vwMin) * abscissa.scale;
      py = rect.h + rect.y - (v - grid.vwMin) * grid.scale;
      for (var x = 0; x < grid.data.length; ++x) {
        v = grid.data[x][idx];
        if (v == null)
          continue;
        if (isNaN(v)) {
          ctx.stroke();
          prev = NaN;
        }
        px = rect.x + (abscissa.data[x][0] - abscissa.vwMin) * abscissa.scale;
        py = rect.h + rect.y - (v - grid.vwMin) * grid.scale;
        if (isNaN(prev))
         ctx.moveTo (px, py);
        else
          ctx.lineTo (px, py);
        prev = v;
      }
      ctx.stroke();

    },
  }


}).apply (jaks);

/*
  Jaks - Framework Javascript
    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

     This file is part of Jaks.

    Jaks is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Jaks is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/

/* Form Open source code:
 *
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda and Kris Kowal
 */
(function(){

  this.dateFormat = function (date, mask, utc) {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
      timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
      timezoneClip = /[^-+\dA-Z]/g,
      pad = function (val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) val = "0" + val;
        return val;
      };

    // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
    if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }

    // Passing date through Date applies Date.parse, if necessary
    date = date ? new Date(date) : new Date;
    if (isNaN(date)) throw SyntaxError("invalid date");

    mask = String(dF.masks[mask] || mask || dF.masks["default"]);

    // Allow setting the utc argument via the mask
    if (mask.slice(0, 4) == "UTC:") {
      mask = mask.slice(4);
      utc = true;
    }

    var _ = utc ? "getUTC" : "get",
      d = date[_ + "Date"](),
      D = date[_ + "Day"](),
      m = date[_ + "Month"](),
      y = date[_ + "FullYear"](),
      H = date[_ + "Hours"](),
      M = date[_ + "Minutes"](),
      s = date[_ + "Seconds"](),
      L = date[_ + "Milliseconds"](),
      o = utc ? 0 : date.getTimezoneOffset(),
      flags = {
        d:    d,
        dd:   pad(d),
        ddd:  dF.i18n.dayNames[D],
        dddd: dF.i18n.dayNames[D + 7],
        m:    m + 1,
        mm:   pad(m + 1),
        mmm:  dF.i18n.monthNames[m],
        mmmm: dF.i18n.monthNames[m + 12],
        yy:   String(y).slice(2),
        yyyy: y,
        h:    H % 12 || 12,
        hh:   pad(H % 12 || 12),
        H:    H,
        HH:   pad(H),
        M:    M,
        MM:   pad(M),
        s:    s,
        ss:   pad(s),
        l:    pad(L, 3),
        L:    pad(L > 99 ? Math.round(L / 10) : L),
        t:    H < 12 ? "a"  : "p",
        tt:   H < 12 ? "am" : "pm",
        T:    H < 12 ? "A"  : "P",
        TT:   H < 12 ? "AM" : "PM",
        Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
        o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
        S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
      };

    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };

  var dF = {
    masks:{
      "default":      "ddd mmm dd yyyy HH:MM:ss",
      shortDate:      "m/d/yy",
      mediumDate:     "mmm d, yyyy",
      longDate:       "mmmm d, yyyy",
      fullDate:       "dddd, mmmm d, yyyy",
      shortTime:      "h:MM TT",
      mediumTime:     "h:MM:ss TT",
      longTime:       "h:MM:ss TT Z",
      isoDate:        "yyyy-mm-dd",
      isoTime:        "HH:MM:ss",
      isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
      isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    },
    i18n:{
      dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
      ],
      monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
      ]
    }
  };

}).apply(jaks);

Date.prototype.format = function (mask, utc) {
  return jaks.dateFormat(this, mask, utc);
};

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  this.Markdown = function (data)
  {
    var result = '';
    var parseFile = function (brut)
    {
      var idx = 0
      var str = ''
      var lg = brut.length
      while (idx < lg) {

        c = brut[idx++]
        if (c == '\r') {
          c = '\n'
          if (brut[idx] == '\n') {
            idx++;
          }
        }

        if (c == '\n') {
          parseLine (str);
          str = '';
        }
        else
          str += c;
      }

      parseLine (str);
      commit();
    }

    var lastBlock = { text:'', type:'' }
    var parseLine = function (line)
    {
      // TODO > and * and #. can be nested !

      if (line.trim() == '') {
        if (lastBlock.type == 'pre')
          addRegularText(line);
        else
        commit ('');
      } else if (line.startwith ('======')) {
        lastBlock.type = 'h1';
      } else if (line.startwith ('------')) {
        lastBlock.type = 'h2';
      } else if (line.startwith ('#')) {
        var s = 0;
        while (line.startwith('#')) {
          line = line.substring(1);
          s++;
        }
        commit ('h' + s);
        addRegularText(line);
      } else if (line.startwith ('    ')) {
        commit ('pre');
        addRegularText(line.substring(4));
      } else {
        commit ('p');
        addRegularText(line);
      }
    }

    var addRegularText = function (line)
    {
      if (line.endswith ('  '))
        lastBlock.text += line.trim() + '\n';
      else
        lastBlock.text += line.trim() + '\n';
    }

    var addPreformatedText = function (line)
    {
      lastBlock.text += line + '\n';
    }

    var formatSpec = function (block, idx)
    {
      var pidx = idx;

      k = block.indexOf(']', idx)
      if (k < 0) return { lg:0 };
      var lnk = {
        inside: block.substring (idx, k),
        url: '',
        title: '',
      }
      lnk.url = lnk.inside;
      idx += lnk.inside.length + 1;

      if (block[idx] == '[') {
        k = block.indexOf(']', idx)
        if (k >= 0) {
          idx++;
          id = block.substring (idx, k);
          lnk.url = id;
          idx += id.length + 1;
        }
      } else if (block[idx] == '(') {
        k = block.indexOf(')', idx)
        if (k >= 0) {
          idx++;
          id = block.substring (idx, k);
          k = id.indexOf(' ')
          if (k > 0) {
            lnk.url = id.substring(0, k);
            lnk.title = id.substring(k + 1).trim();
            if (lnk.title.startwith('"'))
              lnk.title = lnk.title.substring(1, lnk.title.length-1)
          } else {
            lnk.url = id;
          }
          idx += id.length + 1;
        }
      }

      lnk.lg = idx - pidx;
      return lnk;
    }

    var formatPreHTML = function (block)
    {
      var idx = 0;
      var lg = block.length
      var str = '';
      var itl = false,
        bld = false,
        pre = false;
      while (idx < lg)
      {
        c = block [idx++];
        if (pre == true && c != '`')
          str += c;
        else {
          switch (c) {
            case '<':  str += '&lt;';  break;
            case '>':  str += '&gt;';  break;
            case '"':  str += '&quot;';  break;
            case '&':  str += '&amp;';  break;

            default:
              str += c;
          }
        }
      }
      return str;
    }

    var formatHTML = function (block)
    {
      var idx = 0;
      var lg = block.length
      var str = '';
      var itl = false,
        bld = false,
        pre = false;
      while (idx < lg)
      {
        c = block [idx++];
        if (pre == true && c != '`')
          str += c;
        else {
          switch (c) {
            case '<':  str += '&lt;';  break;
            case '>':  str += '&gt;';  break;
            case '"':  str += '&quot;';  break;
            case '&':  str += '&amp;';  break;

            case '`':
              if (block [idx] == '`') {
                str += '`'
                idx ++;
              } else  {
                str += (pre ? '</code>' : '<code>');
                pre = !pre;
              }
            break;

            case '*':
              if (block [idx] == '*') {
                str += (bld ? '</b>' : '<b>');
                bld = !bld;
                idx ++;
              } else  {
                str += (itl ? '</i>' : '<i>');
                itl = !itl;
              }
            break;

            case '_':
              if (block [idx] == '_') {
                str += (bld ? '</b>' : '<b>');
                bld = !bld;
                idx ++;
              } else  {
                str += (itl ? '</i>' : '<i>');
                itl = !itl;
              }
            break;

            case '[':
              lnk = formatSpec(block, idx);
              idx += lnk.lg

              var cl = 'wiki-link';
              if (lnk.url.startwith('http:/') || lnk.url.startwith('https:/'))
                cl += ' wiki-extern'
              else {
                cl += ' wiki-intern'
                 if (!lnk.url.startwith('#')) {
                    lnk.url = '#' + lnk.url;
                 }
              }

              if (lnk.title != '')
                str += '<a class="' + cl + '" href="' + lnk.url + '" title="' + lnk.title + '">' + lnk.inside + '</a>';
              else
                str += '<a class="' + cl + '" href="' + lnk.url + '">' + lnk.inside + '</a>';
              break;

            case '!':
              if (block [idx] == '[') {
                lnk = formatSpec(block, ++idx);
                idx += lnk.lg
                if (lnk.title != '')
                  str += '<img src="' + lnk.url + '" title="' + lnk.title + '" alt="' + lnk.inside + '" />';
                else
                  str += '<img src="' + lnk.url + '" alt="' + lnk.inside + '" />';
              } else
                str += c;
              break;

            default:
              str += c;
          }
        }
      }
      return str;
    }


    var commit = function (type)
    {
      if (typeof (type) == 'string' && lastBlock.type == type)
        return;

      if (lastBlock.type != '') {

        if (lastBlock.type != 'pre') {
          lastBlock.text = formatHTML (lastBlock.text);
          result += '<' + lastBlock.type + '>' + lastBlock.text.trim() + '</' + lastBlock.type + '>\n\n';
        } else {
          lastBlock.text = formatPreHTML (lastBlock.text);
          result += '<' + lastBlock.type + '><code>' + lastBlock.text.trim() + '</code></' + lastBlock.type + '>\n\n';
        }
      }

      lastBlock = { text:'', type:type }
    }

    {
      if (typeof(data) == 'string')
        parseFile (data);
      else
        console.warn ('Markdown, data is undefined', data)
      return result;
    }
  };

}).apply (jaks);

/*

    Jaks - Graphic Framework for JavaScript

    Copyright (C) 2013  Fabien Bavent<fabien.bavent@gmail.com>

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Jaks.  If not, see <http://www.gnu.org/licenses/>.
*/
(function () {

  if (jaks.Plotter == null) jaks.Plotter = {};
  jaks.Plotter['ClusteredArea'] = {

    draw: function (ctx, rect, grid, abscissa)
    {
      for (var idx = 0; idx < grid.data[0].length; ++idx) {
        jaks.Plotter['ClusteredArea'].drawSerie(ctx, rect, grid, abscissa, idx);
      }
    },

    drawSerie: function (ctx, rect, grid, abscissa, idx)
    {
      ctx.lineWidth = grid.width;

      ctx.globalAlpha= grid.areaOpacity;
      var prev = NaN;
      ctx.strokeStyle = grid.colors[idx % grid.colors.length];
      ctx.fillStyle = grid.colors[idx % grid.colors.length];
      ctx.beginPath ();
      var v = grid.data[0][idx];
      var px = rect.x + (abscissa.data[0][0] - abscissa.vwMin) * abscissa.scale;
      var py = rect.h + rect.y - (v - grid.vwMin) * grid.scale;
      for (var x = 0; x < grid.data.length; ++x) {
        v = grid.data[x][idx];
        if (v == null)
          continue;
        if (isNaN(v)) {
          ctx.lineTo (px, rect.h + rect.y);
          ctx.closePath();
          ctx.fill();
          prev = NaN;
        }
        px = rect.x + (abscissa.data[x][0] - abscissa.vwMin) * abscissa.scale;
        py = rect.h + rect.y - (v - grid.vwMin) * grid.scale;
        if (isNaN(prev)) {
         ctx.moveTo (px, rect.h + rect.y);
         ctx.lineTo (px, py);

        } else
          ctx.lineTo (px, py);
        prev = v;
      }
      ctx.lineTo (px, rect.h + rect.y);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha=1.0;
      jaks.Plotter['ClusteredLine'].drawSerie(ctx, rect, grid, abscissa, idx);
    },

  }

}).apply (jaks);


$(function() {
  var data = [
    ['', 'A', 'B', 'C'],
    [1, 9.8, 5.7, 6.3],
    [2, 5.7, 5.4, 2.8],
    [3, 1.8, 9.7, 6.7],
  ];

  for (var i = 1; i < 18; i++) {
    data[i] = []
    data[i][0] = i;
  }

  func = [
    null,
    function (i) { return ((2*i-1) * (i/2+1)); },
    function (i) { return i*i; },
    function (i) { return (0.3*i*i - 2*i +90); },
  ]
  for (var j = 1; j < 4; j++) {
    p = Math.random();
    for (var i = 1; i < 18; i++) {
      data[i][j] = func[j](i) + 30 * Math.random() * p;
      p *= Math.random()+0.5;
    }
  }

  new jaks.Chart ('graph1', data, {
    grid: {
      x:{
        background:'odd',
        bgColor:'rgba(126,35,255,0.2)'
      },
      y1:{
        mark:'white-circle',
        mark_width:3
      }
    }
  });
})
