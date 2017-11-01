String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function resize_window() {
    $('#content,#resultslist').height($(window).height()-2);
    $('#content').width($(window).width()-$('#resultslist').width());
    $("#listdata").mCustomScrollbar({
        theme: 'minimal-dark',
        scrollInertia: 0,
        mouseWheel:{scrollAmount:5}
    });
}
var requests = new Array();
$(document).ready(function(){
    resize_window();
    $(window).resize(function(){resize_window()});

    mgdsMap = new MGDSMapClient();
    mgdsMap.mapInit();
    //mgdsMap.LogoImage();
    
    //$(document).on('change',"#polygon",
    document.addEventListener('polygon-change', function(e) {
	if (requests) {
	    for (var i=0;i<requests.length;i++) {
		requests[i].abort();
	    }
	    requests = new Array();
	}
	$("#abstract").hide();
	$("#ecresults").html("<h4>EarthChem</h4><img src=\"/images/throbber.gif\" />");
	$("#gcresults").html("<h4>Geochron</h4><img src=\"/images/throbber.gif\" />");
	$("#mgdsresults").html("<h4>Marine-Geo</h4><img src=\"/images/throbber.gif\" />");
	$("#gmrtresults").html("<h4>GMRT</h4><img src=\"/images/throbber.gif\" />");
	$("#sesarresults").html("<h4>SESAR</h4><img src=\"/images/throbber.gif\" />");
	
	var polygonToString = function(coords, sep) {
	    if (!sep) { sep = ','; }
	    return coords.map(function(pt) {
		return "{0} {1}".format(pt[0], pt[1]);
	    }).join(sep);
	}
	var polygon = e.detail;
	var poly_str = polygonToString(polygon);
	var poly_rev_str = polygonToString(polygon.map(function(pt) { return [pt[1], pt[0]] }));
	var poly_rev_str_no_commas = polygonToString(polygon.map(function(pt) { return [pt[1], pt[0]] }), ' ');
	var poly_str_no_commas = polygonToString(polygon, ' ');
	
	var wesn = mgdsMap.getContainingBBOX(polygon);
	var wesn_str = "west={0}&east={1}&south={2}&north={3}".format(wesn.w, wesn.e, wesn.s, wesn.n);
	
	var formatResultHeader = function(title, count) {
	    return "<div class='result-header'><span class='result-title'>{0}</span><span class='result-count'>({1} results)</span></div>".format(title, count);
	}

	var formatResultBody = function(text,url) {
	    return "<div>{0}</div><div><a href='{1}' target=\"_blank\">Explore &gt;&gt;&gt;</a></div>".format(text,url);
	}
	
	//Earthchem
	var ecurl = "http://ecp.iedadata.org/polygoncount?srs=3031&polygon="+poly_str;
	var ecsearchurl = "http://ecp.iedadata.org/polygonsearch?srs=3031&polygon="+poly_str;
	requests.push($.ajax({
	    url: ecurl,
	    dataType: "xml",
	    success: function(ev){
		var total = $(ev).find("count[name='total']").first().attr('value');
		total = total?parseInt(total):0;
		var html = formatResultHeader("EarthChemPortal", total);
		if (total > 0) {
		    var reps = "";
		    $(ev).find("count:not([name='total'])").each(function(){
			if (parseInt($(this).attr("value"))>0)
			    reps += $(this).attr('label')+ " ("+$(this).attr("value")+"), ";
		    });
		    reps = reps.substring(0,reps.length - 2);
		    html += formatResultBody(reps, ecsearchurl);
		}
		$('#ecresults').html(html);
	    }
	}));
	//MGDS
	var mgdsurl = "http://www.marine-geo.org/tools/new_search/datasetservice.php?srs=EPSG:3031&resulttype=hits&boundspath=POLYGON(({0}))".format(poly_str);
	var mgdssearchurl = "http://www.marine-geo.org/tools/new_search/index.php?srs=EPSG:3031&output_info_all=on&boundspath=POLYGON(({0}))".format(poly_str);
	requests.push($.ajax({
	    url: mgdsurl,
	    dataType: "xml",
	    success: function(ev){
		var total = parseInt($(ev).find("count").eq(0).text());
		var html = formatResultHeader("MGDS", total);
		if (total > 0) {
		    var dts = "";
		    $(ev).find("data_type:not([name='Other'])").each(function(){
			if (parseInt($(this).attr("count"))>0)
			    dts += $(this).attr('name')+ " ("+$(this).attr("count")+"), ";
		    });
		    dts = dts.substring(0,dts.length - 2);
		    html += formatResultBody(dts, mgdssearchurl);
		}
		$('#mgdsresults').html(html);

	    }
	}));
	//Geochron
	var gcurl = "http://www.geochron.org/polygoncount?&srs=3031&polygon="+poly_str;
	var gcsearchurl = "http://www.geochron.org/polygonsearch?srs=3031&polygon="+poly_str;
	requests.push($.ajax({
	    url: gcurl,
	    dataType: "xml",
	    success: function(ev){
		var total = parseInt($(ev).find("count[name='total']").first().attr('value'));
		var html = formatResultHeader("Geochron", total);
		if (total > 0) {
		    html += formatResultBody("", gcsearchurl);
		}
		$('#gcresults').html(html);
	    }
	}));

	//GMRT
        var gmrtsearchurl = "http://www.marine-geo.org/tools/maps_grids.php?"+wesn_str;
        $("#gmrtresults").html("<h4>GMRT</h4><div><a href=\""+gmrtsearchurl+"\" target=\"_blank\">Generate a map/grid using GMRT MapTool &gt;&gt;&gt;</a></div>");

	//SESAR
	var sesarsearchurl = "http://www.geosamples.org/geosearch?srs=3031&polygon="+poly_str;
	var sesarurl = "http://prod-app.earthchem.org:8989/geoserver/SESAR/wfs?";
	var xml =
	   ('<GetFeature ' +
                  'service="WFS" ' +
                  'resultType="hits" ' +
                  'xmlns="http://www.opengis.net/wfs" ' +
                  'xmlns:ogc="http://www.opengis.net/ogc" ' +
                  'xmlns:gml="http://www.opengis.net/gml" ' +
                  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                  'xmlns:SESAR="http://prod-app.earthchem.org:8989/geoserver/" ' +
                  'xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"> ' +
              '<Query typeName="SESAR:wfs_samples" srsName="EPSG:3031"> ' +
                '<ogc:Filter> ' +
                  '<ogc:Within> ' +
                    '<ogc:PropertyName>geom</ogc:PropertyName> ' +
                    '<gml:Polygon srsName="EPSG:3031"> ' +
                      '<gml:exterior> ' +
                        '<gml:LinearRing srsName="EPSG:3031"> ' +
                          '<gml:posList>{0}</gml:posList> ' +
                        '</gml:LinearRing> ' +
                      '</gml:exterior> ' +
                    '</gml:Polygon> ' +
                  '</ogc:Within> ' +
                '</ogc:Filter> ' +
              '</Query> ' +
            '</GetFeature> ').format(poly_str_no_commas);
	
	requests.push($.ajax({
	    url: sesarurl,
	    method: 'POST',
	    contentType: 'text/plain',
	    dataType: "xml",
	    data: xml,
	    success: function(str){
		var total = $(str).find("*").first().attr('numberOfFeatures');
		total = total?parseInt(total):0;
		var html = formatResultHeader('SESAR Samples', total);
		if (total > 0) {
		    html += formatResultBody("", sesarsearchurl);
		}
		$('#sesarresults').html(html);
	    },
	    error: function(request,status, err){
		if (status == "timeout") {
		    // timeout -> reload the page and try again
		    $("#sesarresults").html("<h4>SESAR Samples</h4><div>The area selected is too large for a SESAR search. Please select a smaller region.</div>");
		}
	    }
	}));
    });

});
