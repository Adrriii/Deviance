// ngl this is fire
const socket = new ReconnectingWebSocket("ws://127.0.0.1:24050/ws");
const socketData = new ReconnectingWebSocket("ws://127.0.0.1:3388/ws");

socket.onclose = event => {
	console.log("Goodbye gosumemory: ", event);
};
socketData.onclose = event => {
	console.log("Goodbye OsuLiveDataExport even if you sucj: ", event);
};

socket.onmessage = async event => {
    GosuHandle(event);
}

// This is sort of the main loop of the program
// It's triggered after sending a message to the websocket, when getting the reply
socketData.onmessage = async event => {
	try {
		data = JSON.parse(event.data);
		console.log("Obtained data");

		if(!data.hit_events) {
			socketData.send("Start");
			return;
		}

		GetBeatmapCache(osu_status.menu.bm.path.folder + "/" + osu_status.menu.bm.path.file).then(() => {
			tryProcess();
		})
	} catch(e) {}
}

draw_init();

socketData.onopen = () => {
	socketData.send("Start");
}