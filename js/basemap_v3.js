function dd2MercMetersLng(p_lng) {
	return 6378137.0*(p_lng*Math.PI/180);
} 
function dd2MercMetersLat(p_lat) {
	p_lat = ((p_lat > 85)?85:((p_lat<-85)?-85:p_lat));
	return 6378137.0*Math.log(Math.tan(((p_lat*Math.PI/180)+(Math.PI/2.0))/2.0));
}
function MGDSMapClient() {
	var self = this;
	this.maplat = 0;
	this.maplon = -96;
	this.zoom = 2;
	this.mapdiv = "mapclient";
    this.layers = new Array();
    this.data_layers = {};
	this.mtoverlays = new Array();
	this.infowin = new google.maps.InfoWindow();
	google.maps.event.addListener(this.infowin, 'closeclick', function(event) {
		self.marker.setMap(null);
	});
	this.marker = new google.maps.Marker();
	this.qurl = 'http://www.marine-geo.org/inc/kml_v3/selectpoint.php?';
	this.markers = new Array();
	this.markerCluster = new Array();
	this.baseLayersbool = true;
	this.grat = null;
	this.mapdivobject = null;
    this.linkhref = "/index.php";
    this.linkclass = "mgdslogo";
    this.imgsrc = "http://www.marine-geo.org/images/mgdslogofull.png";
    this.imgtitle = "IEDA: Marine Geoscience Data System";
    this.imgwidth = "250px";
}
function getLatLngByOffset( mmap, offsetX, offsetY ){
    //var currentBounds = mmap.map.getBounds();
    //var topLeftLatLng = new google.maps.LatLng( currentBounds.getNorthEast().lat(),
    //                                            currentBounds.getSouthWest().lng());
    //var point = mmap.map.getProjection().fromLatLngToPoint( topLeftLatLng );
    //point.x += offsetX / ( 1<<mmap.map.getZoom() );
    //point.y += offsetY / ( 1<<mmap.map.getZoom() );
    //return mmap.map.getProjection().fromPointToLatLng( point );
    return mmap.oview.getProjection().fromContainerPixelToLatLng(new google.maps.Point(offsetX,offsetY));
}
function getLocationText(location) {
    return 'lon: ' + location.lng().toFixed(6) + '<br />lat: ' + location.lat().toFixed(6) + '<br />elev: <span id="elevdiv"></span>';
}

MGDSMapClient.prototype.mapInit = function(hide,options,off) {
	var self = this;
	var basemap_options = {
		zoom: this.zoom,
		center: new google.maps.LatLng(this.maplat, this.maplon),
		mapTypeId: google.maps.MapTypeId.SATELLITE,
		streetViewControl: false,
		panControl: false,
		mapTypeControl: false,
		maxZoom: 22,
		minZoom: 1,
		scaleControl: true,
		draggableCursor:'crosshair'
	};
	if (options) {
		for (var attrname in options) {
			basemap_options[attrname] = options[attrname];
		}
	}
	this.mapdivobject = $('#'+this.mapdiv);
	this.map = new google.maps.Map(document.getElementById(this.mapdiv),basemap_options);
	if (!off)
		this.controls = new controlOverlay(this,hide);
	this.posdiv = document.createElement('div');
	this.posdiv.id = 'latlondiv';
	this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(this.posdiv);
	this.oview = new google.maps.OverlayView();
	this.oview.draw = function() {};
	this.oview.onAdd = function(){};
	this.oview.onRemove = function(){};
	this.oview.setMap(this.map);
    this.movementTimer = null;
	this.mapdivobject.mousemove(function(evt){
        var posx = evt.pageX-self.mapdivobject.offset().left;
        var posy = evt.pageY-self.mapdivobject.offset().top;
        var latlng = getLatLngByOffset(self,posx,posy);
        clearTimeout(this.movementTimer);
        this.movementTimer = setTimeout(function(){
            $.ajax({
                type: "GET",
                url: "http://www.marine-geo.org/services/pointserver.php",
                data: {
                    'latitude':latlng.lat().toFixed(6),
                    'longitude':latlng.lng().toFixed(6),
                    'statsoff':'true'
                },
                async: true,
                success: function(msg){
                    $("#elevdiv").text(msg+' m');
                }
            });
        }, 200);
        $('#latlondiv').html(getLocationText(latlng));
    });

}

MGDSMapClient.prototype.baseMap = function() {
	var d = new Date();
	var self = this;
	var copyrightDiv = document.createElement("div");
	copyrightDiv.id = "map-copyright";
	copyrightDiv.style.fontSize = "11px";
	copyrightDiv.style.fontFamily = "Arial, sans-serif";
	copyrightDiv.style.margin = "0 2px 2px 0";
	copyrightDiv.style.whiteSpace = "nowrap";
	copyrightDiv.innerHTML = "Bathymetry &copy;"+d.getFullYear()+" <a href='http://gmrt.marine-geo.org'>GMRT</a>";
	this.map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(copyrightDiv);
	var tile = new TileData(this.map,'http://www.marine-geo.org/services/wms_2.0_merc?','topo');
	var gmrt_layer = {
		alt: " GMRT Basemap",
		getTileUrl: tile.GetTileUrl,
		isPng: false,
		maxZoom: 22,
		minZoom: 1,
		name: "Bathymetry",
		tileSize: new google.maps.Size(256, 256)
	};
    var tilemask = new TileData(this.map,'http://gmrt.marine-geo.org/cgi-bin/mapserv?map=/public/mgg/web/gmrt.marine-geo.org/htdocs/services/map/wms_merc_mask.map&','topo-mask');
	var mask_layer = {
		alt: " GMRT Basemap",
		getTileUrl: tilemask.GetTileUrl,
		isPng: false,
		maxZoom: 22,
		minZoom: 1,
		name: "GMRT Mask",
		tileSize: new google.maps.Size(256, 256)
	};
	var bathymetry = new google.maps.ImageMapType(gmrt_layer);
	var gmrtmask = new google.maps.ImageMapType(mask_layer);
	this.map.mapTypes.set('Bathymetry',bathymetry);
	this.map.mapTypes.set('GMRT Mask',gmrtmask);
	this.map.setMapTypeId('Bathymetry');
}

MGDSMapClient.prototype.overlayControl = function(a,b,c,d,e){}

MGDSMapClient.prototype.MGDSLogo = function(linkhref,linkclass,imgsrc,imgtitle,imgwidth,attachnode) {
    if (linkhref) this.linkhref = linkhref;
    if (linkclass) this.linkclass = linkclass;
    if (imgsrc) this.imgsrc = imgsrc;
    if (imgtitle) this.imgtitle = imgtitle;
    if (imgwidth) this.imgwidth = imgwidth;
    var mgdsDiv = document.createElement("div");
    mgdsDiv.setAttribute("id",'mgdsDiv')
    var linklogo = document.createElement("a");
    linklogo.setAttribute("href",this.linkhref);
    linklogo.setAttribute("style","border-bottom:none !important;padding: 3px;display: block;");
    linklogo.className = this.linkclass;
    var clearDiv = document.createElement("div");
    clearDiv.setAttribute("style","clear:both;");
    linklogo.appendChild(clearDiv.cloneNode(true));
    var img = document.createElement("img");
    img.setAttribute("title",this.imgtitle);
    img.setAttribute("alt",this.imgtitle);
    img.setAttribute("src",this.imgsrc);
    img.setAttribute("style","width:"+this.imgwidth);
    linklogo.appendChild(img);
    linklogo.appendChild(clearDiv.cloneNode(true));
    mgdsDiv.appendChild(linklogo);
    var attdiv = document.createElement('div');
    attdiv.setAttribute("id","attdiv");
    if (attachnode) {
        attdiv.appendChild(attachnode);
    }
    mgdsDiv.appendChild(attdiv);
	this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(mgdsDiv);
}

MGDSMapClient.prototype.overlayWMS = function(url,layer,name,format,clickevent,onoff,legend_url,clickcallback,grp) {
	var tile = new TileData(this.map,url,layer);
	if (format)
		tile.format=format;
	this.mtoverlays[name] = new Array();
	this.mtoverlays[name]['wmslayer'] = {
		alt: name,
		getTileUrl: tile.GetTileUrl,
		isPng: false,
		maxZoom: 22,
		minZoom: 1,
		name: name,
		tileSize: new google.maps.Size(256, 256)
	};
	if (onoff)
		this.baseLayersbool = false;
	this.mtoverlays[name]['overlay'] = new google.maps.ImageMapType(this.mtoverlays[name]['wmslayer']);
	this.mtoverlays[name]['clickevent'] = clickevent;
    this.mtoverlays[name]['callback'] = clickcallback;
	if (legend_url) {
		this.mtoverlays[name]['legend_url'] = legend_url;
	}
	this.controls.baseLayer(name,this.baseLayersbool,grp);
	this.baseLayersbool = false;	
};

MGDSMapClient.prototype.overlayESRI = function(url,layer,name,format,onoff,grp) {
	var tile = new EsriData(this.map,url,layer);
	if (format)
		tile.format=format;
	this.mtoverlays[name] = new Array();
	this.mtoverlays[name]['esrilayer'] = {
		alt: name,
		getTileUrl: tile.GetTileUrl,
		isPng: false,
		maxZoom: 22,
		minZoom: 1,
		name: name,
		tileSize: new google.maps.Size(256, 256)
	};
	if (onoff)
		this.baseLayersbool = false;
    
	this.mtoverlays[name]['overlay'] = new google.maps.ImageMapType(this.mtoverlays[name]['esrilayer']);
	//this.mtoverlays[name]['clickevent'] = clickevent;
    //this.mtoverlays[name]['callback'] = clickcallback;
	/*if (legend_url) {
		this.mtoverlays[name]['legend_url'] = legend_url;
	}*/
	this.controls.baseLayer(name,this.baseLayersbool,grp);
	this.baseLayersbool = false;	
};

// Change the tile url
MGDSMapClient.prototype.setTileData = function(name,url,layer) {
    var tile = new TileData(this.map,url,layer);
    var wmslayer = this.mtoverlays[name]['wmslayer'];
    wmslayer.getTileUrl = tile.GetTileUrl;
    var overlay = new google.maps.ImageMapType(wmslayer);
    this.mtoverlays[name]['overlay'] = overlay;

    var is_visible = !$('.baselayer[title="'+name+'"]').hasClass('off');
    if (is_visible) {
	this.map.overlayMapTypes.clear();
	this.map.overlayMapTypes.insertAt(0,overlay);
    }
}

MGDSMapClient.prototype.convertPoint = function(latLng) {
	var proj = this.oview.getProjection();
	var middle = proj.fromLatLngToContainerPixel(latLng);
	var ne = proj.fromContainerPixelToLatLng(new google.maps.Point(middle.x+2,middle.y-2));
	var sw = proj.fromContainerPixelToLatLng(new google.maps.Point(middle.x-2,middle.y+2));
	var bnds = sw.lng()+','+sw.lat()+','+((sw.lng()>ne.lng())?ne.lng()+360:ne.lng())+','+ne.lat();
	return bnds;
} 

MGDSMapClient.prototype.selectPoint = function(latlon) {
	var self = this;
	self.marker.setMap(null);
	self.infowin.close();
	var mt = self.map.overlayMapTypes.getAt(0);
	var layer = mt.name;
    //console.log(self.mtoverlays[layer]);
	if (layer && (self.mtoverlays[layer]['clickevent']|| self.mtoverlays[layer]['callback'])) {
		var str = '';
		var qurl = self.qurl;
		var data = $.extend({},self.mtoverlays[layer]['clickevent']);
		if (data['qurl']) {
			qurl = data['qurl'];
			delete data['qurl'];
		}
        //console.log(self.mtoverlays[layer]);
		if (data['SERVICE'] == 'WMS') {
			data['BBOX'] = this.convertPoint(latlon);
			str = decodeURIComponent($.param(data));
		} else {
			data['lat'] = latlon.lat();
			data['lon'] = latlon.lng();
			data['zoom'] = this.map.getZoom();
			str = decodeURIComponent($.param(data));
		}
        if (self.mtoverlays[layer]['callback']) {
            self.mtoverlays[layer]['callback'](qurl,data,latlon);
        } else {
            //console.log(qurl+str);
            $.ajax({
                type: "GET",
                url: qurl,
                data: str,
                beforeSend: function(msg){
                    self.map.setOptions({
                        draggableCursor: 'wait'
                    });
                },
                success: function(msg){
                    
                    if (msg) {
                        self.marker.setPosition(latlon);
                        self.marker.setMap(self.map);
                        self.infowin.setContent(msg);
                        self.infowin.open(self.map,self.marker);
                    }

                }
            }).always(function(){
                self.map.setOptions({
                        draggableCursor: 'crosshair'
                });
            });
        }
	}
}
MGDSMapClient.prototype.KMLOverlay = function(url,title,hide,zoomto,options) {
	this.layers[title] = new Array();
	this.layers[title]['url'] = url;
	this.layers[title]['preserveOverlay'] = (zoomto)?false:true;
    options = typeof options !== 'undefined' ? options : {};
    var opts = $.extend({preserveViewport:true},options);
	var onoff = (hide)?false:true;
	this.controls.overlayLayer(title,onoff,opts);
}
MGDSMapClient.prototype.ClusterOverlay = function(url,title,hide,grp_name,pos) {
	this.markerCluster[title] = new Array();
	this.markerCluster[title]['url'] = url;
	var onoff = (hide)?false:true;
    this.controls.clusterLayer(title,onoff,grp_name,pos);
}

MGDSMapClient.prototype.GeoJSONOverlay = function(opts) {    
    var url = opts.url;
    var title = opts.title;
    var onoff = opts.onoff;
    var idProp = opts.idProp;
    var callback = opts.callback;
    var defaultStyle = opts.defaultStyle;
    var mouseoverStyle = opts.mouseoverStyle;
    var click = opts.click;
    var control_position = opts.control_position;
    var grp_name = opts.grp_name;
    var hover_text_fun = opts.hover_text_fun;
    var click_text_fun = opts.click_text_fun;
    var selectedStyle = opts.selectedStyle || opts.defaultStyle;

    function processPoints(geometry, callback, thisArg) {
	if (!geometry) {
	    return;
	} else if (geometry instanceof google.maps.LatLng) {
	    callback.call(thisArg, geometry);
	} else if (geometry instanceof google.maps.Data.Point) {
	    callback.call(thisArg, geometry.get());
	} else {
	    geometry.getArray().forEach(function(pt) {
		processPoints(pt, callback, thisArg);
	    });
	}
    }

    // zoom to show all the features
    var bounds = new google.maps.LatLngBounds();
    
    var data = new google.maps.Data();
    this.data_layers[title] = data;
    var self = this;
    var afterLoad = function(fts) {
	if (callback) {
	    callback(fts,data);
	}
	
	if (fts.length) {
	    fts.forEach(function(ft) {
		if (ft.getProperty('selected')=='true') {
		    data.overrideStyle(ft,selectedStyle);
		} else {
		    data.overrideStyle(ft, defaultStyle);
		}
		processPoints(ft.getGeometry(), bounds.extend, bounds);
	    });
	    self.map.fitBounds(bounds);

	    if (onoff) {
		data.setMap(self.map);
	    } else {
		data.setMap(null);
	    }
	    self.controls.geojsonLayer(title,onoff,grp_name,control_position);
	    
	    var lloverlay = new google.maps.OverlayView();
	    lloverlay.draw = function() {};
	    lloverlay.setMap(mgdsMap.map);
	    
	    if (mouseoverStyle) {
		data.addListener('mouseover', function(e) {
		    data.overrideStyle(e.feature, mouseoverStyle);
		});
		data.addListener('mouseout', function(e) {
		    var ft = e.feature;
		    if (ft.getProperty('selected')=='true') {
			data.overrideStyle(ft,selectedStyle);
		    } else {
			data.overrideStyle(ft, defaultStyle);
		    }
		});
	    }
	    
	    if (hover_text_fun) {
		data.addListener('mouseover', function(e) {
		    if (self.ml) self.ml.setMap(null);
		    var hover_text_props = hover_text_fun(e,lloverlay);
		    hover_text_props.map = self.map;
		    self.ml = new MapLabel(hover_text_props);
		});
		data.addListener('mouseout', function(e) {
		    self.ml.setMap(null);
		});
	    }

	    if (click_text_fun) {
		data.addListener('click', function(e) {
		    if (self.ml) self.ml.setMap(null);
		    var click_text_props = click_text_fun(e,lloverlay);
		    click_text_props.map = self.map;
		    self.ml = new MapLabel(click_text_props);
		});
		data.addListener('mouseout', function(e) {
		    self.ml.setMap(null);
		});
	    }
	    
	    if (click) {
		data.addListener('click', function(e) {
		    click(e);
		});
	    }
	}
    }

    data.loadGeoJson(url,{idPropertyName:idProp}, afterLoad);
    

    return data;
}

function TileData(map,baseUrl,layer) {
	var self = this;
	this.map = map;
	this.baseUrl = baseUrl;
	this.format = "image/png";
	this.styles = '';
	this.layer=layer;
	this.baseOpts = "&REQUEST=GetMap&SERVICE=WMS&VERSION=1.1.1"
		+"&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&WIDTH=256&HEIGHT=256&reaspect=false";
	this.GetTileUrl = function(tile, zoom) {
		var projection = self.map.getProjection();
		var zpow = Math.pow(2, zoom);
		var ur = new google.maps.Point( (tile.x+1)*256.0/zpow , (tile.y+1)*256.0/zpow );
		var ll = new google.maps.Point( tile.x*256.0/zpow , tile.y*256.0/zpow );
		var urw = projection.fromPointToLatLng(ur);
		var llw = projection.fromPointToLatLng(ll);
		var bbox;
		var lSRS;
		var urwlng = (urw.lng() == -180)? 180: urw.lng();
		var llwlng = (llw.lng() == 180)? -180: llw.lng();
		if (zoom < 5) {
			bbox=dd2MercMetersLng(llwlng)+","+dd2MercMetersLat(urw.lat())+","+dd2MercMetersLng(urwlng)+","+dd2MercMetersLat(llw.lat());
			lSRS="EPSG:3395";// use mercator projection when viewimg large areas
		} else {
			bbox = llwlng + ','+urw.lat()+','+urwlng+','+llw.lat();
			lSRS="EPSG:4326";// use geographic projection when viewing details
		}
		var lURL = self.baseUrl + self.baseOpts
		+"&LAYERS="+self.layer
		+"&STYLES="+self.styles
		+"&FORMAT="+self.format
		+"&SRS="+lSRS
		+"&BBOX="+bbox
		//console.log(lURL);
		return lURL;
	}
}

function EsriData(map,baseUrl,layer) {
	var self = this;
	this.map = map;
	this.baseUrl = baseUrl;
	this.format = "png";
	this.layer=layer;
	this.baseOpts = "&transparent=true&size=256,256&f=image";
	this.GetTileUrl = function(tile, zoom) {
		var projection = self.map.getProjection();
		var zpow = Math.pow(2, zoom);
		var ur = new google.maps.Point( (tile.x+1)*256.0/zpow , (tile.y+1)*256.0/zpow );
		var ll = new google.maps.Point( tile.x*256.0/zpow , tile.y*256.0/zpow );
		var urw = projection.fromPointToLatLng(ur);
		var llw = projection.fromPointToLatLng(ll);
		var bbox;
		var lSRS;
		var urwlng = (urw.lng() == -180)? 180: urw.lng();
		var llwlng = (llw.lng() == 180)? -180: llw.lng();
		if (zoom < 5) {
			bbox=dd2MercMetersLng(llwlng)+","+dd2MercMetersLat(urw.lat())+","+dd2MercMetersLng(urwlng)+","+dd2MercMetersLat(llw.lat());
			lSRS="102100";// use mercator projection when viewimg large areas
		} else {
			bbox = llwlng + ','+urw.lat()+','+urwlng+','+llw.lat();
			lSRS="4326";// use geographic projection when viewing details
		}
		var lURL = self.baseUrl + self.baseOpts
		+"&layers="+self.layer
		+"&format="+self.format
		+"&imageSR="+lSRS
        +"&bboxSR="+lSRS
		+"&bbox="+bbox
		//console.log(lURL);
		return lURL;
	}
}

function controlOverlay(mapClient,hide) {
	this.mapClient = mapClient;
	this.map = mapClient.map;
	this.bases = false;
	this.overlays = false;
	this.clusters = false;
	this.controlDiv = document.createElement("div");
	this.controlDiv.id = "layercontrol";
	var textarrow = (hide)?"&lt;":"&gt;";
	this.controlDiv.innerHTML = '<div id="tabwrapper"><div id="tabbox4sides" class="tabbox">'+textarrow+'</div></div>';
	this.lDiv = document.createElement("div");
	this.lDiv.id = "layers";
	this.controlDiv.appendChild(this.lDiv);
	this.layersDiv = document.createElement("div");
	this.layersDiv.id = "olayers";
	this.lDiv.appendChild(this.layersDiv);
    this.maskDiv = document.createElement("div");
	this.maskDiv.id = "gmrtmask";
	this.maskDiv.innerHTML = "<img src=\"http://www.marine-geo.org/images/mask.png\" height=\"23\" alt=\"Mask\" title=\"Show/Hide GMRT Mask\"/>";
	this.lDiv.appendChild(this.maskDiv);
	this.gratDiv = document.createElement("div");
	this.gratDiv.id = "graticule";
	this.gratDiv.innerHTML = "<img src=\"http://www.marine-geo.org/images/grat1.png\" height=\"23\" alt=\"Grid\" title=\"Show/Hide Gridlines\"/>";
    this.lDiv.appendChild(this.gratDiv);
    this.layerGroups = {};

	this.mapClient.map.controls[google.maps.ControlPosition.RIGHT].push(this.controlDiv);
	if (hide) {
		this.lDiv.style.display = 'none';
	}
	$('#tabbox4sides').unbind();
	$(document).on('click','#tabbox4sides',function(){
		if ($("#layercontrol #layers").is(":visible")) {
			$("#layercontrol #layers").hide();
			$("#tabbox4sides").text("<");
		} else {
			$("#layercontrol #layers").show();
			$("#tabbox4sides").text(">");
		}
	});
	
	$(document).on('click','#graticule',function(){
		if (!mapClient.grat) {
			$(this).css('background-color','#BBB');
			mapClient.grat = new Graticule(mapClient.map);
		} else {
			$(this).css('background-color','#FFF');
			mapClient.grat.setMap(null);
			mapClient.grat = null;
		}
	});
    $(document).on('click','#gmrtmask',function(){
		if (mapClient.map.getMapTypeId()=='Bathymetry') {
			$(this).css('background-color','#BBB');
			mapClient.map.setMapTypeId('GMRT Mask');
		} else {
			$(this).css('background-color','#FFF');
			mapClient.map.setMapTypeId('Bathymetry');
		}
	});
}

function LayerGroup(opts) {
    var title = opts.title;
    this.div = document.createElement("div");
    this.div.innerHTML = "<div class=\"layerdivtitle\">" + title + "</div>";
    this.layerContainer = document.createElement("div");
    this.layerContainer.className = "layercontainer";
    this.div.appendChild(this.layerContainer);
    this.title = title;
    this.layers = {};
}

LayerGroup.prototype.addLayer = function(title,onoff,pos,classname) {
    var children = $(this.layerContainer).children();
    pos = pos || children.length;
    var layerDiv = document.createElement("div");
    layerDiv.className = "layerdiv " + classname + ((onoff)?'':' off');
    layerDiv.title = title;
    layerDiv.style.backgroundColor = (onoff)?'#BBBBBB':'#FFFFFF';
    layerDiv.innerHTML = title;
    layerDiv.setAttribute('data-position', pos);

    if (children.length == 0) {
	this.layerContainer.appendChild(layerDiv);
    } else {
	var i = 0;
	while (i < children.length && $(children[i]).attr('data-position') < pos) { i += 1; }
	if (i == children.length) {
	    this.layerContainer.appendChild(layerDiv)
	} else {
	    $(children[i]).before(layerDiv);
	}
    }
    this.layers[title] = layerDiv;
    $(this.div).show();
}

controlOverlay.prototype.addLayerGroup = function(opts,pos) {
    var grp = new LayerGroup(opts);
    grp.div.setAttribute('data-position',pos);
    $(grp.div).hide(); // Hide until layer is added
    var children = $(this.layersDiv).children();
    var len = children.length;
    pos = pos || len;
    if (len == 0) {
	this.layersDiv.appendChild(grp.div)
    } else {
	var i = 0;
	while (i < len && children[i].getAttribute('data-position') < pos) { i += 1; }
	if (i == len) {
	    this.layersDiv.appendChild(grp.div)
	} else {
	    this.layersDiv.insertBefore(grp.div, children[i])
	}
    }
    this.layerGroups[opts.title] = grp;
}

controlOverlay.prototype.removeLayerGroup = function(title) {
    $(this.layerGroups[title].div).remove();
    delete this.layerGroups[title];
}

controlOverlay.prototype.hasLayerGroup = function(title) {
    return title in this.layerGroups;
}

controlOverlay.prototype.legendLayer = function(html) {
	if (this.legendDiv && this.legendDiv.parentNode) {
		this.legendDiv.parentNode.removeChild(this.legendDiv);
	}
	if (html) {
		this.legendDiv = document.createElement("div");
		this.legendDiv.className = "legendcontrol";
		this.legendDiv.innerHTML = '<div class="tabwrapper"><div class="tabboxlegend tabbox">Legend</div></div>';
		this.limgDiv = document.createElement("div");
		this.limgDiv.className = "maplegend";
		this.limgDiv.innerHTML = html;
		this.legendDiv.appendChild(this.limgDiv);
		this.mapClient.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(this.legendDiv);
		$(document).off('click','.tabboxlegend');
		$(document).on('click','.tabboxlegend',function(){
			if ($(".legendcontrol .maplegend").is(":visible")) {
				$(".legendcontrol .maplegend").hide();
			} else {
				$(".legendcontrol .maplegend").show();
			}
		});
	}
}

controlOverlay.prototype.baseLayer = function(title,onoff,grp_name,lyr_pos) {
    grp_name = grp_name || 'Base Layers';
    var self = this;
    if (!(grp_name in this.layerGroups)) {
	this.addLayerGroup({title:grp_name});
    }
    var grp = this.layerGroups[grp_name];
    
    grp.addLayer(title,onoff,lyr_pos,'baselayer');
    if (!this.bases) {
	//this.layersDiv.appendChild(this.basediv);
	google.maps.event.addListener(self.mapClient.map, 'click', function(event) {
	    self.mapClient.selectPoint(event.latLng);
	});
	
	$(document).on('click','.baselayer',function(){
	    var idx = $(this).attr('title');
	    if ($(this).hasClass('off')) {
		$(this).removeClass('off');
		self.mapClient.mtoverlays[idx]['overlay'] = new google.maps.ImageMapType(self.mapClient.mtoverlays[idx]['wmslayer']);
	    } else {
		var mt = self.mapClient.map.overlayMapTypes.getAt(0);
	    }
	    self.legendLayer(self.mapClient.mtoverlays[idx]['legend_url']);
	    if( mt != undefined && mt.name == idx ){
		this.style.backgroundColor = '#FFFFFF';
		$(this).addClass('off');
		self.mapClient.map.overlayMapTypes.removeAt(0);
	    }else{
		$(".baselayer").css('background-color','#FFFFFF');
		self.mapClient.map.overlayMapTypes.clear();
		$(this).css('background-color','#BBBBBB');
		self.mapClient.map.overlayMapTypes.insertAt(0,self.mapClient.mtoverlays[idx]['overlay']);
	    }
	});
	this.bases=true
    }
    if (onoff) {
	self.mapClient.map.overlayMapTypes.clear();
	self.mapClient.map.overlayMapTypes.insertAt(0,self.mapClient.mtoverlays[title]['overlay']);
	self.legendLayer(self.mapClient.mtoverlays[title]['legend_url']);
    }
    grp.layers[title].click();
}

controlOverlay.prototype.geojsonOff = function(grp_title,title) {
    var lyrctrl = this.layerGroups[grp_title].layers[title]
    $(lyrctrl).css('background-color', '#FFFFFF');
    if (this.mapClient.data_layers[title]) {
	this.mapClient.data_layers[title].setMap(null);
    }
}

controlOverlay.prototype.geojsonOn = function(grp_title,title) {
    var lyrctrl = this.layerGroups[grp_title].layers[title]
    $(lyrctrl).css('background-color', '#BBBBBB');
    if (this.mapClient.data_layers[title]) {
	this.mapClient.data_layers[title].setMap(this.mapClient.map);
    }
}

controlOverlay.prototype.geojsonLayer = function(title,onoff,grp_name,lyr_pos) {
    grp_name = grp_name || 'Overlay Layers';
    var self = this;
    if (!(grp_name in this.layerGroups)) {
	this.addLayerGroup({title:grp_name});
    }
    var grp = this.layerGroups[grp_name];
    grp.addLayer(title,onoff,lyr_pos,'');

    var self = this;
    $(grp.layers[title]).on('click', function() {
	var dataLayer = self.mapClient.data_layers[title];
	if (dataLayer.getMap()) {
	    self.geojsonOff(grp_name,title);
	} else {
	    self.geojsonOn(grp_name,title);
	}
    });
}

controlOverlay.prototype.overlayOn = function(grp_name,title,opts) {
    var lyrctrl = this.layerGroups[grp_name].layers[title];
    $(lyrctrl).removeClass('off');
    $(lyrctrl).css('background-color','#BBBBBB');
    var url = this.mapClient.layers[title]['url'];
    this.mapClient.layers[title]['overlay'] = new google.maps.KmlLayer(url,opts);
    this.mapClient.layers[title]['overlay'].setMap(this.mapClient.map);
}

controlOverlay.prototype.overlayOff = function(grp_name,title) {
    var lyrctrl = this.layerGroups[grp_name].layers[title];
    $(lyrctrl).css('background-color', '#FFFFFF');
    $(lyrctrl).addClass('off');
    if (this.mapClient.layers[title] && this.mapClient.layers[title]['overlay']) {
	this.mapClient.layers[title]['overlay'].setMap(null);
    }
}

controlOverlay.prototype.overlayLayer = function(title,onoff,opts) {
    var grp_name = opts.grp_name || 'Overlay Layers';
    var self = this;
    if (!(grp_name in this.layerGroups)) {
	this.addLayerGroup({title: grp_name});
    }
    var grp = this.layerGroups[grp_name];
    var self = this;
    grp.addLayer(title,onoff,opts.lyr_pos,'overlay');
	if (!this.overlays) {
		if (!this.clusters)
			//this.layersDiv.appendChild(this.overlaydiv);
		$(document).on('click','.overlay',function(){
			var idx = $(this).attr('title');
			if ($(this).hasClass('off')) {
			    self.overlayOn(grp_name,idx,opts);
			} else {
			    self.overlayOff(grp_name,idx);
				/*if( self.mapClient.layers[idx]['overlay'].getMap() ){
					$(this).css('background-color','#FFFFFF');
					self.mapClient.layers[idx]['overlay'].setMap(null);
				}else{
					$(this).css('background-color','#BBBBBB');
					self.mapClient.layers[idx]['overlay'].setMap(self.mapClient.map);
				}*/
			}
		});
		this.overlays=true
	}
	if (onoff) {
		var url = self.mapClient.layers[title]['url'];
		self.mapClient.layers[title]['overlay'] = new google.maps.KmlLayer(url,{preserveViewport:self.mapClient.layers[title]['preserveOverlay']});
		self.mapClient.layers[title]['overlay'].setMap(((onoff)?self.mapClient.map:null));
	}
		
}
controlOverlay.prototype.clusterLayer = function(title,onoff,grp_name,lyr_pos) {
    var self = this;
    onoff = false; //Clusters really should not be on by default
    grp_name = grp_name || 'Overlay Layers';
    var self = this;
    if (!(grp_name in this.layerGroups)) {
	this.addLayerGroup({title: grp_name});
    }
    var grp = this.layerGroups[grp_name];
    grp.addLayer(title,onoff,lyr_pos,'cluster');
	if (!this.clusters) {
		if (!this.overlays)
			this.layersDiv.appendChild(this.overlaydiv);
		$(document).on('click','.cluster',function(){
			var me = this;
			var idx = $(this).attr('title');
			if ($(me).hasClass('off')) {
				$(me).html('Loading...');
				$(me).removeClass('off');
				$(me).css('background-color','#BBBBBB');
				var url = self.mapClient.markerCluster[idx]['url'];
				self.mapClient.markers[idx] = new Array();
				$.ajax({ url: url, dataType: 'json',
					success: function(data) {
						$.each(data,function(key,val){
							var latLng = new google.maps.LatLng(val.lat,val.lon);
							var marker = new google.maps.Marker({
								position: latLng,
								content: val.content,
								icon: {
									url:"http://www.marine-geo.org/images/red_dot.png",
									size: new google.maps.Size(8,8),
									anchor: new google.maps.Point(4,4)
								}
							});
							self.mapClient.markers[idx].push(marker);
							google.maps.event.addListener(marker, 'click', function () {
								self.mapClient.infowin.setContent(marker.content);
								self.mapClient.infowin.open(self.mapClient.map, marker);
							});

						});
						self.mapClient.markerCluster[idx]['overlay'] = new MarkerClusterer(self.mapClient.map, self.mapClient.markers[idx],{minimumClusterSize:4});
						$(me).html(idx);
					}
				});
			} else {
				if( self.mapClient.markerCluster[idx]['overlay'].getTotalMarkers() ){
					this.style.backgroundColor = '#FFFFFF';
					self.mapClient.markerCluster[idx]['overlay'].clearMarkers();
				}else{
					this.style.backgroundColor = '#BBBBBB';
					self.mapClient.markerCluster[idx]['overlay'].addMarkers(self.mapClient.markers[idx]);
				}
			}
		});
		this.overlays=true;
		this.clusters=true;
	}
}
// Adapted from Bill Chadwick 2006
// This work is licensed under the Creative Commons Attribution 3.0 Unported
// http://creativecommons.org/licenses/by/3.0/
var Graticule = (function() {
    function _(map) {
        // default to decimal intervals
        this.set('container', document.createElement('DIV'));
        this.show();
        this.setMap(map);
    }
    _.prototype = new google.maps.OverlayView();
    _.prototype.addDiv = function(div) {
        this.get('container').appendChild(div);
    },
    _.prototype.onAdd = function() {
        var self = this;
        this.getPanes().mapPane.appendChild(this.get('container'));
        function redraw() {
            self.draw();
        }
        this.idleHandler_ = google.maps.event.addListener(this.getMap(), 'idle', redraw);

        function changeColor() {
            self.draw();
        }
        changeColor();
        this.typeHandler_ = google.maps.event.addListener(this.getMap(), 'maptypeid_changed', changeColor);
    };
    _.prototype.clear = function() {
        var container = this.get('container');
        while (container.hasChildNodes()) {
            container.removeChild(container.firstChild);
        }
    };
    _.prototype.onRemove = function() {
        this.get('container').parentNode.removeChild(this.get('container'));
        this.set('container', null);
        google.maps.event.removeListener(this.idleHandler_);
        google.maps.event.removeListener(this.typeHandler_);
    };
    _.prototype.show = function() {
        this.get('container').style.visibility = 'visible';
    };
    _.prototype.hide = function() {
        this.get('container').style.visibility = 'hidden';
    };
    function gridPrecision(dDeg) {
        if (dDeg < 0.01) return 3;
        if (dDeg < 0.1) return 2;
        if (dDeg < 1) return 1;
        return 0;
    }
    function leThenReturn(x, l, d) {
        for (var i = 0; i < l.length; i += 1) {
            if (x <= l[i]) {
                return l[i];
            }
        }
        return d;
    }
    var numLines = 10;
    function latLngToPixel(overlay, lat, lng) {
      return overlay.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
    };
    
    function gridInterval(dDeg, mins) {
        return leThenReturn(Math.ceil(dDeg / numLines * 6000) / 100, mins,
                        60 * 45) / 60;
    }
    function makeLabel(color, x, y, text) {
        var d = document.createElement('DIV');
        var s = d.style;
        s.position = 'absolute';
        s.left = x+'px';
		s.top = y+'px';
        s.color = color;
        //s.width = '3em';
        s.fontSize = '.8em';
        s.whiteSpace = 'nowrap';
        d.innerHTML = text;
        return d;
    };
    function createLine(x, y, w, h, color) {
        var d = document.createElement('DIV');
        var s = d.style;
        s.position = 'absolute';
        s.overflow = 'hidden';
        s.backgroundColor = color;
        s.opacity = 0.3;
        var s = d.style;
        s.left = x+'px';
        s.top = y+'px';
        s.width = w+'px';
        s.height = h+'px';
        return d;
    };
    var span = 50000;
    function meridian(px, color) {
        return createLine(px, -span, 1, 2 * span, color);
    }
    function parallel(py, color) {
        return createLine(-span, py, 2 * span, 1, color);
    }
    function eqE(a, b, e) {
        if (!e) {
            e = Math.pow(10, -6);
        }
        if (Math.abs(a - b) < e) {
            return true;
        }
        return false;
    }
    // Redraw the graticule based on the current projection and zoom level
    _.prototype.draw = function() {
        var color = '#fff';
        this.clear();
        if (this.get('container').style.visibility != 'visible') {
            return;
        }
        // determine graticule interval
        var bnds = this.getMap().getBounds();
        if (!bnds) {
            // The map is not ready yet.
            return;
        }
        var sw = bnds.getSouthWest();
        var ne = bnds.getNorthEast();
        var l = sw.lng();
        var b = sw.lat();
        var r = ne.lng();
        var t = ne.lat();
        if (l == r) { l = -180.0; r = 180.0; }
        if (t == b) { b = -90.0; t = 90.0; }

        // grid interval in degrees
        var mins = [0.06,0.12,0.3,0.6,1.2,3,6,12,30,60,120,300,600,1200,1800];
        var dLat = gridInterval(t - b, mins);
        var dLng = gridInterval(r > l ? r - l : ((180 - l) + (r + 180)), mins);

        // round iteration limits to the computed grid interval
        l = Math.floor(l / dLng) * dLng;
        b = Math.floor(b / dLat) * dLat;
        t = Math.ceil(t / dLat) * dLat;
        r = Math.ceil(r / dLng) * dLng;
        if (r == l) l += dLng;
        if (r < l) r += 360.0;
        var y = latLngToPixel(this, b + dLat, l).y + 2;

        // lo<r to skip printing 180/-180
        for (var lo = l; lo < r; lo += dLng) {
            if (lo > 180.0) {
                r -= 360.0;
                lo -= 360.0;
            }
            var px = latLngToPixel(this, b, lo).x;
            this.addDiv(meridian(px, color));
            this.addDiv(
				makeLabel(
					color,
					px + 3,
					y - 20,
					lo.toFixed(gridPrecision(dLng))+'&deg;'
				)
			);
        }
        var x = latLngToPixel(this, b, l + dLng).x + 3;
        for (; b <= t; b += dLat) {
            var py = latLngToPixel(this, b, l).y;
            this.addDiv(parallel(py, color));
            this.addDiv(
				makeLabel(
					color,
					x,
					py + 1,
					b.toFixed(gridPrecision(dLat))+'&deg;'
				)
			);
        }
    };
    return _;
})();
