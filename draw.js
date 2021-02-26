let uplot;
let draw_data = [];

function draw_init() {
    let series = [];

    series.push(getDotSeries(seriesColors.marv));
    series.push(getDotSeries(seriesColors.perf));
    series.push(getDotSeries(seriesColors.grea));
    series.push(getDotSeries(seriesColors.good));
    series.push(getDotSeries(seriesColors.badd));
    series.push(getDotSeries(seriesColors.miss));
    
    let opts = {
        width: width,
        height: height,
        series: series,
        legend: {
            show: false
        },
        scale: {
            x: {
                time: false
            }
        }
    };

    uplot = new uPlot(opts, draw_data, document.body);
}

let seriesColors = {
    marv: "rgba(126, 165, 203, 1)",
    perf: "rgba(192, 164, 48, 1)",
    grea: "rgba(25, 164, 119, 1)",
    good: "rgba(29, 141, 197, 1)",
    badd: "rgba(255, 26, 179, 1)",
    miss: "rgba(204, 41, 41, 1)",
}

function getDotSeries(color) {
    draw_data.push([[],[]])
    return {
        stroke:color,
        fill:color,
        paths: u => null,
        points: {
            space: 0
        }
    }
}

let current_ms = 0;
function getNextRandomNote() {
    current_ms += Math.floor(Math.max(Math.random()*150 - 30, 0));
    let res;
    switch(Math.random()*13) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            case 6:
            case 7:
            res = [current_ms, Math.random()*20 - 16];
            break;
        case 8:
            case 9:
            res = [current_ms, Math.random()*40 - 32];
            break;
        case 10:
            res = [current_ms, Math.random()*97 - 46];
            break;
        default:
            res = [current_ms, Math.random()*160 - 80];
            break;
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

// function demo() {
//     setInterval(() => {
//         for(let i=0; i<15; i++) {
//             let next = getNextRandomNote();
//             let judge = getJudgeFromError(next[1]);
        
//             let index;
//             switch(judge) {
//                 case "marv":
//                     index = 0;
//                     break;
//                 case "perf":
//                     index = 1;
//                     break;
//                 case "grea":
//                     index = 2;
//                     break;
//                 case "good":
//                     index = 3;
//                     break;
//                 case "badd":
//                     index = 4;
//                     break;
//                 case "miss":
//                     index = 5;
//                     break;
//             }
        
//             draw_data[index][0].push(next[0]);
//             draw_data[index][1].push(next[1]);
//         }
//     },1);
//     setInterval(() => {
//         uplot.setData(uPlot.join(draw_data));
//     },33);
// }