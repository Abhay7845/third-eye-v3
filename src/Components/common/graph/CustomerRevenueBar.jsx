import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

const colorPairs = [
  ["#f4a261", "#e76f51"],
  ["#90caf9", "#1e88e5"],
  ["#ffcc80", "#fb8c00"],
  ["#a5d6a7", "#43a047"],
  ["#ffe082", "#fbc02d"],
  ["#80cbc4", "#00897b"],
  ["#ef9a9a", "#e53935"],
  ["#ce93d8", "#8e24aa"],
];

const SplitBar = ({ x, y, width, height, payload }) => {
  if (!payload) return null;
  const bottomH = Math.min(20, height * 0.25);
  const [topColor, bottomColor] = payload.color || ["#8884d8", "#82ca9d"];

  return (
    <g>
      <rect
        x={x}
        y={y + height - bottomH}
        width={width}
        height={bottomH}
        fill={bottomColor}
      />

      <rect
        x={x}
        y={y}
        width={width}
        height={height - bottomH}
        fill={topColor}
      />
    </g>
  );
};

const CustomerRevenueBar = ({ monthOver = [], height = 300, fixedWidth }) => {
  const dataList = monthOver.map((item, index) => ({
    customers: item.customers || 0,
    month: item.month,
    value: Number(item.revenueByCustomer || 0),
    color: colorPairs[index % colorPairs.length],
  }));

  const chartContent = (
    <BarChart
      data={dataList}
      barCategoryGap='25%'
      width={fixedWidth}
      height={height}>
      <XAxis
        dataKey='month'
        tickLine={false}
        axisLine={false}
        interval={0}
        tick={{ dy: 10, fontSize: 12 }}
      />
      <YAxis hide domain={[0, "dataMax + 10000"]} />
      <Bar dataKey='value' shape={<SplitBar />} minPointSize={8}>
        <LabelList
          dataKey='value'
          content={({ x, y, width, height, value }) => {
            if (!value) return null;
            const displayValue = `₹${(value / 10000000).toFixed(1)}Cr`;
            if (height < 50) {
              return (
                <text
                  x={x + width / 2}
                  y={y - 5}
                  textAnchor='middle'
                  fontSize={11}
                  fontWeight={600}>
                  {displayValue}
                </text>
              );
            }

            return (
              <text
                x={x + width / 2}
                y={y + 10}
                transform={`rotate(-90, ${x + width / 2}, ${y + 10})`}
                textAnchor='end'
                fontSize={11}
                fontWeight={600}>
                {displayValue}
              </text>
            );
          }}
        />

        <LabelList
          dataKey='customers'
          content={({ x, y, width, height, value }) => {
            if (!value) return null;
            const posY = height < 30 ? y + height + 14 : y + height - 6;
            return (
              <text
                x={x + width / 2}
                y={posY}
                textAnchor='middle'
                fontSize={12}
                fontWeight={600}
                fill='#000'>
                {value.toLocaleString()}
              </text>
            );
          }}
        />
      </Bar>
    </BarChart>
  );

  return (
    <div style={{ width: "100%", height, overflow: "hidden" }}>
      {fixedWidth ? (
        <div style={{ width: `${fixedWidth}px`, margin: "0 auto" }}>
          {chartContent}
        </div>
      ) : (
        <ResponsiveContainer>
          <BarChart data={dataList} barCategoryGap='25%'>
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ dy: 10, fontSize: 12 }}
            />
            <YAxis hide domain={[0, "dataMax + 10000"]} />
            <Bar dataKey='value' shape={<SplitBar />} minPointSize={8}>
              <LabelList
                dataKey='value'
                content={({ x, y, width, height, value }) => {
                  if (!value) return null;
                  const displayValue = `₹${(value / 10000000).toFixed(1)}Cr`;
                  if (height < 50) {
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 5}
                        textAnchor='middle'
                        fontSize={11}
                        fontWeight={600}>
                        {displayValue}
                      </text>
                    );
                  }

                  return (
                    <text
                      x={x + width / 2}
                      y={y + 10}
                      transform={`rotate(-90, ${x + width / 2}, ${y + 10})`}
                      textAnchor='end'
                      fontSize={11}
                      fontWeight={600}>
                      {displayValue}
                    </text>
                  );
                }}
              />

              <LabelList
                dataKey='customers'
                content={({ x, y, width, height, value }) => {
                  if (!value) return null;
                  const posY = height < 30 ? y + height + 14 : y + height - 6;
                  return (
                    <text
                      x={x + width / 2}
                      y={posY}
                      textAnchor='middle'
                      fontSize={12}
                      fontWeight={600}
                      fill='#000'>
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

export default CustomerRevenueBar;
