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
let last_status = "";
let last_ping = 0;
socketData.onmessage = async event => {
	try {
		data = JSON.parse(event.data);
		last_ping = Date.now();

		if(data.osu_status != last_status) {
			last_status = data.osu_status;
			ranking = last_status == "Rank";
			if(!ranking && last_status != "Playing")
				resetAll();
			console.log("Status changed to "+last_status+ " "+keys+"k");
		}
		
		if(!data.hit_events) {
			reinitMessage();
			return;
		}

		GetBeatmapCache(osu_status.menu.bm.path.folder + "/" + osu_status.menu.bm.path.file).then(() => {
			tryProcess();
		})
	} catch(e) {}
}

draw_init();

let sent = false;
function reinitMessage() {
	if(sent) return
	sent = true;
	setTimeout(() => {
		sent = false;
		socketData.send("Start");
	}, 250);
}

setInterval(() => {
	if(Date.now() - last_ping >= 500) {
		reinitMessage();
	}
}, 100);

socketData.onopen = () => {
	reinitMessage();
}