/*
	smartVideo jQuery plugin
	Author: TC McCarthy
	An HTML5 video player with chapter abilities, iOS enhancements and finite control for the average user/dev
*/

(function ($) {
    $.fn.smartVideo = function (options) {
        var o = Object.assign({
                autoSize: true,
                chapters: [], //array of objects structured like {seconds: CUE POINT, title: CHAPTER TITLE, description: CHAPTER DESCRIPTION, thumbnail: THUMBNAIL. SCREEN CAP USED IF NOT PROVIDED}
                events: [], //array of objects structured like {start: BEGIN EVENT, end: END EVENT, size: HOW BIG THE CONTAINER SHOULD BE}
                onStart: false, //call back for first play event
                onPlay: false, //callback for play event
                onPause: false, //callback for pause event
                onComplete: false, //callback for complete event
                hideControls: false,
                hideChapterMenu: false
            }, options),
            _this = this,
            video = _this[0],
            canvas = document.createElement("canvas"),
            clone = _this.clone(false, false),
            container,
            ele,
            ops = {
                ready: false,
                init: function () {
                    //make this a smart video
                    _this.wrap("<div class='smart-video'></div>".compile({ mode: o.mode }));

                    //set new wrapper as 'container'
                    container = _this.closest(".smart-video");
                    container.prepend("<div class='loader'><i class='fa fa-spin fa-cog'></i></div>");


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

                    _this.after("<div class='control-bar'> <div class='inner'> <div class='controls'> <a class='fa fa-play' href='#'></a> <a class='fa fa-pause hide' href='#'></a> <a class='fa fa-volume-up' href='#'></a> </div> <div class='timecode'></div> <div class='progress'> <div class='inner'> <div class='bar'></div> </div> </div> </div> </div>");
                    _this.after("<div class='chapter-menu'></div>");
                    _this.after("<div class='event_code'><header><a class='fa fa-close close' href='#'></a></header><article></article><footer></footer></div>");

                    var chapterToggle = "<a class='fa fa-list-ul toggle' data-target='.chapter-menu' data-original-icon='fa-list-ul' href='#'></a>",
                        controlsToggle = "<a class='fa fa-toggle-off toggle' data-target='.control-bar' data-original-icon='fa-toggle-off' href='#'></a>";

                    _this.after(chapterToggle);
                    _this.after(controlsToggle);


                    ops.ele = {
                        play: container.find(".fa-play"),
                        pause: container.find(".fa-pause"),
                        progressBar: container.find(".progress"),
                        progress: container.find(".progress .bar"),
                        chapterMenu: container.find(".chapter-menu"),
                        controls: container.find(".control-bar"),
                        timecode: container.find(".timecode"),
                        event_code: container.find(".event_code")
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
                    ops.ele.play.on("click", function (e) {
                        e.preventDefault();

                        if (ops.ready) {
                            video.play();
                        }
                    });

                    //pause button bind
                    ops.ele.pause.on("click", function (e) {
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

                    _this.on("click", function (e) {
                        ops.toggleControls('show');

                        //ops for first play
                        if (ops.playing) {
                            video.pause();
                        } else {
                            video.play();
                            setTimeout(function () {
                                ops.toggleControls('hide');
                            }, 1500);
                        }
                    });

                    //event handling for video start
                    _this.on("play playing", function (e) {
                        ops.ele.play.addClass("hide");
                        ops.ele.pause.removeClass("hide");
                        ops.playing = true;

                        if (!ops.started) {
                            ops.toggleControls("hide");
                            ops.toggleChapterMenu("hide");
                            ops.started = true;

                            if (typeof o.onStart === "function") {
                                o.onStart(e);
                            }
                        }

                        if (typeof o.onPlay === "function") {
                            o.onPlay(e);
                        }
                    });

                    //event handling for video pause
                    _this.on("pause", function (e) {
                        ops.ele.play.removeClass("hide");
                        ops.ele.pause.addClass("hide");
                        ops.playing = false;

                        if (typeof o.onPause === "function") {
                            o.onPause(e);
                        }
                    });

                    //event handling for progress
                    _this.on("timeupdate", function (e) {
                        if (ops.ready) {
                            var currentTime = Math.floor(video.currentTime),
                                duration = video.duration,
                                pct = Math.floor((currentTime / duration) * 100),
                                chapterSelector = ops.ele.chapterMenu.find("[data-seconds='{seconds}']".compile({ seconds: Math.floor(currentTime) }));

                            //pct is floored to that updates in the progress bar aren't as sporadic
                            ops.ele.progress.width(pct + "%");

                            //update timecode
                            ops.ele.timecode.text(ops.secondsToTimecode(parseInt(currentTime)));

                            //highlight chapter
                            if (chapterSelector.length > 0) {
                                ops.ele.chapterMenu.find("a.chapter").removeClass("active");
                                chapterSelector.addClass("active");
                            }

                            //fire event
                            var ev = o.events.filter(function (ee) {
                                    return (ee.seconds.start <= currentTime && ee.seconds.end >= currentTime);
                                })[0],
                                ev_id = o.events.indexOf(ev);

                            //hide the popover -- this facilitates the outpoint cue
                            ops.ele.event_code.removeClass("active");

                            if (ev) { //if there is an active event for this timecode
                                //reset event code element before applying this event's properties to it
                                ops.ele.event_code.removeAttr("class").addClass("event_code active").addClass(ev.size).addClass(ev.position).addClass(ev.classes.join(" ")).data("id", ev_id);
                                ops.ele.event_code.find("article").html(ev.html);
                            } else {
                                //if there is no event, reset event_code settings so visual effects appear correctly
                                ops.ele.event_code.removeAttr("class").addClass("event_code");
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
                    ops.ele.progressBar.on("click mousedown mouseup", function (e) {
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

                    //progress chapter
                    $("body").on("click", ".control-bar a.chapter", function (e) {
                        e.preventDefault();

                        var ele = $(this);

                        $(".control-bar a.chapter.active").removeClass("active");
                        ops.ele.addClass("active");
                    });

                    $("body").on("click", ".toggle", function (e) {
                        e.preventDefault();

                        var ele = $(this),
                            container = ele.closest(".smart-video"),
                            video = container.find("video")[0],
                            targetSelector = ele.data("target"),
                            icon = ele.data('original-icon'),
                            target = container.find(targetSelector),
                            action;

                        switch (targetSelector) {
                        case '.chapter-menu':
                            ops.toggleChapterMenu();
                            break;
                        case '.control-bar':
                            ops.toggleControls();
                            break;
                        }
                    });

                    $("body").on("click", ".event_code .close", function (e) {
                        e.preventDefault();

                        var ele = $(this),
                            code = ele.closest(".event_code"),
                            event_id = code.data("id");

                        o.events[event_id].classes.push("hide");
                        code.addClass("hide");
                    });
                },

                toggleChapterMenu: function (op) {
                    var toggleButton = container.find("[data-target='.chapter-menu']"),
                        originalIcon = toggleButton.data("original-icon"),
                        target = ops.ele.chapterMenu;

                    if (typeof op === "undefined") {
                        op = (target.hasClass('active')) ? 'hide' : 'show';
                    }

                    if (op === "show") {
                        target.addClass("active");
                        toggleButton.removeAttr("class").addClass("fa fa-close toggle");
                    } else {
                        target.removeClass("active");
                        toggleButton.removeAttr("class").addClass("fa toggle").addClass(originalIcon);
                    }
                },

                toggleControls: function (op) {
                    var toggleButton = container.find("[data-target='.control-bar']"),
                        originalIcon = toggleButton.data("original-icon"),
                        target = ops.ele.controls;

                    if (typeof op === "undefined") {
                        op = (target.hasClass('active')) ? 'hide' : 'show';
                    }

                    if (op === "show") {
                        target.addClass("active");
                        toggleButton.removeAttr("class").addClass("fa fa-close toggle");
                    } else {
                        target.removeClass("active");
                        toggleButton.removeAttr("class").addClass("fa toggle").addClass(originalIcon);
                    }
                },

                getFrame: function (time, cb) {
                    var scale = 0.25,
                        attempts = 0,
                        prepClone = function () {
                            canvas.width = clone[0].videoWidth * scale;
                            canvas.height = clone[0].videoHeight * scale;
                            clone[0].currentTime = time;
                        };

                    if (!!ops.checkiOS() && (ops.checkiOS()[0] < 10 || ops.checkiOS()[1] < 3)) {
                        cb(false);
                        return false;
                    }

                    if (clone[0].readyState >= 2) {
                        prepClone();
                    } else {
                        clone.on("loadedmetadata", prepClone);
                    }



                    clone.on("seeked", function () {
                        canvas.getContext('2d')
                            .drawImage(clone[0], 0, 0, canvas.width, canvas.height);

                        //hack to fix frame grab on iOS
                        if (attempts < 2) {
                            attempts++;
                            clone[0].currentTime = time;
                        } else {
                            clone.off("seeked");
                            if (typeof cb === "function") {
                                cb(canvas.toDataURL());
                            }
                        }
                    });
                },

                timecodeToSeconds: function (timecode) {
                    var arr = timecode.split(":");

                    return ((parseInt(arr[0]) * 3600) + (parseInt(arr[1]) * 60) + parseInt(arr[2]));
                },

                secondsToTimecode: function (seconds) {
                    var hours = parseInt(seconds / 3600),
                        hours_seconds = seconds % 3600,
                        minutes = parseInt(hours_seconds / 60),
                        minutes_seconds = hours_seconds % 60;

                    return "{hours}:{minutes}:{seconds}".compile({ hours: ops.zeroPad(hours), minutes: ops.zeroPad(minutes), seconds: ops.zeroPad(minutes_seconds) });
                },

                zeroPad: function (num) {
                    if (parseInt(num) < 10) {
                        return "0" + num;
                    } else {
                        return num;
                    }
                },

                playerSetup: function () {
                    var wait = 0,
                        duration = video.duration;

                    //set up event markers
                    $.each(o.events, function (key, ee) {
                        ee.seconds = {};
                        ee.seconds.start = ops.timecodeToSeconds(ee.start);
                        ee.seconds.end = ops.timecodeToSeconds(ee.end);

                        o.events[key] = Object.assign({
                            seconds: {}, //object of timecodes converted to seconds
                            start: "00:00:00",
                            end: "00:00:00",
                            classes: [],
                            size: "quarter",
                            html: "",
                            position: "right"
                        }, ee);

                        var pct = Math.floor((ee.seconds.start / duration) * 100);

                        ops.ele.progressBar.find(".inner").append("<a class='video_event' style='left: {pct}%;' href='#'></a>".compile({ pct: pct }));
                    });

                    //set up chapter markers
                    async.eachSeries(o.chapters, function (chapter, nextChapter) {
                        chapter.seconds = ops.timecodeToSeconds(chapter.timecode);

                        var pct = Math.floor((chapter.seconds / duration) * 100),
                            setThumbnail = function (thumbnail) {
                                ops.ele.progressBar.find(".inner").append("<a class='chapter' style='left: {pct}%' data-seconds='{seconds}'><div class='preview'><img src='{thumbnail}' /></div></a>".compile({ pct: pct, seconds: chapter.seconds, thumbnail: thumbnail }));
                                chapterMenuEntry.attr("data-seconds", chapter.seconds).html("<div class='preview'><img src='{thumbnail}' /></div><div class='headline'>{title}</div><div class='description'>{desc}</div>".compile({ seconds: chapter.seconds, thumbnail: thumbnail, title: chapter.title, desc: chapter.description }));
                                nextChapter();
                            };

                        ops.ele.chapterMenu.append("<a class='chapter' href='#'></a>");

                        var chapterMenuEntry = ops.ele.chapterMenu.find(".chapter").eq(-1);

                        if (!chapter.thumbnail) {
                            ops.getFrame(chapter.seconds, setThumbnail);
                        } else {
                            setThumbnail(chapter.thumbnail);
                        }
                    }, function (err) {
                        video.currentTime = 0;
                        ops.ready = true;
                        container.addClass("ready");
                        clone.remove();

                        if (!o.hideChapterMenu) {
                            ops.toggleChapterMenu("show");
                        }

                        if (!o.hideControls) {
                            ops.toggleControls("show");
                        }
                    });
                },

                checkiOS: function () {
                    // borrowed from https://stackoverflow.com/a/14223920
                    if (/iP(hone|od|ad)/.test(navigator.platform)) {
                        // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
                        var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
                        return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
                    } else {
                        return false;
                    }
                }

            };

        ops.init();

    };
})(jQuery);
