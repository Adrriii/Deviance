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

socketData.onmessage = async event => {
	try {
		data = JSON.parse(event.data);
		console.log("Obtained data");
	} catch(e) {}
}

draw_init();