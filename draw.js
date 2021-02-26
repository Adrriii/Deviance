let uplot;
let draw_data = [];
let ctx;

function draw_init() {
    let series = [];

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
        axes: [
            {show: false,grid: {show: false}},
            {show: false,grid: {show: false}},
        ],
        legend: {
            show: false
        },
        scales: {
            y: {
                range: { 
                    min: -167, 
                    max: 167
                }
            }
        },
        plugins: [
            interface_plugin()
        ]
    };

    uplot = new uPlot(opts, draw_data, document.body);
    demo()
}

function getMsDistanceOverHeight(ms) {
    return ms/167*(height/2);
}

function interface_plugin() {
    function draw(u) {
        u.ctx.save();

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
            draw: draw,
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
            fill:color,
            space: 0
        },
    }
}

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

function appendNotes(notes) {
    for(let i = 0; i <= notes.length; i++) {
        draw_data[index][0].push(notes[i][0]);
        draw_data[index][1].push(notes[i][1]);
    }
    uplot.setData(uPlot.join(draw_data));
}

let demo_stopped = false;
function demo() {
    setInterval(() => {
        if(demo_current_ms > 400000) demo_stopped = true;
        if(demo_stopped) return;
        for(let i=0; i<30; i++) {
            let next = getNextRandomNote();
            let judge = getJudgeFromError(next[1]);
        
            let index;
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
        
            draw_data[index][0].push(next[0]);
            draw_data[index][1].push(next[1]);
        }
    },10);
    setInterval(() => {
        if(demo_stopped) return;
        uplot.setData(uPlot.join(draw_data));
    },16);
}