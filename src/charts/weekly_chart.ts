import { D3Node } from 'd3-node';
import sharp from 'sharp';

const styles = `
.bar rect {
  stroke-width: 1;
  stroke: #fff;
}

.bar text {
  fill: #fff;
  font: 18px verdana; /* Increased font size */
  font-weight: bold;
}

/* Make axis lines and ticks white */
.axis path,
.axis line {
  stroke: white;
}

.axis text {
  fill: white;
  font-size: 16px; /* Make axis numbers more readable */
}`;

var options = {
  svgStyles: styles,
}

// Should use profile pic average pixel color here? Need to have names somewhere anwayys
const colors = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"];

export async function generate_weekly_chart(userid: any) {
  const d3n = new D3Node(options); // Initialize D3Node
  const d3 = d3n.d3; // Access the D3.js library

  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 960 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Example data: Scores of 5 people over 7 days
  const data = [
    { day: "Mon", scores: [8, 12, 15, 10, 9] },
    { day: "Tue", scores: [14, 9, 11, 13, 12] },
    { day: "Wed", scores: [10, 15, 14, 9, 8] },
    { day: "Thu", scores: [12, 11, 13, 15, 14] },
    { day: "Fri", scores: [9, 8, 12, 14, 10] },
    { day: "Sat", scores: [15, 14, 9, 10, 12] },
    { day: "Sun", scores: [11, 12, 10, 8, 15] }
  ];
  // Example names for individuals
  const names = ["User1", "User2", "User3", "User4", "User5"];

  const peopleCount = data[0].scores.length; // 5 people

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
    .domain([0, 20]) // Assume max score is 20
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
        .attr("width", x1.bandwidth())
        .attr("height", height - y(score))
        .attr("fill", colors[personIndex]); // Assign color per person

      // Make Score Labels Bigger
      group.append("text")
        .attr("x", x1(String(personIndex)) + x1.bandwidth() / 2)
        .attr("y", y(score) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .style("font-size", "18px") // Bigger text for scores
        .style("font-weight", "bold")
        .text(score);
    });
  });

  // X Axis (White Lines & Labels)
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("fill", "white") // Make X labels white
    .style("font-size", "16px"); // Bigger text

  // Make X axis lines white
    svg.selectAll(".domain, .tick line")
      .style("stroke", "white");

  // Y Axis (White Lines & Labels)
  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "white") // Make Y labels white
    .style("font-size", "16px"); // Bigger text

  svg.selectAll(".domain, .tick line") // Make Y axis lines white
    .style("stroke", "white");


  // Legend (color to person thingy)
  const legend = svg.append("g")
  .attr("transform", `translate(0, 0)`); // Position legend outside the chart

  names.forEach((name, i) => {
    legend.append("rect")
      .attr("x", 30 + (i * 100))
      .attr("y", 5) // More spacing between rows
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", colors[i]);
  
    legend.append("text")
      .attr("x", 55 + (i*100)) // Move text further from box
      .attr("y", 20) // Center vertically with box
      .attr("fill", "white")
      .style("font-size", "18px") // Increase font size
      .style("font-weight", "bold") // Make text bold
      .text(name);
  });
  
  // Convert the SVG to a string
  const svgString = d3n.svgString();

  // Convert the SVG to PNG using sharp
  const pngBuffer = await sharp(Buffer.from(svgString))
    .png()
    .toFile('generated_chart.png');

  return pngBuffer;
}
