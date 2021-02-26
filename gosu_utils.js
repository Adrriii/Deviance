
// much data
let osu_status;

// yes its literally in the thing above but look theres a lot to type to access this
let current_time;

// do the stuff each time gosumemory pokes at us (that's more than a few times each second usually)
function GosuHandle(event) {
    osu_status = JSON.parse(event.data);
	keys = osu_status.menu.bm.stats.memoryCS;
    current_time = osu_status.menu.bm.time.current;

    // actually i don't think it's good to update this that often but tbh its nothingq
    update_od_ms(osu_status.menu.gameMode == 3 ? osu_status.menu.bm.stats.memoryOD : osu_status.menu.bm.stats.OD, osu_status.menu.mods.num);
}