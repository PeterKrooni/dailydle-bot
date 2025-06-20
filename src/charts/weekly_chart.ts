// @ts-ignore
import { D3Node } from 'd3-node';
import sharp from 'sharp';
import { GameEntry, GameEntryModel } from '../core/database/schema.js';

const fontSize = 30;
const fontFamily = "monospace"

const styles = `
.bar rect {
  stroke-width: 1;
  stroke: #fff;
}

.bar text {
  fill: #fff;
  font: 18px ${fontFamily}; /* Increased font size */
  font-weight: bold;
}

/* Make axis lines and ticks white */
.axis path,
.axis line {
  stroke: white;
}

.axis text {
  fill: white;
  font-size: ${fontSize}px; /* Make axis numbers more readable */
  font-family: ${fontFamily}
}`;

var options = {
  svgStyles: styles,
}

const color_schemes = [
  ["#605B56", "#837A75", "#ACC18A", "#DAFEB7", "#F2FBE0"],
  ["#493657", "#CE7DA5", "#BEE5BF", "#DFF3E3", "#FFD1BA"],
  ["#ca054d",  "#3b1c32","#a4d4b4","#ffcf9c","#b96d40"],
  ["#ee6352", "#08b2e3","#efe9f4","#57a773","#484d6d"],
  ["#420039","#932f6d", "#e07be0","#dcccff","#f6f2ff"],
  ["#31393c","#2176ff","#33a1fd","#fdca40","#f79824"],
  ["#a63446","#fbfef9","#0c6291" ,"#000004","#7e1946"],
  ["#f6f7eb","#e94f37","#393e41","#3f88c5","#44bba4"]
]

import { get_one_week_ago } from '../util.js';

const formatDayId = (f: string) => {
  return Number.parseInt(f.replace(/\s/g, '').replace(',',''))
}

export async function generate_weekly_chart(gamemode: any) {

  const filter = {
    createdAt: { $gte: get_one_week_ago() },
    game: gamemode,
  };

  const gameEntries = await GameEntryModel.find(filter);

  const dataSource: DataSource = getDataSource(gameEntries);
  const data: Data[] = dataSource.data
  const names: string[] = dataSource.names

  console.log('names and data:')
  console.log(names)
  console.log(data)

  const d3n = new D3Node(options); // Initialize D3Node
  const d3 = d3n.d3; // Access the D3.js library

  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 1460 - margin.left - margin.right;
  const height = 1000 - margin.top - margin.bottom;

  const colors = color_schemes[0]//color_schemes[Math.floor(Math.random() * color_schemes.length)]

  const x = xScales(d3, data, width);
  const x0 = x.x0
  const x1 = x.x1

  // Y scale
  const y = d3.scaleLinear()
    .domain([0, 7]) // Assume max score is 7
    .range([height, 0]);

  const svg = d3n.createSVG(width + margin.left + margin.right, height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create bars for every score
  data.forEach((d: any) => {
    const group = svg.append("g")
      .attr("transform", `translate(${x0(d.day)},0)`);

    d.scores.forEach((score: string, personIndex: number) => {
      createScoreBar(group, score, personIndex, x1, y, colors, height, fontSize, fontFamily);
    });
  });

  createGraphAxis(svg, d3, x0, y, height);
  createLegend(svg, names, colors);

  // Convert the SVG to a string
  const svgString = d3n.svgString();

  // Convert the SVG to PNG using sharp
  await sharp(Buffer.from(svgString))
    .png()
    .toFile('temp_chart.png');
    
  const finalImage = await sharp('temp_chart.png')
    .composite([
      { input: 'wordle_logo.png', top: 10, left: 1070 } // Adjust position
    ])
    .toFile('generated_chart.png');

  return finalImage;
}

interface Data {
  day: number,
  scores: string[]
}

interface DataSource {
  data: Data[],
  names: string[]
}

function getDataSource(gameEntries: any) : DataSource {
  const users = new Set(gameEntries.map((m: any) => m.user))
  let userids: string[] = []
  const names: string[] = []
  users.forEach((u: any) => {
    if (!userids.includes(u.id)) {
      userids.push(u.id)
      names.push(u.server_name ?? u.name)
    }
  })

  // TODO: add overlaying line chart to the user that sent the command's score, or maybe the highest scoring user? an argument to the command maybe

  let visitedDayIds: number[] = []
  let data: Data[] = []
  gameEntries.forEach((gameEntry: GameEntry) => {
    let did = formatDayId(gameEntry.day_id)
    if (!visitedDayIds.includes(did)) {
      let sc: string[] = []
      userids.forEach(uid => {
        let userScoreFound = false
        gameEntries.forEach((ge: any) => {
          if (ge.user.id === uid && did == formatDayId(ge.day_id)) {
            userScoreFound = true
            sc.push(ge.score.split("/")[0].replace("X", "7"))
          }
        })
        if (!userScoreFound) {
          sc.push("0")
        }
      })
      visitedDayIds.push(did);
      data.push( {day: did, scores: sc})
    }
  })
  return {
    data: data,
    names: names
  }
}

function xScales(d3: any, data: any, graphWidth: number) {
  // X scale: Categorical days of the week
  const x0 = d3.scaleBand()
    .domain(data.map((d: any) => d.day))
    .range([0, graphWidth])
    .padding(0.2);

  // X scale for grouping (splitting within each day)
  const x1 = d3.scaleBand()
    .domain(d3.range(data[0].scores.length).map(String)) // ["0", "1", "2", ...]
    .range([0, x0.bandwidth()])
    .padding(0.05);

  return {
    x0: x0,
    x1: x1
  }
}

function createScoreBar(
  group: any,
  score: any,
  personIndex: number,
  x1: any,
  y: any,
  colors: any,
  height: number,
  fontSize: number,
  fontFamily: string
): void {
  let scoreHeight = ["0","6","5","4","3","2","1", "X"][Number.parseInt(score)];
  const ylvl = score !== "7" ? y(scoreHeight) : height-40;

  // actual score bars
  group.append("rect")
    .attr("x", x1(String(personIndex)))
    .attr("y", ylvl)
    .attr("width", x1.bandwidth()*0.95)
    .attr("rx", "5")
    .attr("height", height - ylvl)
    .attr("fill", colors[personIndex]); // Assign color per person

  // score text (2, 3, 4) above bars
  group.append("text")
    .attr("x", x1(String(personIndex)) + x1.bandwidth() / 2)
    .attr("y", ylvl - 5)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .style("font-size", `${fontSize}px`) // Bigger text for scores
    .style("font-weight", "bold")
    .style("font-family", fontFamily)
    .text(score.replace("7", "X"));

  const barX = x1(String(personIndex));
  const barY = ylvl;
  const barWidth = x1.bandwidth() * 0.95;
  const barHeight = height - ylvl;

  // If the score is "X", add diagonal black lines
  if (score === "7") {
    const lineGroup = group.append("g")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5);

    // magic numbers that look good on my screen
    for (let i = 0; i <= barHeight-10; i += 27) {
      lineGroup.append("line")
        .attr("x1", barX)
        .attr("y1", barY + i)
        .attr("x2", barX + barWidth)
        .attr("y2", barY + i + 27);
    }
  }
}

function createGraphAxis(svg: any, d3: any, x0: any, y: any, height: number) : void {
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("fill", "white") // Make X labels white
    .style("font-size", `${fontSize}px`) // Bigger text
    .style("font-family", fontFamily);

  // Make X axis lines white
  svg.selectAll(".domain, .tick line")
    .style("stroke", "white");

  // Y Axis (White Lines & Labels)
  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "white") // Make Y labels white
    .style("font-size", `${fontSize}px`) // Bigger text
    .style("font-family", fontFamily);

  svg.selectAll(".domain, .tick line") // Make Y axis lines white
    .style("stroke", "white");
}

// The thing that shows which user owns which color
function createLegend(svg: any, names: string[], colors: string[]) : void {
  const legend = svg.append("g")
    .attr("transform", `translate(0, 0)`); // Position legend outside the chart

  let cx = 20
  names.forEach((name, i) => {
    legend.append("rect")
      .attr("rx", 30)
      .attr("x", cx)
      .attr("y", 5) // More spacing between rows
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", colors[i]);

    legend.append("text")
      .attr("x", cx+25) // Move text further from box
      .attr("y", 25) // Center vertically with box
      .attr("fill", "white")
      .style("font-size", `${fontSize}px`) // Increase font size
      .style("font-weight", "650") // Make text bold
      .style("letter-spacing", "1px")
      .style("font-family", fontFamily)
      .text(name);

    cx += 85 + (name.length)*14
  });
}