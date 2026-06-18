import {
  BarChart,
  Bar,
  XAxis,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";

/* ───────-------------------------------- main chart ───────────────────────────────────────────────────── */
const CityProjectionPopulationGraph = ({ data, height, fixedWidth }) => {
  const chartContent = (
    <BarChart
      data={data}
      barGap={8}
      barCategoryGap='20%'
      width={fixedWidth}
      height={height}>
      {/* No vertical or horizontal grid lines for clarity */}
      <CartesianGrid horizontal={false} vertical={false} />
      <XAxis
        dataKey='category'
        interval={0}
        tick={{ fontSize: 12 }}
        tickLine={false}
      />
      <Legend layout='horizontal' verticalAlign='top' align='end' />
      {/* First Bar: Target Value */}
      <Bar dataKey='targetCity' fill='#f58220' name='Target Value'>
        <LabelList
          dataKey='targetCity'
          content={({ x, y, width, height, value }) => {
            if (!value) return null;
            return (
              <text
                x={x + width / 2}
                y={y + height / 2}
                fontSize={12}
                fontWeight={600}
                transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}
                fill='#000'
                textAnchor='start'
                alignmentBaseline='middle'>
                {value.toLocaleString()}
              </text>
            );
          }}
        />
      </Bar>
      {/* Second Bar: Similar Value */}
      <Bar dataKey='similerCity' fill='#2b6ca3' name='Similar Value'>
        <LabelList
          dataKey='similerCity'
          content={({ x, y, width, height, value }) => {
            if (!value) return null;
            return (
              <text
                x={x + width / 2}
                y={y + height / 2}
                fontSize={12}
                fontWeight={600}
                transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}
                fill='#000'
                textAnchor='start'
                alignmentBaseline='middle'>
                {value.toLocaleString()}
              </text>
            );
          }}
        />
      </Bar>
    </BarChart>
  );

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {fixedWidth ? (
        <div style={{ width: `${fixedWidth}px`, margin: "0 auto" }}>
          {chartContent}
        </div>
      ) : (
        <ResponsiveContainer width='100%' height={height}>
          <BarChart data={data} barGap={8} barCategoryGap='20%'>
            {/* No vertical or horizontal grid lines for clarity */}
            <CartesianGrid horizontal={false} vertical={false} />
            <XAxis
              dataKey='category'
              interval={0}
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <Legend layout='horizontal' verticalAlign='top' align='end' />
            {/* First Bar: Target Value */}
            <Bar dataKey='targetCity' fill='#f58220' name='Target Value'>
              <LabelList
                dataKey='targetCity'
                content={({ x, y, width, height, value }) => {
                  if (!value) return null;
                  return (
                    <text
                      x={x + width / 2}
                      y={y + height / 2}
                      fontSize={12}
                      fontWeight={600}
                      transform={`rotate(-90, ${x + width / 2}, ${
                        y + height / 2
                      })`}
                      fill='#000'
                      textAnchor='start'
                      alignmentBaseline='middle'>
                      {value.toLocaleString()}
                    </text>
                  );
                }}
              />
            </Bar>
            {/* Second Bar: Similar Value */}
            <Bar dataKey='similerCity' fill='#2b6ca3' name='Similar Value'>
              <LabelList
                dataKey='similerCity'
                content={({ x, y, width, height, value }) => {
                  if (!value) return null;
                  return (
                    <text
                      x={x + width / 2}
                      y={y + height / 2}
                      fontSize={12}
                      fontWeight={600}
                      transform={`rotate(-90, ${x + width / 2}, ${
                        y + height / 2
                      })`}
                      fill='#000'
                      textAnchor='start'
                      alignmentBaseline='middle'>
                      {value.toLocaleString()}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CityProjectionPopulationGraph;
