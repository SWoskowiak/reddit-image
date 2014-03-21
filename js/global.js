// jQuery
$(function () {
	var IMAGES = [];
	var CURRENT = 1;
	var LOADED = 0;
	var MAX = 0;
	var FORMATS = 'jpg jpeg gif png';
	var URLS = [];
	var SUBS = [];
	var ADDITIONAL = [];
	var INTERVAL = 0;
	var MASTER_CLONE = $('.image_container').clone(true);
	
	$('#image_body').append(MASTER_CLONE);
	
	// Build target subreddits
	var targets = $('#targets').data('subreddits').split('.');
	console.log(targets);
	$.each(targets, function(key, val) {
		URLS.push('http://www.reddit.com/r/' + val + '/.json?limit=100&jsonp=?');
	});
	
	SUBS = $('#targets').data('subreddits').split('.');
	
	// Validate url
	function valid_image(url) {
		var end = url.split('/').slice(-1)[0];
		if (end.indexOf('.') !== -1) {
			if (FORMATS.indexOf(end.split('.')[1]) == -1) return false;
		} else {
			return false;
		}
		return true;
	}
	
	// Recursive loader for jsonp call chaining
	function recursive_load(sub, cap, after) {
		// Limit ourselves
		if (cap === 3 || after === null) {
			$('body').trigger('loaded');
			console.log('loaded');
			return false;
		}
		// Build target url
		var suffix = cap === 0 ? '/.json?limit=100&jsonp=?' : '/.json?limit=100&after='+after+'&jsonp=?';
		var url = 'http://www.reddit.com/r/' + sub + suffix;
		$.getJSON(url).done( function(data) {
			// See if we can grab more results
			var next = data.data.after;
			// Step over each JSON element and add the target to the list
			$.each(data.data.children, function(key, val) {
				// If we are the final object, begin queue for next set of items
				if (key == data.data.children.length - 1) {recursive_load(sub, ++cap, next);}
				// Break out of invalid URLS
				if (!valid_image(val.data.url)) return true;
				IMAGES.push({'url':val.data.url, 'title':val.data.title});
			});
		});
	}
	
	function play() {
		INTERVAL = setInterval( function() {cycle_image(1, 2000);}, 10000);
	}
	
	// Initial call
	recursive_load(SUBS.pop(), 0, '');

	// Images loaded
	$('body').on('loaded', function() {
		if (SUBS.length >= 1) {
			recursive_load(SUBS.pop(), 0, '');
		} else {
			MAX = IMAGES.length;
			shuffle_array(IMAGES);
			$('.image_container img').attr('src', IMAGES[0].url);
			$('span').text(IMAGES[0].title);
			play();
		}
	});
	
	// Cycle visible image
	function cycle_image(direction, speed) {
		fade_duration = speed ? speed : 2000;
		if (direction == 1) {
			// Iterate
			CURRENT++;
			if (CURRENT > MAX) CURRENT = 0;
		} else {
			CURRENT--;
			if (CURRENT < 0) CURRENT = MAX;
		}
		// Prep next image
		var clone = MASTER_CLONE.clone(true).hide().data('title', IMAGES[CURRENT].title);
		clone.find('img').attr('src', IMAGES[CURRENT].url);
		// Fade out existing image
		var self = $('.image_container').fadeOut({ queue : false, duration : fade_duration, complete : function() {
			self.remove();
		}});
		// Append clone
		$('#image_body').append(clone);
		// Set title
		$('#title span').text(clone.data('title'));
		clone.fadeIn(fade_duration).data('title');
	}
	
	// Prev/ Next image
	$('#prev, #next').click( function() {
		clearInterval(INTERVAL);
		$(this).data('target') === 'next'? cycle_image(1, 1) : cycle_image(0, 1);
		play();
		return false;
	});
	
	// Pause/Resume
	$('#image_body img').click( function() {
		if ($(this).hasClass('paused')) {
			$(this).removeClass('paused');
			play();
		} else {
			$(this).addClass('paused');
			clearInterval(INTERVAL);
		}
	});
	
	// Randomize images
	function shuffle_array(arr) {
		var i = arr.length, j, tempi, tempj;
		if ( i === 0 ) return false;
		while ( --i ) {
			j = Math.floor( Math.random() * ( i + 1 ) );
			tempi = arr[i];
			tempj = arr[j];
			arr[i] = tempj;
			arr[j] = tempi;
		}
	}
});