import * as utils from 'base/utils';
import Component from 'base/component';


/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

var OPTIONS = {
  DOMAIN_MIN: 0,
  DOMAIN_MAX: 1,
  TEXT_PARAMS: { TOP: 18, LEFT: 10, MAX_WIDTH: 42, MAX_HEIGHT: 16 },
  BAR_WIDTH: 6,
  THUMB_RADIUS: 10,
  THUMB_STROKE_WIDTH: 4,
  INTRO_DURATION: 250
}

var profiles = {
    "small": {
      minRadius: 0.5,
      maxRadius: 30,
      minLabelTextSize: 7,
      maxLabelTextSize: 19,
      defaultLabelTextSize: 13
    },
    "medium": {
      minRadius: 1,
      maxRadius: 55,
      minLabelTextSize: 10,
      maxLabelTextSize: 22,
      defaultLabelTextSize: 16
    },
    "large": {
      minRadius: 1,
      maxRadius: 70,
      minLabelTextSize: 14,
      maxLabelTextSize: 26,
      defaultLabelTextSize: 20
    }
};


var SizeSlider = Component.extend({

  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init: function (config, context) {

    this.name = 'sizeslider';

    this.template = this.template || "sizeslider.html";

    this.propertyName = config.propertyname;

    this.model_expects = [{
      name: "size",
      type: "size"
    }];

    var _this = this;
    this.model_binds = {
      'change:size.domainMin': changeMinMaxHandler,
      'change:size.domainMax': changeMinMaxHandler,
      'ready': readyHandler
    };

    function changeMinMaxHandler(evt, path) {
      var size = [
          _this.model.size.domainMin,
          _this.model.size.domainMax
      ];
      //_this._updateArcs(size);
      _this._updateLabels(size);
      _this.sliderEl.call(_this.brush.extent(size));
      if(size[0] == size[1]){
        _this.sliderEl.selectAll(".resize")
          .style("display", "block");
      }
    }
    
    function readyHandler(evt) {
      _this.modelUse = _this.model.size.use; 
      if(_this.modelUse != 'constant') {
        _this.sizeScaleMinMax = _this.model.size.getScale().domain();
        _this.sliderEl.selectAll('.e').classed('vzb-hidden', false);
        _this.sliderEl.select('.extent').classed('vzb-hidden', false);
        _this.sliderEl.select('.background').classed('vzb-pointerevents-none', false);
        _this._setLabelsText();
        var size = [
            _this.model.size.domainMin,
            _this.model.size.domainMax
        ];
        _this.sliderEl.call(_this.brush.extent(size));
      } else {
        _this.sliderEl.selectAll('.e').classed('vzb-hidden', true);
        _this.sliderEl.select('.extent').classed('vzb-hidden', true);
        _this.sliderEl.select('.background').classed('vzb-pointerevents-none', true);
        var domainMin = _this.model.size.domainMin;
        if(!_this.model.size.which) {
          var p = _this.propertyActiveProfile;
          domainMin = (p.default - p.min) / (p.max - p.min);
          _this.model.size.which = '_default';
        }      
        _this.sliderEl.call(_this.brush.extent([domainMin, OPTIONS.DOMAIN_MAX]));
      }
      _this.sliderEl.call(_this.brush.event);      
    }

    this._setModel = utils.throttle(this._setModel, 50);
    //contructor is the same as any component
    this._super(config, context);
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available as a d3 object
   */
  readyOnce: function () {
    var values = [this.model.size.domainMin, this.model.size.domainMax],
      _this = this;
    this.element = d3.select(this.element);
    this.sliderSvg = this.element.select(".vzb-bs-svg");
    this.sliderWrap = this.sliderSvg.select(".vzb-bs-slider-wrap");
    this.sliderEl = this.sliderWrap.select(".vzb-bs-slider");

    var
      textMargin = {v: OPTIONS.TEXT_PARAMS.TOP, h: OPTIONS.TEXT_PARAMS.LEFT},
      textMaxWidth = OPTIONS.TEXT_PARAMS.MAX_WIDTH,
      textMaxHeight = OPTIONS.TEXT_PARAMS.MAX_HEIGHT,
      barWidth = OPTIONS.BAR_WIDTH,
      thumbRadius = OPTIONS.THUMB_RADIUS,
      thumbStrokeWidth = OPTIONS.THUMB_STROKE_WIDTH,
      padding = {
        top: thumbStrokeWidth,
        left: textMargin.h + textMaxWidth * 1.2,
        right: textMargin.h + textMaxWidth * 1.5,
        bottom: barWidth + textMaxHeight
      }

    this.padding = padding;
    
    
    this.propertyActiveProfile = this.getPropertyActiveProfile();

    this.xScale = d3.scale.linear()
      .domain([OPTIONS.DOMAIN_MIN, OPTIONS.DOMAIN_MAX])
      .range([this.propertyActiveProfile.min * 4, this.propertyActiveProfile.max * 4])
      .clamp(true)

    this.brush = d3.svg.brush()
      .x(this.xScale)
      .extent([OPTIONS.DOMAIN_MIN, OPTIONS.DOMAIN_MIN])
      .on("brush", function () {
        _this._setFromExtent(false, false); // non persistent change
      })
      .on("brushend", function () {
         _this.sliderEl.selectAll(".resize")
         .style("display", null);

        _this._setFromExtent(true); // force a persistent change
      });

    this.sliderEl
      .call(_this.brush);

    //For return to round thumbs
    //var thumbArc = d3.svg.arc()
    //  .outerRadius(thumbRadius)
    //  .startAngle(0)
    //  .endAngle(2 * Math.PI)

    this.sliderThumbs = this.sliderEl.selectAll(".resize").sort(d3.descending)
      .classed("vzb-bs-slider-thumb", true)

    this.sliderThumbs.append("g")
      .attr("class", "vzb-bs-slider-thumb-badge")
      .append("path")
      .attr('d', function(d,i) {
        if(i) return "M0 0 l" + (thumbRadius) + " " + (-thumbRadius * .6) + "v" + (thumbRadius * 1.2) + "Z";
        //i=0
        return "M0 0 l" + (-thumbRadius) + " " + (-thumbRadius * .6) + "v" + (thumbRadius * 1.2) + "Z";
      })


    this.sliderThumbs.append("path")
      .attr("class", "vzb-bs-slider-thumb-arc")
    this.sliderEl.selectAll("text").data([0,0]).enter()
      .append("text")
      .attr("class", function(d, i) {
        return "vzb-bs-slider-thumb-label " + (i ? 'e' : 'w');})
//      .attr("dy", "0.35em")
      .attr("text-anchor", function(d, i) {
        return i ? "start" : "end"})
//      .attr("dominant-baseline", function(d, i) {
//        return i ? "text-after-edge" : "text-before-edge"})
      .attr("dominant-baseline",'middle')

    this.sliderLabelsEl = this.sliderEl.selectAll("text.vzb-bs-slider-thumb-label");

    this.sliderEl.selectAll("rect")
      .attr("height", barWidth)
      .attr("rx", barWidth * 0.25)
      .attr("ry", barWidth * 0.25)
      .attr("transform", "translate(0," + (-barWidth * 0.5) + ")")
    this.sliderEl.select(".extent")
      .classed("vzb-bs-slider-extent", true)

    this.on("resize", function() {
      //console.log("EVENT: resize");
      _this.propertyActiveProfile = this.getPropertyActiveProfile();

      _this.xScale.range([_this.propertyActiveProfile.min * 4, _this.propertyActiveProfile.max * 4]);
      _this._updateSize();

      _this.sliderEl
        .call(_this.brush.extent(_this.brush.extent()))
        .call(_this.brush.event);

    });

    this._updateSize();
    // this.sliderEl
    //   .call(this.brush.extent(values))
    //   .call(this.brush.event);

    _this.sizeScaleMinMax = _this.model.size.getScale().domain();

    if(_this.sizeScaleMinMax) {
      _this._setLabelsText();
    }
  },
  
  ready: function() {
    var i = 0;
  },

  getPropertyActiveProfile: function() {
    var profile = profiles[this.getLayoutProfile()];
    return { min: profile['min' + this.propertyName], max: profile['max' + this.propertyName], default: profile['default' + this.propertyName]};
  },

  /*
   * RESIZE:
   * Executed whenever the container is resized
   */
  _updateSize: function() {
    this.sliderSvg
      .attr("height", this.propertyActiveProfile.max + this.padding.top + this.padding.bottom)
      .attr("width", this.propertyActiveProfile.max * 4 + this.padding.left + this.padding.right)
    this.sliderWrap
      .attr("transform", "translate(" + this.padding.left * .5 + "," + (this.propertyActiveProfile.max + this.padding.top) + ")")
  },

//   _updateArcs: function(s) {
//     var _this = this;
//     var valueArc = d3.svg.arc()
//       .outerRadius(function (d) { return _this.xScale(d) * 0.5 })
//       .innerRadius(function (d) { return _this.xScale(d) * 0.5 })
//       .startAngle(-Math.PI * 0.5)
//       .endAngle(Math.PI * 0.5);
// 
//     this.sliderThumbs.select('.vzb-bs-slider-thumb-arc').data(s)
//       .attr("d", valueArc)
//       .attr("transform", function (d) {return "translate(" + (-_this.xScale(d) * 0.25) + ",0)"; })
//   },
// 
  _updateLabels: function(s) {
    var _this = this;
    var arcLabelTransform = function(d, i) {
      var textMargin = { v: OPTIONS.TEXT_PARAMS.TOP, h: OPTIONS.TEXT_PARAMS.LEFT },
          dX = textMargin.h * (i ? 1 : -1.1) + _this.xScale(d),
          dY = 0;//i ? -textMargin.v : 0;
       return "translate(" + (dX) + "," + (dY) + ")";
    }
    this.sliderLabelsEl.data(s)
      .attr("transform", arcLabelTransform)
      .attr("font-size", function(d, i) {
        return _this.xScale(d) * 0.25;
      })
    if(_this.model.size.use === 'constant')
      this.sliderLabelsEl.data(s).text(function(d) {
        return ~~(_this.xScale(d) * 0.25);
      })    
  },

  _setLabelsText: function() {
      var _this = this;
      _this.sliderLabelsEl
        .data([_this.model.size.tickFormatter(_this.sizeScaleMinMax[0]),_this.model.size.tickFormatter(_this.sizeScaleMinMax[1])])
        .text(function (d) { return d; });
  },

  /**
   * Prepares setting of the current model with the values from extent.
   * @param {boolean} force force firing the change event
   * @param {boolean} persistent sets the persistency of the change event
   */
  _setFromExtent: function(force, persistent) {
    var s = this.brush.extent();
//    this._updateArcs(s);
    this._updateLabels(s);
    this._setModel(s, force, persistent);
  },

  /**
   * Sets the current value in model. avoid updating more than once in framerate
   * @param {number} value
   * @param {boolean} force force firing the change event
   * @param {boolean} persistent sets the persistency of the change event
   */
  _setModel: function (value, force, persistent) {
    var _this = this;
    _this.model.size.getModelObject('domainMin').set(value[0], force, persistent);
    _this.model.size.getModelObject('domainMax').set(value[1], force, persistent);
  }

});

export default SizeSlider;