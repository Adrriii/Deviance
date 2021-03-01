
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
let last_hitobject = 0;
let first_hitobject = 1000000;
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

            let t = parseInt(d[2]);
			columns[current_column].push({
				x: d[0],
				y: d[1],
                column: current_column,
				time: t,
				ln: ln_end,
				errors: []
			});

            if(last_hitobject < t) last_hitobject = t;
            if(ln_end !== false && last_hitobject < ln_end) last_hitobject = ln_end;
            if(first_hitobject > t) first_hitobject = t;
		}

		if(line == "[HitObjects]") objects = true;
	});
}

// since osu has a brilliant way to store hitobjects
// we get to have this beautiful shit
function getColumnFromX(keys, x) {
    return Math.trunc((x/512)*keys);
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
    last_hitobject = 0;
    first_hitobject = 1000000;
    last_time = null;
    columns = {};
    replay_parse_index = 2;
    replay_hits = [];
    replay = false;
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
    uplot.setData(uPlot.join(draw_data));
    parseHitObjects();
}

// Add latest hits from current replay data
// needs up to date data
let ranking = false;
let replay = false;
let last_time = null;
function parseReplayHits() {
    if(!ranking && replay_parse_index > data.hit_events.length) resetAll();
    for(replay_parse_index; replay_parse_index < data.hit_events.length; replay_parse_index++) {
        let event = data.hit_events[replay_parse_index];

        if(event.X<100 && event.X>=0 && event.X != state && event.TimeStamp >= -100000 && event.TimeStamp <= 100000000) {
            let current = numToString(event.X, 2, keys);
            if((event.TimeStamp > last_time + 30000 || event.TimeStamp < last_time -10000) && (last_time !== null)) continue;
            last_time = event.TimeStamp;

            for(let k = 0; k < keys; k++) {
                let current_k = current.charAt(k);

                if(state[k] === undefined) state[k] = 0;

                if(state[k] != current_k) {
                    let hit = {
                        time: event.TimeStamp,
                        column: (keys-1)-k
                    };
                    if(state[k] == 0) {
                        hit.type = "press";
                    } else {
                        hit.type = "release";
                    }
                    state[k] = current_k;
                    replay_hits.push(hit);

                    replay = false;
                    if(event.TimeStamp > current_time+1000) replay = true;
                }
            }
        }
    }
}

// Consumes the replay hits and applicable notes to find hit errors
function processHits() {
    let hit;
    while(hit = replay_hits.shift()) {
        processHit(hit);
    }
}

function processHit(hit) {
    if(!columns[hit.column]) return; // this is in case the map has no note on the column ... #timingtest
    if(!columns[hit.column].length > 0) return;
    let note = columns[hit.column][0];

    let hit_case;
    let hitError;
    let hitReleaseError;

    if(hit.type == "press" && note.ln === false) hit_case = "rice";
    if(hit.type == "release" && note.ln === false) hit_case = "release_skip";
    if(hit.type == "press" && note.ln !== false) hit_case = "base";
    if(hit.type == "release" && note.ln !== false) hit_case = "release";

    //console.log("Column"+hit.column+" | "+hit.time+"ms -> "+note.time+":"+note.ln+" - "+hit_case)
    
    switch(hit_case) {
        // Simplest case, rice
        case "rice":
            hitError = hit.time - note.time;

            if (hitError >= -(od_miss_ms)){
                // If we skipped notes, add a miss and continue recursively
                if(hitError > od_50_ms) { // test with >=
                    note.errors.push(od_miss_ms);
                    processed_hits.push(note);
                    columns[hit.column].shift();
                    processHit(hit);
                    return;
                }

                // Otherwise, juste assign the note
                note.errors.push(hitError);
                processed_hits.push(note);
                columns[hit.column].shift();
                return;
            }
            break;
        case "base":
            hitError = hit.time - note.time;
            hitReleaseError = hit.time - note.ln;

            if (hitError >= -(od_miss_ms)){
                // If we skipped the whole long note, add a miss and continue recursively
                if(hitReleaseError > 0) { // needs more testing
                    note.errors.push(od_miss_ms);
                    processed_hits.push(note);
                    columns[hit.column].shift();
                    processHit(hit);
                    return;
                }

                // If we tap during the long note but too late, we can still get a 50 at max.
                // I handle this by not filling the long note.
                if (hitError >= od_50_ms) {
                    note.errors.push(od_miss_ms);
                    return;
                }

                // Otherwise, just assign the first judgement for the LN
                note.errors.push(hitError);
                return;
            }
            break;
        case "release":
            hitReleaseError = hit.time - note.ln;

            // Ignore releases before a base
            if(hit.time < note.time) return;

            // Theres no base for this timing, it's always a miss. But we can only add it after the note passes entirely
            if(note.errors.length == 0 && hitReleaseError > od_50_ms) {
                note.errors.push(od_miss_ms);
                processed_hits.push(note);
                columns[hit.column].shift();
                // no hit reprocess cause a release in this stage won't ever do anything
            }

            // Release too soon (break)
            // test if this timing is correct
            if(hitReleaseError <= -od_50_ms) {
                note.errors = [od_100_ms+3];
                processed_hits.push(note);
                columns[hit.column].shift();
                return;
            }
            
            if(hitReleaseError > -od_50_ms) {
                if(note.errors.length == 0) {
                    // The base was not hit, so we ignore this release.
                    return;
                }
                note.errors.push(hitReleaseError);
                processed_hits.push(note);
                columns[hit.column].shift();
                return;
            }
            break;
        default:
        break;
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