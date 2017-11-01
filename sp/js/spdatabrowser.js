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

});
