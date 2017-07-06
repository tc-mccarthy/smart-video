$(function () {
	$("video").smartVideo({
		autoPlay: true,
		chapters: [{
			seconds: 5,
			title: "Chapter 1",
			description: "Look at the pretty colors!"
		}, {
			seconds: 27,
			title: "Title Screen",
			description: "This is where the title finally shows up."
		}],
		mode: "fullscreen"
	});
});
