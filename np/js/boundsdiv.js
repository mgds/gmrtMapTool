function BoundsDiv() {

    var self = this;

    var wrapper = $('<div class="boundscontrol"/>');
    var tab = $('<div class="bounds-control-tab"> &gt; </div>');

    var main_contents = $('<div class="boundsbox"></div>');

    wrapper.append(tab);
    wrapper.append(main_contents);
    
    var bounds = $('#gridboundsdiv');

    this.wrapper = wrapper[0];
    this.bounds = bounds[0];
    this.main_contents = main_contents[0];

    main_contents.append(bounds);
    
    tab.on('click', function(e) {
	if (main_contents.is(":visible")) {
	    main_contents.hide();
	    tab.text("<");
	} else {
	    main_contents.show();
	    tab.text(">");
	}
    });


    /*main_contents.on('click', '.map-control-button', function() {
	if ($(this).hasClass('on')) {
	    $(this).removeClass('on');
	    var evt = new Event('turn-off');
	    this.dispatchEvent(evt);
	} else {
	    $(this).addClass('on');
	    var evt = new Event('turn-on');
	    this.dispatchEvent(evt);
	}
    });
*/
   
}

BoundsDiv.prototype.getElement = function() {
    return this.wrapper;
};
