<?php
	$root = $_SERVER['DOCUMENT_ROOT'];

	include("$root/tools/GridServer.class.php");
	include("$root/tools/GridServerPolar.class.php");
	
	try {
		//Variable validation is performed in the GridServer class
		$gridserv = new GridServerPolar($_GET['west'], $_GET['east'], $_GET['south'], $_GET['north'],NORTHPOLAR,$_GET['resolution']);
		$gridInfo = $gridserv->getMetadataArray();
		$bounds = $gridInfo['grid_bounds'];
	} catch (GridServerException $e) {
		$errorarray = $e->errorarray();
		errorPage($errorarray['message']);
	} catch (Exception $e) {
		errorPage('An error has occurred.');
	}
	
	echo $gridserv->getMetadata("html");
