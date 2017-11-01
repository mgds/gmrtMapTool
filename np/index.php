<?php
//maintenance_page();
?>
<!DOCTYPE html>
<html>
<head>
	<title>Marine Geoscience Data System: GMRT MapTool North Polar</title>
	<meta name="Description" content="The Marine Geoscience Data System provides access to solid earth data from the earth, ocean and polar environments." />
	<meta name="Keywords" content="Antartic, Ridge, Depth, Sonar, Ocean, Global, Map, Grid, Create, GMRT, Seafloor, Topography, Multibeam, Synthesis, Bathymetry, GeoPRISMS, MARGINS, Ridge 2000, Seismic Reflection, GeoMapApp, IEDA" />
    <script type="text/javascript" src="/inc/jquery-1.9.1.js"></script>
    <script type="text/javascript" src="/bower_components/jquery-ui/jquery-ui.min.js"></script>
	<script src="js/ol-debug.js" type="text/javascript"></script>
    <script src="js/basemap_v3.js?a=1" type="text/javascript"></script>
	<script src="/bower_components/proj4/dist/proj4-src.js" type="text/javascript"></script>
    <script src="js/basemap_conf.js" type="text/javascript"></script>
    <script type="text/javascript" src="js/GMRTMapTool.js"></script>
    <script type="text/javascript" src="js/boundsdiv.js"></script>
    <!--<script type="text/javascript" src="/bower_components/ol3-layerswitcher/src/ol3-layerswitcher.js"></script>
    <script type="text/javascript" src="/bower_components/ol3-popup/src/ol3-popup.js"></script>-->
    
    <script type="text/javascript" src="js/map_control.js"></script>
	<script type="text/javascript" src="/inc/jquery.lightbox-0.5.js"></script>
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script type="text/javascript" src="/js/jquery.cookie.js"></script>
    
    <link rel="stylesheet" type="text/css" href="/css/jquery.lightbox-0.5.css" />
    <link rel="stylesheet" href="/bower_components/fontawesome/css/font-awesome.min.css">
    <link rel="stylesheet" type="text/css" href="/css/main.css?a=1" media="all" />
    <link rel="stylesheet" type="text/css" href="css/mapv3.css" />
    <link rel="stylesheet" type="text/css" href="css/map_control.css" />
    <link rel="stylesheet" type="text/css" href="css/spdatabrowser.css" />
    <link rel="stylesheet" type="text/css" href="/tools/GMRTMapTool/css/GMRTMapTool.css" />
    <link rel="stylesheet" type="text/css" href="http://openlayers.org/en/v3.12.1/css/ol.css"/>
	<link rel="stylesheet" type="text/css" href="/inc/jquery-ui-1.10.2.custom/css/smoothness/jquery-ui-1.10.2.custom.min.css" media="all" />
    <!--<link rel="stylesheet" type="text/css" href="/databrowser/css/map_control.css"/>
	<script type="text/javascript" src="/inc/jquery.lightbox-0.5.js"></script>
    <link rel="stylesheet" type="text/css" href="/css/jquery.lightbox-0.5.css" />
    <link rel="stylesheet" type="text/css" href="/tools/GMRTMapTool/css/GMRTMapTool.css" />
    <link rel="stylesheet" href="/bower_components/fontawesome/css/font-awesome.min.css">
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script type="text/javascript" src="/js/jquery.cookie.js"></script>
	<script type="text/javascript" src="/tools/GMRTMapTool/js/GMRTMapTool.js"></script>-->
</head>
<body>
    <div id="tcontent">
        <div id="mapheader">
        </div>
        <div id="mapcwrapper">
            <div id="mapc"></div>
            <div id="drawing-buttons">
              <div id="drag-icon" data-mode="None" class="drawing-button draw-active"><img src="/images/drag-icon.png"/></div>
              <div id="rect-icon" data-mode="Box" class="drawing-button"><img src="/images/rectangle-icon.png"/></div>
            </div>
        </div>
    </div>
<div id="dialog"></div>
<div id="contentboxes" style="display:none">
    <div id="profilediv">
        <div style="clear:both"></div>
        <div class="boundscontainer">
            <form id="profileform" action="/services/profileserver.php" method="get">
            <div class="title">GMRT MapTool</div>
            <div class="instructions" style="width:250px;">Select a line on the map to draw a profile. Click to start a line and double-click to end.</div>
            <input type="hidden" id="boundspath" name="boundspath" />
            <div id="profile_plot" style="width:400px;height:200px;text-align:center;"></div>
            <div style="position:absolute;top:5px;right:5px;text-align:right;">
                <div>
                    <select name="format" id="format" style="width:125px;">
                        <option value="text/plain" selected>Plain text Format</option>
                        <option value="geojson">GeoJSON Format</option>
                    </select>
                </div>
                <div><input type="submit" id="downloadprofile" value="Download" style="width:125px;"></input></div>
            </div>
            </form>
        </div>
        <div style="clear:both"></div>
    </div>
    <div id="gridboundsdiv">
        <div style="clear:both"></div>
        <div class="boundscontainer">
            <div class="title">GMRT MapTool</div>
            <div class="instructions">Select a region directly from the map, or modify fields below. Units are in EPSG:3995.</div>
            <form id="cmg" method="get" action="/tools/cmg_results.php" name="cmg">

            <div id="bounds">
                <div class="nsbounds">
                    <input type="text" placeholder="North" id="north" name="north" class="get wesnvalue" />
                </div>
                <div class="webounds"style="">
                    <input type="text" placeholder="West" id="west" name="west" class="get wesnvalue" /><span class="wespacer">
                    </span><input type="text" placeholder="East" id="east" name="east" class="get wesnvalue" />
                </div>
                <div class="nsbounds">
                    <input type="text" placeholder="South" id="south" name="south" class="get wesnvalue" >
                </div>
                <div style="clear:both"></div>
                <div id="downselected">Create Grid File</div>
            </div>
        </form>
        </div>
        <!--<div id="img">
            <div id="imgboxwrapper">
                <a id="downimg" href="#" title="Download This Image">
                    <img src="/images/downloadbuttonblue.png"/><span>Download Image</span>
                </a>
                <div id="imgbox">
                    <div>
                        <a class="lightbox" href="/tools/GMRTMapTool/world.jpeg">
                            <img id="gridimg" src="/tools/GMRTMapTool/world.jpeg" alt="Map View" title="Click to Expand"/>
                        </a>
                    </div>
                </div>
            </div>
        </div>-->
        <div class="gmrtlink">
            <a href="/portals/gmrt/about.php" target="_blank">About GMRT</a>
        </div>
        <div style="clear:both"></div>
    </div>
    
</div>
</body>
</html>
<?php





function maintenance_page() {
	global $_SERVER;
	$root = $_SERVER['DOCUMENT_ROOT'];
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<title>IEDA: Marine Geoscience Data System - Maintenance Underway</title>
	<meta name="Description" content="The Marine Geoscience Data System provides data discovery and access services for marine geoscience data collected throughout the global oceans." />
<?php include $root.'/inc/doc_head.php'; ?>
</head>
<body>
	<div id="wrapper">
	<?php include $root.'/inc/header_menu.php'; ?>
		<div id="content">
			<h3>Site Maintenance Underway</h3>
			<div style="min-height:150px;">Due to site maintenance, the GMRT MapTool and Grid/ImageServer services are currently down. Please try again later.</div>
			<div style="clear:both"></div>
<?php include $root.'/inc/footer.php'; ?>
	  </div>
	</div>
</body>
</html>
<?php 
	exit;
}
