import { D3Node } from 'd3-node';
import sharp from 'sharp';

const styles = `
.bar rect {
  fill: steelblue;
}

.bar text {
  fill: #fff;
  font: 16px sans-serif;
}`

var options = {
  svgStyles: styles,
}

// 
export async function generate_weekly_chart(userid: any) {
  const d3n = new D3Node(options); // Initialize D3Node
  const d3 = d3n.d3; // Access the D3.js library

  // from https://bl.ocks.org/mbostock/3048450
  var data = d3.range(1000).map(d3.randomBates(10))

  var formatCount = d3.format(',.0f')

  var margin = {top: 10, right: 30, bottom: 30, left: 30}
  var width = 960 - margin.left - margin.right
  var height = 500 - margin.top - margin.bottom

  var x = d3.scaleLinear()
    .rangeRound([0, width])

  var bins = d3.histogram()
    .domain(x.domain())
    .thresholds(x.ticks(20))(data)

  var y = d3.scaleLinear()
    .domain([0, d3.max(bins, function (d:any) { return d.length })])
    .range([height, 0])

  const svgWidth = width + margin.left + margin.right
  const svgHeight = height + margin.top + margin.bottom

  var svg = d3n.createSVG(svgWidth, svgHeight)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  var bar = svg.selectAll('.bar')
    .data(bins)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', function (d:any) { return 'translate(' + x(d.x0) + ',' + y(d.length) + ')' })

  bar.append('rect')
    .attr('x', 1)
    .attr('width', x(bins[0].x1) - x(bins[0].x0) - 1)
    .attr('height', function (d:any) { return height - y(d.length) })

  bar.append('text')
    .attr('dy', '.75em')
    .attr('y', 6)
    .attr('x', (x(bins[0].x1) - x(bins[0].x0)) / 2)
    .attr('text-anchor', 'middle')
    .text(function (d:any) { return formatCount(d.length) })

  svg.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x))

  // Convert the SVG to a string
  const svgString = d3n.svgString();

  // Convert the SVG to PNG using sharp
  const pngBuffer = await sharp(Buffer.from(svgString))
    .png()
    .toFile('generated_chart.png');

  return pngBuffer;
}
