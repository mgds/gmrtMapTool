# gmrtMapTool

The GMRT MapTool provides access to the Global Multi-Resolution Topography (GMRT) Synthesis which is maintained as part of the IEDA Marine Geoscience Data System ([MGDS](http://www.marine-geo.org)).  GMRT provides access gridded multibeam data acquired primarily with the US Academic research fleet throughout the global oceans. Multibeam data are processed, curated and synthesized into GMRT at at least 100-m resolution and are seamlessly blended with additional elevation sources including the GEBCO 2014 global compilation, gridded data sets from individual researchers, and global elevation data from NASA. GMRT MapTool interface relies on [web services](http://www.marine-geo.org/tools/web_services.php#gmrt), but GMRT can also be accessed through the freely available java application [GeoMapApp](http://www.geomapapp.org).

## Releases and Downloads

+ 3.0.0 - Released October 31, 2017. Initial public release of GMRT MapTool code.  Coincides with major update to tool to enable access to South Polar and North Polar GMRT tilesets.

## Demo

Check out the GMRT MapTool in action at: 
+ http://www.marine-geo.org/tools/GMRTMapTool (Mercator)
+ http://www.marine-geo.org/tools/GMRTMapTool/sp (South Polar)
+ http://www.marine-geo.org/tools/GMRTMapTool/np (North Polar)


## Features

+ Mercator projection uses Google Maps as the map client, Polar versions use Open Layers
+ Leverages the Global Multi-Resolution Topography ([GMRT](http://gmrt.marine-geo.org)) Basemap and serveral [web services](http://www.marine-geo.org/tools/web_services.php#gmrt)

## Requirements

+ Google Maps javascript interface
+ OpenLayers
+ jQuery 1.9.1

## Installation



## Issues

Find a bug or want to request a new feature? Please let us know by submitting an [issue](https://github.com/mgds/GMRTMapTool/issues).

## Licensing

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
