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
