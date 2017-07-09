$(function () {
    $("video").smartVideo({
        autoPlay: true,
        chapters: [{
                timecode: "00:00:01",
                title: "Chapter 1",
                description: "Look at the pretty colors!"
            },
            {
                timecode: "00:00:16",
                title: "Chapter 2",
                description: "Humor: Bird gets knocked out"
            },
            {
                timecode: "00:00:27",
                title: "Chapter 3: Title Screen",
                description: "This is where the title finally shows up."
            }, {
                timecode: "00:00:41",
                title: "Chapter 4: The awakening",
                description: "Our hero awakens from his slumber"
            },
            {
                timecode: "00:00:56",
                title: "Chapter 5: Starting the day",
                description: "After a nice neck crack, Buck sets out"
            }
        ],
        events: [{
                start: "00:00:05",
                end: "00:00:10",
                size: "quarter",
                classes: "",
                html: "<h2>Open video project</h2><p>Big Buck Bunny is the lorem ipsum of HTML5 videos, being produced for purposes just like this one.</p>",
                position: "left"
            }, {
                start: "00:00:22",
                end: "00:00:30",
                size: "quarter",
                classes: "",
                html: "<p>HTML5 video requires that all videos be transcoded into three types, ogg, webm and mp4. Currently there is no standard, though mp4 is useable by all browsers.</p>",
                position: "right"
            }, {
                start: "00:00:40",
                end: "00:00:45",
                size: "quarter",
                classes: "",
                html: "<h2>Smart video limits</h2><p>Right now, these popups can take ANY html we throw at it -- though we're testing to find the limit.</p>",
                position: "left"
            }, {
                start: "00:00:50",
                end: "00:00:53",
                size: "quarter",
                classes: "",
                html: "<p>These popups come in three sizes: this size is called 'quarter'",
                position: "left"
            }, {
                start: "00:00:53",
                end: "00:00:56",
                size: "half",
                classes: "",
                html: "<p>This size is 'half'",
                position: "right"
            },
            {
                start: "00:00:56",
                end: "00:00:59",
                size: "three-quarter",
                classes: "",
                html: "<p>And finally, three-quarter",
                position: "left"
            }
        ]

    });
});
