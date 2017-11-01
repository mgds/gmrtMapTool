function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if ( sParameterName[0] == sParam ) {
            return sParameterName[1];
        }
    }
    return false;
}
function ImgUrl(w,e,s,n,download) {
    var params = {
        "west": w,
        "east": e,
        "south": s,
        "north": n
    };
    if (download) params["download"] = "1";
    return "/tools/gmrt_image_1.php?"+$.param(params);
}
function wesn_update() {
    var str = $('#cmg input').serialize();
    var wesn = $('#west,#east,#south,#north').serialize();
    /*var masked = (mgdsMap.map.getMapTypeId()=='Bathymetry')?0:1;
    $('#imgbox img').attr('src','/tools/gmrt_image_1.php?maptool=1&'+wesn+'&mask='+masked);
    $('#downimg').attr('href','/tools/gmrt_image_1.php?maptool=1&'+wesn+'&mask='+masked+'&download=1')
    $('#imgbox a')
        .attr('href','/tools/gmrt_image_1.php?'+wesn+'&mask='+masked)
        .attr('title', '<a href="/tools/gmrt_image_1.php?maptool=1&'+wesn.replace(/&/g,"&amp;")+'&amp;mask='+masked+'&download=1">Download This Image</a>');
    $('.lightbox').lightBox();*/
}
function randomString() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 8;
    var randomstring = '';
    for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
}

//google.load("visualization", "1", {packages: ["corechart","table","annotatedtimeline"] });

var west = (GetURLParameter('west')!==false)?GetURLParameter('west'):-8200000;
var east = (GetURLParameter('east')!==false)?GetURLParameter('east'):8200000;
var south = (GetURLParameter('south')!==false)?GetURLParameter('south'):-8200000;
var north = (GetURLParameter('north')!==false)?GetURLParameter('north'):8200000;
var mgdsMap;
var drawing;

var fileDownloadCheckTimer;
$(document).ready(function(){
    //document.cmg.reset()
    mgdsMap = new MGDSMapClient();
    mgdsMap.mapInit();
    
    document.addEventListener('polygon-change', function(e) {

        var polygonToString = function(coords, sep) {
            if (!sep) { sep = ','; }
            return coords.map(function(pt) {
            return "{0} {1}".format(pt[0], pt[1]);
            }).join(sep);
        }
        var polygon = e.detail;
        var wesn = mgdsMap.getContainingBBOX(polygon);
        var wesn_str = "west={0}&east={1}&south={2}&north={3}".format(wesn.w, wesn.e, wesn.s, wesn.n);
        $("#west").val(wesn.w);
        $("#east").val(wesn.e);
        $("#south").val(wesn.s);
        $("#north").val(wesn.n);
    });
    var i = 0;
    
    
    /*var controlDiv = document.createElement("div");
    controlDiv.className = "boundscontrol";
    controlDiv.innerHTML = '<div class="tabwrapper"><div class="tabboxbounds tabbox">&gt;</div></div>';
    var lDiv = document.createElement("div");
    lDiv.className = "boundsbox";
    controlDiv.appendChild(lDiv);
    mgdsMap.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv);*/
    
    $(document).on('click','#downselected',function(){
        if ($.isNumeric($('#west').val())) {
            var wesn = $('#west,#east,#south,#north').serialize();
            $.ajax({
                type: "GET",
                url: 'inc/cmg_results_inc.php',
                data: wesn,
                success: function(msg){
                    $("#dialog").dialog({ title: "Grid Download" }).html(msg).dialog("open");
                    $(".lmask").on('click',function(){
                       $("#topo-desc,#topo-mask-desc").toggle(); 
                    });
                    $("#token").val($("#token").attr("data-uuid")+randomString());
                    $('#gridserverform input').on('change',function(){
                        var self = $(this);
                        $("#token").val($("#token").attr("data-uuid")+randomString());
                        if ($(this).attr('name')=='format') {
                            if ($(this).val() != 'esriascii')
                                $(".file-sizes").show();
                            else
                                $(".file-sizes").hide();
                        }
                        str = $('#gridserverform input').serialize();
                        $.ajax({
                            type: "GET",
                            url: 'inc/gridmetadata.php',
                            data: str,
                            success: function(msg){
                                $('#gridinfo').html(msg+"<div style=\"clear:both\"></div>");
                                if ($("#gridserverform input[name='format']:checked").val()=='esriascii') {
                                    $("#exactfilesize").hide();
                                }
                                return false;
                            }
                        });
                    });

                },
                error: function(){ // did not insert into database, pass all parameters in url
                    alert("Failed");
                }
            });
        }
        return(false);
    });
    $("#dialog").dialog({
        autoOpen: false,
        height: 520,
        width: 700,
        modal: true,
        buttons: [
            {
                text: "Download Grid",
                priority: 'primary',
                "class": "dgridbutton",
                click: function() {
                        var token = $("#token").val();
                        $( this ).dialog( "close" );
                        $("#mapcwrapper").prepend('<div id="mapcwait" style="background-color:  rgba(100, 100, 100, 0.75);position: fixed;width:100%;height:100%;z-index: 1000;"><div style="position:absolute;top:50%;width:100%"><div style="margin-left:auto;margin-right:auto;margin-top:-50px;width:300px;text-align:center;color:black;"><img src="/imgs/ajax-loader.gif"><br>Large grids may take several minutes to build</div></div></div>')
                        fileDownloadCheckTimer = window.setInterval(function () {
                            var cookieValue = $.cookie('fileDownloadToken');
                            console.log(cookieValue);
                            if (cookieValue == token) {
                                window.clearInterval(fileDownloadCheckTimer);
                                $.removeCookie('fileDownloadToken');
                                $("#mapcwait").remove();
                            }
                        }, 1000);
                        $('#gridserverform').submit();

                }
            },    
            {
                text: "Cancel",
                priority: 'secondary',
                click: function() {
                    $( this ).dialog( "close" );
                }
            }
        ]
    });
    $(document).on('focus',"#west,#east,#south,#north",function(){
        $(this).data('oldVal',$(this).val());
    });
    $(document).on('change',"#west,#east,#south,#north",function(){
        var opts = drawing.rectoptions;
        $(this).data('oldVal',$(this).val());
        
        /*opts['bounds'] = new google.maps.LatLngBounds(
            new google.maps.LatLng($("#south").val(), $("#west").val()),
            new google.maps.LatLng($("#north").val(), $("#east").val())
        );
        drawing.new_rectangle(new google.maps.Rectangle(opts));
        drawing.overlay.setMap(drawing.map);
        google.maps.event.clearInstanceListeners(drawing.overlay);
        google.maps.event.addListener(drawing.overlay, 'bounds_changed', function(event){drawing.rectools();});
        wesn_update();*/
        return false;
    });
    $(document).on('click',"#gmrtmask",function(){
        wesn_update();
    });
    mgdsMap.map.once('postrender', function(e){
        var bd = new BoundsDiv();
        $('#tcontent').append(bd.getElement());
        $("#west").val(west);
        $("#east").val(east);
        $("#south").val(south);
        $("#north").val(north);
        $("#downimg").attr('href',ImgUrl(west,east,south,north,true));
        $("#gridimg").attr('src',ImgUrl(west,east,south,north,false));
        $(".lightbox")
            .attr('href',ImgUrl(west,east,south,north,false))
            .attr('title','<a href=&quot;'+ImgUrl(west,east,south,north,true)+'&quot;>Download This Image</a>');
    
        if (
            $.isNumeric(GetURLParameter('west'))
            && $.isNumeric(GetURLParameter('east'))
            && $.isNumeric(GetURLParameter('south'))
            && $.isNumeric(GetURLParameter('north'))
        ) {
            drawing.rectangle_select( [ west , east , south , north ] );
        }
        
        wesn_update();
    });
    /*google.maps.event.addListenerOnce(mgdsMap.map, 'idle', function(){
        $("#gridboundsdiv").prependTo('.boundsbox').show();
        $("#west").val(west);
        $("#east").val(east);
        $("#south").val(south);
        $("#north").val(north);
        $("#downimg").attr('href',ImgUrl(west,east,south,north,true));
        $("#gridimg").attr('src',ImgUrl(west,east,south,north,false));
        $(".lightbox")
            .attr('href',ImgUrl(west,east,south,north,false))
            .attr('title','<a href=&quot;'+ImgUrl(west,east,south,north,true)+'&quot;>Download This Image</a>');
    
        if (
            $.isNumeric(GetURLParameter('west'))
            && $.isNumeric(GetURLParameter('east'))
            && $.isNumeric(GetURLParameter('south'))
            && $.isNumeric(GetURLParameter('north'))
        ) {
            drawing.rectangle_select( [ west , east , south , north ] );
        }
        
        wesn_update();
    });
    google.maps.event.addListener(drawing.drawingManager, 'drawingmode_changed', function(){
        var mode = drawing.drawingManager.getDrawingMode();
        console.log( $(".boundsbox div"));
        if (mode) $(".boundsbox #gridboundsdiv,.boundsbox #profilediv").prependTo($("#contentboxes"));
        if (mode == google.maps.drawing.OverlayType.RECTANGLE) {
            $("#gridboundsdiv").prependTo($(".boundsbox"));
        } else if (mode == google.maps.drawing.OverlayType.POLYLINE) {
            $("#profilediv").prependTo($(".boundsbox"));           
        }
    });*/
    var chart;
    $(document).on("change","#boundspath",function(){
        /*if ($("#boundspath").val()) {
        $.ajax({
            type: "GET",
            dataType: "json",
            url: '/services/profileserver.php',
            beforeSend: function() {
                $('#profile_plot').html('<i class="fa fa-spinner fa-pulse fa-3x"></i>');
                chart = null;
                $("#downloadprofile").hide();
            },
            data: {
                "boundspath" : $("#boundspath").val()
            }
        }).done(function(data){
            var arr = [["Distance (m)","Elevation (m)"]];
            for (var i=0;i<data.length;i++) {
                arr.push([data[i][3],data[i][2]])
            }
            var cdata = google.visualization.arrayToDataTable(arr);
            var options = {
                title: 'Profile View',
                hAxis: {title: 'Distance (m)',textPosition: 'none'},
                vAxis: {title: 'Elevation (m)'},
                legend: 'none'
            };
            chart= new google.visualization.AreaChart($('#profile_plot')[0]);
            chart.draw(cdata,options);
            $("#downloadprofile").show();
        });
    }*/
    });
    
});