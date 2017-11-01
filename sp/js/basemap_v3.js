String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function MGDSMapClient() {
    var conf = configuration;
    this.maplat = conf.map_lat;
    this.maplon = conf.map_lon;
    this.defaultZoom = conf.defaultZoom;
    this.maxzoom = conf.max_zoom;
    this.minzoom = conf.min_zoom;
    this.mapdiv = conf.default_container;
    this.layers = new Array();
    this.mtoverlays = new Array();
    
    this.qurl = conf.query_url;
    this.markers = new Array();
    this.markerCluster = new Array();
    this.baseLayersbool = true;
    this.grat = null;
    this.mapdivobject = null;
    this.linkhref = conf.logo_href;
    this.linkclass = conf.logo_class;
    this.imgsrc = conf.logo_url;
    this.imgtitle = conf.logo_title;
    this.imgwidth = conf.logo_width;
    this.epsg = conf.epsg;
    this.minZoom = conf.minZoom;
    this.maxZoom = conf.maxZoom;
    //this.layer_info = layer_info;
}

MGDSMapClient.prototype.mapInit = function(hide,options,off) {


    var self = this;
    this.mapdivobject = $('#'+this.mapdiv);
    
    this.vectorSrc = null;
    this.drawingTool = null;

    proj4.defs('EPSG:3031', '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs');
    var projection = ol.proj.get(this.epsg);
    projection.setWorldExtent([-180.0000, -90.0000, 180.0000, -60.0000]);
    projection.setExtent([-8200000, -8200000, 8200000, 8200000]);
    //projection.setExtent([-12400000,-12400000,12400000,12400000]);


    this.map = new ol.Map({
	view: new ol.View({
            center: [this.maplat, this.maplon],
	    zoom: this.defaultZoom,
	    minZoom: this.minZoom,
	    maxZoom: this.maxZoom,
	    projection: projection, 
	    extent: projection.getExtent()
	}),
	target: document.getElementById(this.mapdiv)
    });
    
    this.graticule = new ol.Graticule();

    this.map.addControl(new LonLatElevControl({mapclient: this}));
    this.addLayers();

    this.map.on('singleclick', this.selectPoint, this)

    $('.drawing-button').on('click', function(e) {
	self.setDrawMode($(this).attr('data-mode'));
	if (self.drawingTool) {
	    self.map.removeInteraction(self.drawingTool);
	}
        self.addDrawingTool();
    });
    this.addDrawingTool();

    this.createLayerSwitcher();

    this.infowin = new ol.Overlay({element: document.createElement('div') });
    this.map.addOverlay(this.infowin);
    
};

MGDSMapClient.prototype.createLegend = function(lyr) {
    var html = lyr.get('legend_html');
    if (!html) return;

    this.legendDiv = document.createElement("div");
    this.legendDiv.className = "legendcontrol";
    this.legendDiv.innerHTML = '<div class="tabwrapper"><div class="tabboxlegend tabbox">Legend</div></div>';
    this.limgDiv = document.createElement("div");
    this.limgDiv.className = "maplegend";
    this.limgDiv.innerHTML = html;
    this.legendDiv.appendChild(this.limgDiv);
    $(document).off('click','.tabboxlegend');
    $(document).on('click','.tabboxlegend',function(){
	if ($(".legendcontrol .maplegend").is(":visible")) {
	    $(".legendcontrol .maplegend").hide();
	} else {
	    $(".legendcontrol .maplegend").show();
	}
    });
    $('#tcontent').append(this.legendDiv);
}

MGDSMapClient.prototype.checkLayerCount = function() {
    var count = 0;
    for (var name in this.layerMap) {
	var l = this.layerMap[name];
	if (l.get('switchable') && l.getVisible()) {
	    count += 1;
	}
    }

    if (count > 0) {
	$('#data_layer_descriptions').show();
    } else {
	$('#data_layer_descriptions').hide();
    }
}

MGDSMapClient.prototype.turnOnLayer = function(title) {
    var lyr = this.layerMap[title];
    var all_descs = $('#data_layer_descriptions');

    var desc = $('<div data-layer="{0}"><b>{0}</b> - {1}</div>'.format(title, lyr.get('description')));
    all_descs.append(desc);
    if (lyr.get('legend_html')) {
	this.createLegend(lyr);
    }
    lyr.setVisible(true);
    this.checkLayerCount();
}

MGDSMapClient.prototype.turnOffLayer = function(title) {
    var lyr = this.layerMap[title];
    var all_descs = $('#data_layer_descriptions');
    var desc = all_descs.children('div[data-layer="{0}"]'.format(title));
    desc.remove();
    if (lyr.get('legend_html')) {
	$('.legendcontrol').remove();
    }
    lyr.setVisible(false);
    this.checkLayerCount();
};

MGDSMapClient.prototype.createLayerSwitcher = function() {
    var self = this;

    this.mapControl = new MapControl();

    var gratBtn = $(this.mapControl.getImgButton('graticule'));
    $(gratBtn).on('turn-on', function() {
	self.graticule.setMap(self.map);
    });
    $(gratBtn).on('turn-off', function() {
	self.graticule.setMap(null);
    });
    
    $(this.mapControl.getImgButton('mask')).on('turn-on', function() {
	self.turnOnLayer('GMRT High-Res');
    });

    $(this.mapControl.getImgButton('mask')).on('turn-off', function() {
	if (!self.mapControl.layerButtonIsOn('GMRT High-Res')) {
	    self.turnOffLayer('GMRT High-Res');
	}
    });
    
    $(this.mapControl.getImgButton('south_polar')).addClass('on').removeClass('toggle');

    $('#tcontent').append(this.mapControl.getElement());

};

MGDSMapClient.prototype.toggleLayer = function(title) {
    var lyr = this.layerMap[title];
    lyr.setVisible(!lyr.getVisible());
};

MGDSMapClient.prototype.getDrawMode = function() {
    return $('.drawing-button.draw-active').attr('data-mode');
}

MGDSMapClient.prototype.setDrawMode = function(str) {
    $('#drawing-buttons .drawing-button').removeClass('draw-active');
    $('#drawing-buttons .drawing-button[data-mode="{0}"]'.format(str)).addClass('draw-active');
}




// This function handles clicks on features on the map,
// creating a popup with info about the feature.
MGDSMapClient.prototype.selectPoint = function(evt) {
    if (this.getDrawMode() !== 'None') { return; }

    var self = this;
    var clearInfowin = function() {
	self.iconSrc.clear();
	self.infowin.setPosition(undefined);
    }
    clearInfowin();

    var tabs = $('<div id="tabs">');
    var tab_links = $('<ul />');
    var tab_content = $('<div  style="max-height:300px; overflow:auto"/>');
    var infowin_wrapper = $('<div id="infowin-wrapper"/>');
    var close_button = $('<div id="close-button">&times</div>');
    infowin_wrapper.append(close_button);

    var coord = evt.coordinate;
    var lonlat = this.toLonLat(coord);

    var pixel = evt.pixel;

    var ur_coord = this.map.getCoordinateFromPixel([pixel[0]+5, pixel[1]-5]);
    var ll_coord = this.map.getCoordinateFromPixel([pixel[0]-5, pixel[1]+5]);
    
    var tab_num = 0;
    var requests = [];
    this.map.getLayers().forEach(function(layer, _, _) {
	var clickevent = layer.get('clickevent');
	if (layer.getVisible() && layer.get('type') !== 'base' && clickevent) {
	    var data = clickevent.qurl_params;
	    var qurl = clickevent.qurl;
	    data['SRS'] = 'EPSG:3031';

	    if (data['SERVICE'] == 'WMS') {
		data['BBOX'] = ll_coord.concat(ur_coord).join(',');
	    } else {
		data['lat'] = lonlat[1];
		data['lon'] = lonlat[0];
		data['zoom'] = this.map.getZoom();
	    }
	    var str = decodeURIComponent($.param(data));

	    var ajax_defaults = {
        	type: "GET",
        	url: qurl,
        	data: str,
        	async: false,
        	success: function(msg) {
		    if (clickevent.msg_transform) { msg = clickevent.msg_transform(msg); } 
        	    if (msg) {
			tab_num += 1;
			var new_link = $('<li><a href="#tab{0}">{1}</a></li>'.format(tab_num, layer.get('title')));
			var new_tab= $('<div id="tab{0}" >{1}</div>'.format(tab_num,msg));
			tab_links.append(new_link);
			tab_content.append(new_tab);
		    }

        	}
            }
	    requests.push($.ajax($.extend({},ajax_defaults,clickevent.ajax_opts)));
	}
    }, this);

    $.when.apply(undefined, requests).done(function() {
	tabs.append(tab_links);
	tabs.append(tab_content);
	infowin_wrapper.append(tabs);
	tabs.tabs();
	
	
	if (tab_num > 0) {
	    self.infowin.setElement(infowin_wrapper[0]); 
	    self.infowin.setPosition(coord);
	    
	    var iconFeature = new ol.Feature({
		geometry: new ol.geom.Point(coord)
	    });
	    var iconStyle = new ol.style.Style({
		image: new ol.style.Icon ({
		    src: '/databrowser/sp/img/map-marker-icon.png',
		    anchor: [0.5, 0.8]
		})
	    });
	    iconFeature.setStyle(iconStyle);
	    self.iconSrc.addFeature(iconFeature);
	    
	}
	close_button.on('click', function(e) {
	    clearInfowin();
	});
	
	tab_content.find('.turndown').on("click",function() {
	    var aself = this;
	    var tbox = $(this).parent();
	    var tcontent = tbox.children('.tcontent');
	    var img;
	    if (tcontent.is(':visible')) {
		img = '/images/arrow_show.gif';
	    } else {
		img = '/images/arrow_hide.gif';
	    }
	    $(this).find('img').attr('src',img);

	    if (!tbox.hasClass('has-content')) {
		$.ajax({
		    type: "GET",
		    url: 'http://ecp.iedadata.org/ged/'+$(this).parent().attr('data-uuid'),
		    success: function(msg){
		        tcontent.html(msg);
			tbox.addClass('has-content');
		    	tcontent.toggle();
		    }
		});
	    } else {
		tcontent.toggle();
	    }

	});
    });
}

MGDSMapClient.prototype.addDrawingTool = function() {
    var value = this.getDrawMode(); 
    if (value !== 'None') {
	var maxPoints, geometryFunction;
	if (value === 'Box') {
	    value = 'LineString';
	    maxPoints = 2;
	    geometryFunction = function(coordinates, geometry) {
		if (!geometry) {
		    geometry = new ol.geom.Polygon(null);
		}
		var start = coordinates[0];
		var end = coordinates[1];
		geometry.setCoordinates([
		    [start, [start[0], end[1]], end, [end[0], start[1]], start]
		]);
		return geometry;
	    };
	    
	}
	this.drawingTool = new ol.interaction.Draw({
	    source: this.vectorSrc,
	    type: value,
	    geometryFunction: geometryFunction,
	    maxPoints: maxPoints
	});
	this.map.addInteraction(this.drawingTool);
	
	var self = this;
	this.drawingTool.on(ol.interaction.DrawEventType.DRAWSTART, function() {self.vectorSrc.clear()});
	this.vectorSrc.on('addfeature', function() {
	    //self.setDrawMode('None');
	    var features = self.vectorSrc.getFeatures();
	    if (features.length !== 1) {
		throw "Expected only one feature to be drawn.";
	    }
	    var coords = features[0].getGeometry().getCoordinates()[0];
	    var polygon_change = new CustomEvent('polygon-change', {'detail': coords});
	    document.dispatchEvent(polygon_change);

	});
    }
}

LonLatElevControl = function(options) {

    var mapclient = options.mapclient;
    var self = this;
    this.movementTimer = null;

    var element = document.createElement('div');
    var lon = document.createElement('div');
    var lat = document.createElement('div');
    var elev = document.createElement('div');
    element.appendChild(lon);
    element.appendChild(lat);
    element.appendChild(elev);

    element.className = 'latlonelev-control ol-control';

    mapclient.mapdivobject.mousemove(function(evt) {
        evt_xy = mapclient.map.getEventCoordinate(evt);
        var lonlat = mapclient.toLonLat(evt_xy);
        lon.innerHTML = 'lon: ' + lonlat[0].toFixed(6);
        lat.innerHTML = 'lat: ' + lonlat[1].toFixed(6);

        clearTimeout(self.movementTimer);
        self.movementTimer = setTimeout(function(){
            $.ajax({
                type: "GET",
                url: "http://www.marine-geo.org/services/pointserver.php",
                data: {
                    'latitude': lonlat[1].toFixed(6),
                    'longitude': lonlat[0].toFixed(6)
                },
                async: true,
                success: function(msg){
                    elev.innerHTML = 'elev: ' + msg+' m';
                }
            });
        }, 200);
    });

    ol.control.Control.call(this, {
	element: element,
	target: options.target
    });

};
ol.inherits(LonLatElevControl, ol.control.Control);


MGDSMapClient.prototype.toLonLat = function(pt) {
    return ol.proj.toLonLat(pt, this.epsg);
}

MGDSMapClient.prototype.addLayers = function() {
    this.map.addLayer(new ol.layer.Tile({
	type: 'base',
	title: 'GMRT',
	source: new ol.source.TileWMS({
	    params: {
		'LAYERS': 'South_Polar_Bathymetry'
	    },
	    url: //"http://www.marine-geo.org/services/wms_SP?",
	    "http://gmrt.marine-geo.org/cgi-bin/mapserv?map=/public/mgg/web/gmrt.marine-geo.org/htdocs/services/map/wms_sp.map",
	    serverType: "mapserver"
	}),
	switchable: false
    }));

    this.map.addLayer(new ol.layer.Tile({
	type: 'base',
	title: 'GMRT High-Res',
	source: new ol.source.TileWMS({
	    params: {
		'LAYERS': 'South_Polar_Bathymetry'
	    },
	    url: //"http://www.marine-geo.org/services/wms_SP_mask?",
	    "http://gmrt.marine-geo.org/cgi-bin/mapserv?map=/public/mgg/web/gmrt.marine-geo.org/htdocs/services/map/wms_sp_mask.map",

	    serverType: "mapserver"
	}),
	visible: false,
	switchable: true
    }));

    this.vectorSrc = new ol.source.Vector();
    this.map.addLayer(new ol.layer.Vector({
	title: "Drawing Layer",
	source: this.vectorSrc
    }));

    this.iconSrc = new ol.source.Vector();
    this.map.addLayer(new ol.layer.Vector({
	title: "Icon Layer",
	source: this.iconSrc
    }));
    
    this.layerMap = {};
    this.map.getLayers().forEach(function(lyr) {
	var title = lyr.get('title');
	this.layerMap[title] = lyr;
	/*for (var k in layer_info[title]) {
	    lyr.set(k, layer_info[title][k]);
	}*/
    },this);
}


MGDSMapClient.prototype.getContainingBBOX = function(poly) {
    var w =  8200000;
    var e = -8200000;
    var s =  8200000;
    var n = -8200000;
    for (var i = 0; i < poly.length; i++) {
	  w = Math.min(w,poly[i][0]);
	  e = Math.max(e,poly[i][0]);
	  s = Math.min(s,poly[i][1]);
	  n = Math.max(n,poly[i][1]);
    }
    return {w:w, e:e, s:s, n:n};
}
