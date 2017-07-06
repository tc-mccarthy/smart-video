/*
	smartVideo jQuery plugin
	Author: TC McCarthy
	An HTML5 video player with chapter abilities, iOS enhancements and finite control for the average user/dev
*/

String.prototype.compile = function (obj) {
	var str = this;

	return str.replace(/[{]([^}]+)[}]/g, function (matches, p1) {
		return obj[p1];
	});
};

(function ($) {
	$.fn.smartVideo = function (options) {
		var o = Object.assign({
				autoSize: true,
				chapters: [],
				onPlay: false,
				onPause: false,
				onComplete: false,
			}, options),
			_this = this,
			video = _this[0],
			container,
			ele,
			ops = {
				ready: false,
				init: function () {
					//make this a smart video
					_this.wrap("<div class='smart-video'></div>");

					//set new wrapper as 'container'
					container = _this.closest(".smart-video");
					container.prepend("<i class='fa fa-spin fa-cog loader'></i>");


					/* REQUIRED FOR CUSTOM CONTROLS */
					//disable any active controls
					_this.removeProp("controls");
					_this.prop("preload", "metadata");

					//makes sure this player is well-leveraged on iPhone
					_this.attr("playsinline", true);

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

						if (ops.ready) {
							video.play();
						}
					});

					//pause button bind
					ele.pause.on("click", function (e) {
						e.preventDefault();

						if (ops.ready) {
							video.pause();
						}
					});

					//when all of the video metadata is there, set the player up
					_this.on("loadedmetadata", function () {
						var wait = 0;
						//set up chapter markers
						$.each(o.chapters, function () {
							var chapter = this,
								duration = video.duration,
								pct = Math.floor((chapter.seconds / duration) * 100);

							ops.getFrame(chapter.seconds, function (thumbnail) {
								ele.progressBar.append("<a class='chapter' style='left: {pct}%' data-seconds='{seconds}'><div class='preview'><img src='{thumbnail}' /></div></a>".compile({ pct: pct, seconds: chapter.seconds, thumbnail: thumbnail }));
							});
						});

						video.currentTime = 0;
						ops.ready = true;
						container.addClass("ready");
					});

					//event handling for video start
					_this.on("play playing", function (e) {
						ele.play.addClass("hide");
						ele.pause.removeClass("hide");

						if (typeof o.onPlay === "function") {
							o.onPlay(e);
						}
					});

					//event handling for video pause
					_this.on("pause", function (e) {
						ele.play.removeClass("hide");
						ele.pause.addClass("hide");

						if (typeof o.onPause === "function") {
							o.onPause(e);
						}
					});

					//event handling for progress
					_this.on("timeupdate", function (e) {
						if (ops.ready) {
							var currentTime = video.currentTime,
								duration = video.duration,
								pct = Math.floor((currentTime / duration) * 100);

							//pct is floored to that updates in the progress bar aren't as sporadic
							ele.progress.width(pct + "%");
						}
					});

					//event handling for completion
					_this.on("ended", function (e) {
						if (typeof o.onComplete === "function") {
							o.onComplete(e);
						}
					});

					//seeking
					ele.progressBar.on("click mousedown mouseup", function (e) {
						e.preventDefault();

						//borrowed from https://stackoverflow.com/a/41953905
						var offset = $(this).offset(),
							left = (e.pageX - offset.left),
							totalWidth = $(this).width(),
							percentage = (left / totalWidth),
							vidTime = video.duration * percentage;

						video.currentTime = vidTime;
					});
				},

				getFrame: function (time, cb) {
					var scale = 0.25,
						canvas = document.createElement("canvas"),
						clone = $(video).clone(false, false);

					clone.prop("preload", "metadata");

					clone.on("loadedmetadata", function () {
						clone.on("seeked", function () {
							canvas.width = video.videoWidth * scale;
							canvas.height = video.videoHeight * scale;
							console.log(clone[0].currentTime);
							canvas.getContext('2d')
								.drawImage(clone[0], 0, 0, canvas.width, canvas.height);

							if (typeof cb === "function") {
								clone.remove();
								cb(canvas.toDataURL());
							}
						});

						clone[0].currentTime = time;
						clone[0].pause();
					});
				}
			};

		ops.init();

	};
})(jQuery);
