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
  

  const d3n = new D3Node(options); // Initialize D3Node
  const d3 = d3n.d3; // Access the D3.js library

  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 1460 - margin.left - margin.right;
  const height = 1000 - margin.top - margin.bottom;

  // TODO these need to be randomly generated or selected based on users profile picture or something, cus this is theoretically infinite
  const colors = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#0f0f0f", "#afafaf", "#c8c8c8"];

  const users = new Set(gameEntries.map(m => m.user))
  let userids: string[] = []
  const names: string[] = []
  users.forEach(u => {
    if (!userids.includes(u.id)) {
      userids.push(u.id)
      names.push(u.server_name ?? u.name)
    }
  })

  /**
   * Outputs newData like this:
   * [
      { day: 1377, scores: [ '4/6', '4/6', '4/6', '6/6' ] },
      { day: 1376, scores: [ 'X/6', '3/6', '3/6', '3/6' ] },
      { day: 1375, scores: [ '-', '5/6', '5/6', '5/6' ] },
      { day: 1374, scores: [ '4/6', '4/6', '-', '3/6' ] }
    ]
   */
  let visitedDayIds: number[] = []
  let data: any = []
  gameEntries.forEach((gameEntry: GameEntry) => {
    let did = formatDayId(gameEntry.day_id)
    if (!visitedDayIds.includes(did)) {
      let sc: string[] = []
      userids.forEach(uid => {
        let userScoreFound = false
        gameEntries.forEach(ge => {
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

  console.log(names)
  console.log(data)

  const peopleCount = data[0].scores.length;

  // X scale: Categorical days of the week
  const x0 = d3.scaleBand()
    .domain(data.map(d => d.day))
    .range([0, width])
    .padding(0.2);

  // X scale for grouping (splitting within each day)
  const x1 = d3.scaleBand()
    .domain(d3.range(peopleCount).map(String)) // ["0", "1", "2", ...]
    .range([0, x0.bandwidth()])
    .padding(0.05);

  // Y scale
  const y = d3.scaleLinear()
    .domain([0, 9]) // Assume max score is 9 (even though it is 7)
    .range([height, 0]);

  const svgWidth = width + margin.left + margin.right;
  const svgHeight = height + margin.top + margin.bottom;

  const svg = d3n.createSVG(svgWidth, svgHeight)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create bars
  data.forEach((d, dayIndex) => {
    const group = svg.append("g")
      .attr("transform", `translate(${x0(d.day)},0)`);

    d.scores.forEach((score, personIndex) => {
      group.append("rect")
        .attr("x", x1(String(personIndex)))
        .attr("y", y(score))
        .attr("width", x1.bandwidth()*0.95)
        .attr("rx", "5")
        .attr("height", height - y(score))
        .attr("fill", colors[personIndex]); // Assign color per person

      // Make Score Labels Bigger
      group.append("text")
        .attr("x", x1(String(personIndex)) + x1.bandwidth() / 2)
        .attr("y", y(score) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .style("font-size", `${fontSize}px`) // Bigger text for scores
        .style("font-weight", "bold")
        .style("font-family", fontFamily)
        .text(score);
    });
  });

  // X Axis (White Lines & Labels)
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


  // Legend (color to person thingy)
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
  
  // Convert the SVG to a string
  const svgString = d3n.svgString();

  // Convert the SVG to PNG using sharp
  const pngBuffer = await sharp(Buffer.from(svgString))
    .png()
    .toFile('generated_chart.png');

  return pngBuffer;
}
