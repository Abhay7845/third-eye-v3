import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  YAxis,
  XAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const LineViewGraphTh = ({ data, showTool }) => {
  const formatMonth = (monthStr) => {
    const date = new Date(monthStr + "-01");
    return date.toLocaleString("en-US", { month: "short" });
  };

  const formatThousand = (value) => {
    if (value >= 1000) {
      return value % 1000 === 0
        ? `${value / 1000}k`
        : `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  // Calculate max value + 15% padding
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const max = Math.max(...data.map((d) => d.customers || 0));
    return Math.ceil(max + max * 0.15);
  }, [data]);

  return (
    <ResponsiveContainer height={150} style={{ marginLeft: "-11%" }}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis
          dataKey='month'
          tickFormatter={formatMonth}
          style={{ fontSize: "10px" }}
        />
        <YAxis
          domain={[0, maxValue]}
          tickFormatter={formatThousand}
          style={{ fontSize: "10px" }}
        />
        {showTool && (
          <Tooltip
            formatter={(value) => value}
            labelFormatter={(label) => `Month: ${formatMonth(label)}`}
            wrapperStyle={{ fontSize: "12px" }}
          />
        )}
        <Legend
          wrapperStyle={{
            left: 30,
            position: "absolute",
            fontSize: "10px",
          }}
        />
        <Line
          type='monotone'
          dataKey='customers'
          stroke='#300869'
          strokeWidth={1}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineViewGraphTh;
