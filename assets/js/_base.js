(function ($) {
	$.fn.smartVideo = function (options) {
		var o = Object.assign({
				autoSize: true
			}, options),
			_this = this,
			video = _this[0],
			container,
			ele,
			ops = {
				init: function () {
					//make this a smart video
					_this.wrap("<div class='smart-video'></div>");

					//set new wrapper as 'container'
					container = _this.closest(".smart-video");


					/* REQUIRED FOR CUSTOM CONTROLS */
					//disable any active controls
					_this.removeProp("controls");

					//disable the context menu
					_this.attr("oncontextmenu", "return false;");

					if (o.autoSize) {
						//resize the video to be 16x9
						ops.resize();
					}

					_this.after("<div class='control-bar'> <div class='controls'> <a class='fa fa-play'></a> <a class='fa fa-pause hide'></a> </div> <div class='progress'> <div class='inner'></div> </div> <div class='clearfix'></div> </div>");

					ele = {
						play: container.find(".fa-play"),
						pause: container.find(".fa-pause"),
						progressBar: container.find(".progress"),
						progress: container.find(".progress .inner")
					};

					ops.binds();
				},
				resize: function () {
					var width = _this.width(),
						height = (width * 0.5625);

					_this.height(height);
				},

				binds: function () {
					if (o.autoSize) {
						//bind the video resize to  window resize
						$(window).resize(ops.resize);
					}

					//play button bind
					ele.play.on("click", function (e) {
						e.preventDefault();
						video.play();
					});

					//pause button bind
					ele.pause.on("click", function (e) {
						e.preventDefault();
						video.pause();
					});

					//event handling for video start
					_this.on("play playing", function () {
						ele.play.addClass("hide");
						ele.pause.removeClass("hide");
					});

					//event handling for video pause
					_this.on("pause", function () {
						ele.play.removeClass("hide");
						ele.pause.addClass("hide");
					});

					//event handling for progress
					_this.on("timeupdate", function (e) {
						var currentTime = video.currentTime,
							duration = video.duration,
							pct = Math.floor((currentTime / duration) * 100);

						//pct is floored to that updates in the progress bar aren't as sporadic
						ele.progress.width(pct + "%");
					});

					//seeking
					ele.progressBar.on("click mousedown mouseup", function (e) {
						e.preventDefault();

						console.log(e);

						//borrowed from https://stackoverflow.com/a/41953905
						var offset = $(this).offset(),
							left = (e.pageX - offset.left),
							totalWidth = $(this).width(),
							percentage = (left / totalWidth),
							vidTime = video.duration * percentage;

						video.currentTime = vidTime;
					});
				}
			};

		ops.init();

	};
})(jQuery);
