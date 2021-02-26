let uplot;
let draw_data = [];
let ctx;
let series_exist = false;

// initialize uPlot (it's amazing btw)
function draw_init() {
    series = [];

    // We need an extra series because ... otherwise theres a bug? idk, it works
    series.push(getDotSeries(theme.marv));
    series.push(getDotSeries(theme.marv));
    series.push(getDotSeries(theme.perf));
    series.push(getDotSeries(theme.grea));
    series.push(getDotSeries(theme.good));
    series.push(getDotSeries(theme.badd));
    series.push(getDotSeries(theme.miss));
    
    let opts = {
        width: width,
        height: height,
        series: series,
        // Disable ALL the stuff, sorry (:
        axes: [
            {show: false,grid: {show: false}},
            {show: false,grid: {show: false}},
        ],
        legend: {
            show: false
        },
        // do some :sunglasses: stuff
        plugins: [
            interface_plugin()
        ]
    };

    uplot = new uPlot(opts, draw_data, document.body);
    //demo()
}

// trial and error don't touch
function getMsDistanceOverHeight(ms) {
    return ms/167*(height/2+10);
}

// coolest thing tbh
function interface_plugin() {
    // draw behind ~~enemy lines~~ the scatter (markdown in comments when)
    function init(u) {
        u.ctx.save();

        u.ctx.fillStyle = theme.background;
        u.ctx.fillRect(0, 0, width, height);

        u.ctx.fillStyle = theme.marv;
        u.ctx.fillRect(0, height/2, width, 1);

        u.ctx.fillStyle = theme.perf;
    
        let dst = getMsDistanceOverHeight(od_300g_ms);
        u.ctx.fillRect(0, height/2 + dst, width, 1);
        u.ctx.fillRect(0, height/2 - dst, width, 1);

        u.ctx.fillStyle = theme.grea;
    
        dst = getMsDistanceOverHeight(od_300_ms);
        u.ctx.fillRect(0, height/2 + dst, width, 1);
        u.ctx.fillRect(0, height/2 - dst, width, 1);

        u.ctx.fillStyle = theme.good;
    
        dst = getMsDistanceOverHeight(od_200_ms);
        u.ctx.fillRect(0, height/2 + dst, width, 1);
        u.ctx.fillRect(0, height/2 - dst, width, 1);

        u.ctx.fillStyle = theme.badd;
    
        dst = getMsDistanceOverHeight(od_100_ms);
        u.ctx.fillRect(0, height/2 + dst, width, 1);
        u.ctx.fillRect(0, height/2 - dst, width, 1);

		u.ctx.restore();
    }
    
    return {
        hooks: {
            // init is ... useless i guess for drawing
            // draw clear is before points
            drawClear: init,
            // draw is after

            // didnt look into it further
        }
    };
}

function getDotSeries(color) {
    draw_data.push([[],[]])
    return {
        stroke: color,
        size: 5,
        paths: u => null,
        points: {
            fill:color, // it has to be here ... far from stroke, idk why
            space: 0
        },
    }
}

function addProcessedHitsToData() {
    let toAdd = [];

    let hit;
    while(hit = processed_hits.shift()) {

        let hitError = hit.errors[0];

        // avg of errors for LNs
        if(hit.ln !== false) hit.errors.reduce((a,b)=> a+b,0) / hit.errors.length;

        toAdd.push([getIndexOfJudge(getJudgeFromError(hitError)),[hit.ln === false ? hit.time : hit.ln, hitError]]);
    }

    appendNotes(toAdd);
}

// notes are [0,[offset,error]]
// index starts at 0 (marv)
function appendNotes(notes) {
    let index;
    let note;
    for(let i = 0; i < notes.length; i++) {
        index = notes[i][0];
        note = notes[i][1];

        draw_data[index][0].push(parseInt(note[0]));
        draw_data[index][1].push(note[1]);
    }
    uplot.setData(uPlot.join(draw_data));
    uplot.setScale("y", {min: -od_miss_ms, max: od_miss_ms});
}

function getIndexOfJudge(judge) {
    let index = -1;
    switch(judge) {
        case "marv":
            index = 0;
            break;
        case "perf":
            index = 1;
            break;
        case "grea":
            index = 2;
            break;
        case "good":
            index = 3;
            break;
        case "badd":
            index = 4;
            break;
        case "miss":
            index = 5;
            break;
    }
    return index;
}

// Demo stuff
// it's cool, try it
let demo_current_ms = 0;
function getNextRandomNote() {
    demo_current_ms += Math.floor(Math.max(Math.random()*150 - 30, 0));
    let res;
    let tr = Math.random()*20;
    if(tr < 13) {
        res = [demo_current_ms, Math.random()*32 - 16]
    } else if (tr < 17) {
        res = [demo_current_ms, Math.random()*70 - 35]
    } else if (tr < 19) {
        res = [demo_current_ms, Math.random()*90 - 45]
    } else {
        res = [demo_current_ms, Math.random()*320 - 160]
    }

    res[1] = Math.floor(res[1]);
    return res;
}

let demo_stopped = false;
function demo() {
    setInterval(() => {
        if(demo_current_ms > 400000) demo_stopped = true;
        if(demo_stopped) return;
        for(let i=0; i<30; i++) {
            let next = getNextRandomNote();
            let judge = getJudgeFromError(next[1]);
            let index = getIndexOfJudge(judge);
        
            draw_data[index][0].push(next[0]);
            draw_data[index][1].push(next[1]);
        }
    },10);
    setInterval(() => {
        if(demo_stopped) return;
        uplot.setData(uPlot.join(draw_data));
    },16);
}