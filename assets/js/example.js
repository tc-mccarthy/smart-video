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
        mode: "fullscreen"
    });
});
