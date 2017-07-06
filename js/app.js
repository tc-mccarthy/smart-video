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
				chapters: [], //array of objects structured like {seconds: CUE POINT, title: CHAPTER TITLE, description: CHAPTER DESCRIPTION, thumbnail: THUMBNAIL. SCREEN CAP USED IF NOT PROVIDED}
				onPlay: false, //callback for play event
				onPause: false, //callback for pause event
				onComplete: false, //callback for complete event
				mode: 'embed', //can be embed | fullscreen
				hideControls: false,
				hideChapterMenu: false
			}, options),
			_this = this,
			video = _this[0],
			container,
			ele,
			ops = {
				ready: false,
				init: function () {
					//make this a smart video
					_this.wrap("<div class='smart-video {mode}'></div>".compile({ mode: o.mode }));

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

					_this.after("<div class='control-bar'> <div class='controls'> <a class='fa fa-play'></a> <a class='fa fa-pause hide'></a> <a class='fa fa-volume-up'></a> <a class='fa fa-arrows-alt'></a> </div> <div class='progress'> <div class='inner'></div> </div> <div class='clearfix'></div> </div>");
					_this.after("<div class='chapter-menu'></div>");

					if (o.mode === "fullscreen") {
						var chapterToggle = "<a class='fa fa-list-ul toggle' data-target='.chapter-menu' data-icon='fa-list-ul' href='#'></a>",
							controlsToggle = "<a class='fa fa-toggle-off toggle' data-target='.control-bar' data-icon='fa-toggle-off' href='#'></a>";

						if (!o.hideChapterMenu) {
							container.find(".chapter-menu").addClass("active");
							chapterToggle = "<a class='fa fa-close toggle' data-target='.chapter-menu' data-icon='fa-list-ul' href='#'></a>";
						}

						if (!o.hideControls) {
							container.find(".control-bar").addClass("active");
							controlsToggle = "<a class='fa fa-close toggle' data-target='.control-bar' data-icon='fa-toggle-off' href='#'></a>";
						}

						_this.after(chapterToggle);
						_this.after(controlsToggle);
					}


					ele = {
						play: container.find(".fa-play"),
						pause: container.find(".fa-pause"),
						progressBar: container.find(".progress"),
						progress: container.find(".progress .inner"),
						chapterMenu: container.find(".chapter-menu")
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

					//firefox compatible method to begin building the player when all of the video metadata is there
					if (video.readyState >= 2) {
						ops.playerSetup();
					} else {
						//add a listener if the video isn't ready yet
						_this.on("loadedmetadata", ops.playerSetup);
					}

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
								pct = Math.floor((currentTime / duration) * 100),
								chapterSelector = ele.chapterMenu.find("[data-seconds='{seconds}']".compile({ seconds: Math.floor(currentTime) }));


							//pct is floored to that updates in the progress bar aren't as sporadic
							ele.progress.width(pct + "%");

							//highlight chapter
							if (chapterSelector.length > 0) {
								ele.chapterMenu.find("a.chapter").removeClass("active");
								chapterSelector.addClass("active");
							}
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

					//chapter menu selection
					$("body").on("click", ".chapter-menu > a.chapter", function (e) {
						e.preventDefault();

						var ele = $(this),
							seconds = ele.data("seconds"),
							container = ele.closest(".smart-video"),
							video = container.find("video")[0];

						video.currentTime = seconds;
						video.play();
					});

					$("body").on("click", ".toggle", function (e) {
						e.preventDefault();

						var ele = $(this),
							container = ele.closest(".smart-video"),
							video = container.find("video")[0],
							targetSelector = ele.data("target"),
							icon = ele.data('icon'),
							target = container.find(targetSelector);

						console.log("click");

						target.toggleClass("active");

						if (target.hasClass("active")) {
							ele.removeAttr("class").addClass("toggle fa fa-close");
						} else {
							ele.removeAttr("class").addClass("toggle fa " + icon);
						}
					});
				},



				getFrame: function (time, cb) {
					var scale = 0.25,
						canvas = document.createElement("canvas"),
						clone = $(video).clone(false, false),
						attempts = 0;

					// clone.appendTo("body");
					// $(canvas).appendTo("body");

					// clone.prop("preload", "metadata");

					clone.on("loadedmetadata", function () {
						canvas.width = clone[0].videoWidth * scale;
						canvas.height = clone[0].videoHeight * scale;
						clone[0].currentTime = time;
					});

					clone.on("seeked", function () {
						canvas.getContext('2d')
							.drawImage(clone[0], 0, 0, canvas.width, canvas.height);

						//hack to fix frame grab on iOS
						if (attempts < 2) {
							attempts++;
							clone[0].currentTime = time;
						} else {
							clone.remove();
							if (typeof cb === "function") {
								cb(canvas.toDataURL());
							}
						}
					});
				},

				playerSetup: function () {
					var wait = 0;
					//set up chapter markers
					$.each(o.chapters, function () {
						var chapter = this,
							duration = video.duration,
							pct = Math.floor((chapter.seconds / duration) * 100);

						ele.chapterMenu.append("<a class='chapter' href='#'></a>");

						var chapterMenuEntry = ele.chapterMenu.find(".chapter").eq(-1);

						ops.getFrame(chapter.seconds, function (thumbnail) {
							ele.progressBar.append("<a class='chapter' style='left: {pct}%' data-seconds='{seconds}'><div class='preview'><img src='{thumbnail}' /></div></a>".compile({ pct: pct, seconds: chapter.seconds, thumbnail: thumbnail }));
							chapterMenuEntry.attr("data-seconds", chapter.seconds).html("<div class='preview'><img src='{thumbnail}' /></div><div class='headline'>{title}</div><div class='description'>{desc}</div>".compile({ seconds: chapter.seconds, thumbnail: thumbnail, title: chapter.title, desc: chapter.description }));
						});
					});

					video.currentTime = 0;
					ops.ready = true;
					container.addClass("ready");
				}

			};

		ops.init();

	};
})(jQuery);

$(function () {
	$("video").smartVideo({
		autoPlay: true,
		chapters: [{
				seconds: 1,
				title: "Chapter 1",
				description: "Look at the pretty colors!"
			},
			{
				seconds: 16,
				title: "Chapter 2",
				description: "Humor: Bird gets knocked out"
			},
			{
				seconds: 27,
				title: "Chapter 3: Title Screen",
				description: "This is where the title finally shows up."
			}, {
				seconds: 41,
				title: "Chapter 4: The awakening",
				description: "Our hero awakens from his slumber"
			},
			{
				seconds: 56,
				title: "Chapter 5: Starting the day",
				description: "After a nice neck crack, Buck sets out"
			}
		],
		mode: "fullscreen"
	});
});
