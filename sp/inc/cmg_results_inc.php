<?php

	function fSize($b) {
		$sizes = array('B','KB','MB','GB','TB');
		$suffix = array_shift($sizes);
		while($sizes && $b > 1024) {
			$b/=1024;
			$suffix = array_shift($sizes);
		}
		return sprintf("%.0f%s",$b,$suffix);
	}
	$root = $_SERVER['DOCUMENT_ROOT'];

	include("$root/tools/GridServer.class.php");
	include("$root/tools/GridServerPolar.class.php");
//	include "$root/portals/gmrt/gmrt_version.php";

	$west = (double) $_GET['west'];
	$east = (double) $_GET['east'];
	$south = (double) $_GET['south'];
	$north = (double) $_GET['north'];
	
	try {
		//Variable validation is performed in the GridServer class
		$gridserv = new GridServerPolar($_GET['west'], $_GET['east'], $_GET['south'], $_GET['north'],SOUTHPOLAR);
		$gridInfo = $gridserv->getMetadataArray();
		$bounds = $gridInfo['grid_bounds'];
		$default_metadata = $gridserv->getMetadata("html");
		$gridserv->setBoundsKeyword($_GET['west'], $_GET['east'], $_GET['south'], $_GET['north'], "med");
		$gridInfoMed  = $gridserv->getMetadataArray();
		$gridserv->setBoundsKeyword($_GET['west'], $_GET['east'], $_GET['south'], $_GET['north'], "high");
		$gridInfoHigh = $gridserv->getMetadataArray();
		$gridserv->setBoundsKeyword($_GET['west'], $_GET['east'], $_GET['south'], $_GET['north'], "max");
		$gridInfo100  = $gridserv->getMetadataArray();
        if ( $gridInfoHigh['meters_per_node'] < $gridInfo100['meters_per_node']) {
            $gridInfo100=$gridInfoHigh;
        }
		$gridserv->setBoundsKeyword($_GET['west'], $_GET['east'], $_GET['south'], $_GET['north'], "default");
	} catch (GridServerException $e) {
		$errorarray = $e->errorarray();
		errorMessage($errorarray['message']);
	} catch (Exception $e) {
		errorMessage('An error has occurred.');
	}

?>

<form id="gridserverform" action="/tools/GridServer.php" method="get">
    <h4>Citation Information</h4>
    <div id="gmrtcitation">
        Ryan, W.B.F., S.M. Carbotte, J.O. Coplan, S. O'Hara, A. Melkonian,
        R. Arko, R.A. Weissel, V. Ferrini, A. Goodwillie, F. Nitsche,
        J. Bonczkowski, and R. Zemsky (2009), Global Multi-Resolution
        Topography synthesis, Geochem. Geophys. Geosyst., 10, Q03014, doi:
        <a href="http://dx.doi.org/10.1029/2008GC002332">10.1029/2008GC002332</a>
    </div>
    <div style="clear:both"></div>
    <div id="gridform">
        <input type="hidden" name="west" value="<?=$west?>"/>
        <input type="hidden" name="east" value="<?=$east?>"/>
        <input type="hidden" name="south" value="<?=$south?>"/>
        <input type="hidden" name="north" value="<?=$north?>"/>
        <input type="hidden" name="maptool" value="1"/>
        <input type="hidden" name="projection" value="south"/>
        <input type="hidden" name="format" value="geotiff"/>
        <input id="token" name="token" type="hidden" data-uuid="<?=  uniqid() ?>" value="" />
        <div class="divrow">
            <h6>File Format</h6>
            <div>Polar Stereographic projections currently only support GeoTIFF format</div>
        </div>
        <div class="divrow">
            <h6>Mask</h6>
            <div><input class="lmask" type="radio" name="layer" value="topo" checked /> Unmasked</div>
            <div><input class="lmask" type="radio" name="layer" value="topo-mask" /> Masked</div>
            <div id="mask-desc">
                <div style="display:block;" id="topo-desc">
                    Unmasked grids are filled with
                    <a href="http://gebco.net">GEBCO-2014</a> where high-resolution
                    data do not exist in the ocean.
                </div>
                <div style="display:none;" id="topo-mask-desc">
                    Masked grids contain only high-resolution data (~100 m) in the ocean, NaNs
                    elsewhere.
                </div>
            </div>
        </div>
        <div class="divrow">
            <h6>Grid Resolution</h6>
            <div style="color:gray;font-size:1em;font-style:italic;margin-left:5px;">dependent on size of selected area</div>
            <div>
                <input type="radio" name="resolution" value="default" checked /> <b>Low</b> <?= sprintf("%d",$gridInfo['meters_per_node']) ?> m/node <?= warning100($gridInfo['meters_per_node'])?>
                <div class="file-sizes" style="margin-left:2em;font-size:small">File size: <span class="sizes" id="size-default">~<?=fSize($gridInfo['file_size_netcdf'])?></span></div>
            </div>
            <div>
                <input type="radio" name="resolution" value="med" /> <b>Medium</b> <?= sprintf("%d",$gridInfoMed['meters_per_node']) ?> m/node <?= warning100($gridInfoMed['meters_per_node'])?>
                <div class="file-sizes" style="margin-left:2em;font-size:small">File size: <span class="sizes" id="size-med">~<?=fSize($gridInfoMed['file_size_netcdf'])?></span></div>
            </div>
            <div>
                <input type="radio" name="resolution" value="high" /> <b>High</b> <?= sprintf("%d",$gridInfoHigh['meters_per_node']) ?> m/node <?= warning100($gridInfoHigh['meters_per_node'])?>
                <div class="file-sizes" style="margin-left:2em;font-size:small">File size: <span class="sizes" id="size-high">~<?=fSize($gridInfoHigh['file_size_netcdf'])?></span></div>
            </div>
            <div>
                <input type="radio" name="resolution" value="<?=($gridInfoHigh['meters_per_node']==$gridInfo100['meters_per_node'])?"high":"max"?>" /> <b>Maximum</b> <?= sprintf("%d",$gridInfo100['meters_per_node']) ?> m/node <?= warning100($gridInfo100['meters_per_node'])?>
                <div class="file-sizes" style="margin-left:2em;font-size:small">File size: <span class="sizes" id="size-high">~<?=fSize($gridInfo100['file_size_netcdf'])?></span></div>
            </div>
        </div>
    </div>

    <div id="gridinfowrapper">
        <div id="gridinfo">
            <?= $default_metadata ?>
            <div style="clear:both"></div>
        </div>
        <!--<div id="subbutton">
            <input type="submit" value="Download Grid"/>
        </div>-->
    </div>
</form>
<?php

//If an error occurs, this returns a formatted error page
function errorMessage($error) {
?>
			<div style="height:100px">
			<?= $error ?>
			</div>
<?php
	exit;
}

function warning100($val) {
    return ($val<=100)?"<span style=\"color:gray\">(May be supersampled)</span>":"";
}