
// Store hitobjects by column in a static object
let columns = {};

// contains the raw beatmap lines that is currently focused
let beatmap = null;

// amount of columns the player is trying to keep track of
let keys = 4;

// the path of the map that was last loaded
let loaded_last=null;

// replaces the current beatmap, but only if it's a new one!! so smart
function GetBeatmapCache(song_path) {
	return new Promise((resolve, reject) => {
		if(beatmap != null && loaded_last == song_path) {
			resolve();
			return;
		}
		beatmap = "working";
		loaded_last = song_path;
		let bm_path = "http://127.0.0.1:24050/Songs/" + encodeURIComponent(song_path);

		$.ajax({
            url: bm_path,
            type: "GET",
            crossDomain: true,
            success: function (response) {
                beatmap = response;
                resetAll();
				resolve();
            },
            error: function (xhr, status) {
				beatmap = null;
            }
        });
	})


}

// it's time to appreciate the osu format for mania
function parseHitObjects() {
	let objects = false;
    if(!beatmap) return;
	beatmap.split(/\r?\n/).forEach((line) => {
		if(objects && line) {
			let d = line.split(",");
			let ln_end = false;

			// usual osu format bullshit
			let worst_idea_ever_to_mark_ln_end_please_peppy_why = d[5].split(":")
			if(worst_idea_ever_to_mark_ln_end_please_peppy_why.length == 6) {
				ln_end = worst_idea_ever_to_mark_ln_end_please_peppy_why[0];
			}
			let current_column = getColumnFromX(keys, d[0]);

			if(!columns[current_column]) {
				columns[current_column] = [];
			}

			columns[current_column].push({
				x: d[0],
				y: d[1],
				time: d[2],
				ln: ln_end,
				errors: []
			});
		}

		if(line == "[HitObjects]") objects = true;
	});
}

// since osu has a brilliant way to store hitobjects
// we get to have this beautiful shit
function getColumnFromX(keys, x) {
    return Math.trunc(x/512*keys);
}

// Will try to process the data until beatmap is ready then loop over
function tryProcess() {
    if(beatmap == "working") {
        setTimeout(tryProcess, 100);
        return;
    }

    parseReplayHits();
    processHits();
    addProcessedHitsToData();

    reinitMessage()
}

let replay_parse_index = 2; // ignore first 2 lines ; this is used to not look at the entire replay each time
let replay_hits = []; // all the raw press and release from the replay
let processed_hits = []; // all the notes that have been pressed and possibly released
let state = {}; // the last state of each key

function resetAll() {
    console.log("Refresh");
    columns = {};
    replay_parse_index = 2;
    replay_hits = [];
    processed_hits = [];
    state = {};
    draw_data = [
        [[],[]],
        [[],[]],
        [[],[]],
        [[],[]],
        [[],[]],
        [[],[]],
    ];
    parseHitObjects();
}

// Add latest hits from current replay data
// needs up to date data
function parseReplayHits() {
    for(replay_parse_index; replay_parse_index < data.hit_events.length; replay_parse_index++) {
        let event = data.hit_events[replay_parse_index];

        if(event.X<100 && event.X>=0 && event.X != state && event.TimeStamp >= -100000 && event.TimeStamp <= 100000000) {
            let current = numToString(event.X, 2, keys);

            for(let k = 0; k < keys; k++) {
                let current_k = current.charAt(k);

                if(state[k] === undefined) state[k] = 0;

                if(state[k] != current_k) {
                    let hit = {
                        time: event.TimeStamp,
                        column: 3-k
                    };
                    if(state[k] == 0) {
                        hit.type = "press";
                    } else {
                        hit.type = "release";
                    }
                    state[k] = current_k;
                    replay_hits.push(hit);
                }
            }
        }
    }
}

// Consumes the replay hits and applicable notes to find hit errors
function processHits() {
    let hit;
    while(hit = replay_hits.shift()) {
        if(!columns[hit.column].length > 0) continue;
        let note = columns[hit.column][0];
        let hitError;
        
        if(hit.type == "press") {
            hitError = hit.time - note.time;
        } else if (hit.type == "release") {
            if(note.ln === false) continue; 
            hitError = hit.time - note.ln;
        }
        
        let found = false;
        
        if (hitError >= -(od_miss_ms)){
            found = true;
        }

        if(found) {
            note.errors.push(hitError);
            processed_hits.push(note);
            if(note.ln !== false && hit.type != "release") continue;
            columns[hit.column].shift();
        }
    }
}

// these are used to process bitwise keyboard state
// found this on stackoverflow and copied it here
function padStart(string, length, char) {
    return length > 0 ?
        padStart(char + string, --length, char) :
        string;
}
  
function numToString(num, radix, length = num.length) {
    const numString = num.toString(radix);
    return numString.length === length ?
        numString :
        padStart(numString, length - numString.length, "0")
}

// i stole this from Phy, check out his scatter plot for gosumemory it's probably less scuffed than this
// od section //

const ez = 0b10;
const hr = 0b10000;

const mania_300 = od => 64 - (od * 3);
const mania_200 = od => 97 - (od * 3);
const mania_100 = od => 127 - (od * 3);
const mania_50 = od => 151 - (od * 3);
const mania_miss = od => 188 - (od * 3);

const mania_hr_calc = value => value / 1.4;
const mania_ez_calc = value => value * 1.4;

let od_50_ms;
let od_100_ms;
let od_200_ms;
let od_300_ms;
let od_300g_ms = 16;
let od_miss_ms;

const update_od_ms = (od, mods_num) => {
	if ((mods_num & hr) == hr) {
		od_miss_ms = mania_hr_calc(mania_miss(od));
		od_50_ms = mania_hr_calc(mania_50(od));
		od_100_ms = mania_hr_calc(mania_100(od));
		od_200_ms = mania_hr_calc(mania_200(od));
		od_300_ms = mania_hr_calc(mania_300(od));
	}
	else if ((mods_num & ez) == ez) {
		od_miss_ms = mania_ez_calc(mania_miss(od));
		od_50_ms = mania_ez_calc(mania_50(od));
		od_100_ms = mania_ez_calc(mania_100(od));
		od_200_ms = mania_ez_calc(mania_200(od));
		od_300_ms = mania_ez_calc(mania_300(od));
	}
	else {
		od_miss_ms = mania_miss(od);
		od_50_ms = mania_50(od);
		od_100_ms = mania_100(od);
		od_200_ms = mania_200(od);
		od_300_ms = mania_300(od);
	}
};
update_od_ms(8,0);

///

function getJudgeFromError(hitError) {
    if (hitError <= od_300g_ms && hitError >= -(od_300g_ms)) {
        return "marv";
    }
    else if (hitError <= od_300_ms && hitError >= -(od_300_ms)) {
        return "perf";
    }
    else if (hitError <= od_200_ms && hitError >= -(od_200_ms)) {
        return "grea";
    }
    else if (hitError <= od_100_ms && hitError >= -(od_100_ms)) {
        return "good";
    }
    else if (hitError <= od_50_ms && hitError >= -(od_50_ms)) {
        return "badd";
    }
    else if (hitError >= -(od_miss_ms)){
        return "miss"
    } else {
        return "none";
    }
}