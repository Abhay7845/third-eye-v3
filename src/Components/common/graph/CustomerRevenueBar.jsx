import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import { colorPairs } from "../../Data/Data";

/* draw bar with two colours */
const SplitBar = (props) => {
  const { x, y, width, height, payload } = props;
  const bottomH = Math.min(30, height * 0.2); // ~20 % of bar
  const [topColor, bottomColor] = payload.color;

  return (
    <g>
      {/* bottom – orders */}
      <rect
        x={x}
        y={y + height - bottomH}
        width={width}
        height={bottomH}
        fill={bottomColor}
      />
      {/* top – revenue */}
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

const CustomerRevenueBar = ({ monthOver, height }) => {
  const dataList = monthOver.map((item, index) => {
    return {
      customers: item.customers,
      month: item.month,
      value: Number(item.revenueByCustomer),
      color: colorPairs[index % colorPairs.length],
    };
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width='100%' height={height}>
        <BarChart data={dataList} barSize={45}>
          <XAxis
            dataKey='month'
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ dy: 10, fontSize: 12, fill: "#333" }}
          />
          <YAxis hide domain={[0, "dataMax + 10000"]} />
          {/* <Legend
            layout='horizontal'
            verticalAlign='top'
            align='end'
            payload={[
              {
                id: "values",
                type: "square",
                value: "Revenue",
                color: "#ffd3a4",
              },
              {
                id: "customers",
                type: "square",
                value: "Customers",
                color: "#e27411",
              },
            ]}
          /> */}

          <Bar dataKey='value' shape={SplitBar}>
            {/* ₹ vertical label */}
            <LabelList
              dataKey='value'
              content={({ x, y, width, value }) => {
                if (!value) return null;
                return (
                  <text
                    x={x + width / 1.6}
                    y={y + 12}
                    transform={`rotate(-90, ${x + width / 2}, ${y + 8})`}
                    fontWeight={600}
                    fontSize={13}
                    textAnchor='end'>
                    ₹
                    {parseFloat(
                      parseFloat(value / 10000000).toFixed(1)
                    ).toLocaleString()}
                    Cr
                  </text>
                );
              }}
            />
            {/* bottom count label */}
            <LabelList
              dataKey='customers'
              content={({ x, y, width, height, value }) => {
                if (!value) return null;
                return (
                  <text
                    x={x + width / 2 + 0}
                    y={y + height - 6}
                    fontWeight={600}
                    fontSize={13}
                    fill='#000'
                    textAnchor='middle'>
                    {value.toLocaleString()}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomerRevenueBar;
