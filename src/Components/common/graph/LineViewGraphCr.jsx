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

const LineViewGraphCr = ({ data, showTool }) => {
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const max = Math.max(...data.map((d) => d.revenueByCustomer || 0));
    return Math.ceil(max + max * 0.15);
  }, [data]);

  const formatValue = (value) => {
    if (value >= 10000000) return Math.floor(value / 10000000) + " Cr";
    if (value >= 100000) return Math.floor(value / 100000) + " L";
    if (value >= 1000) return Math.floor(value / 1000) + "K";
    return value;
  };

  const formatMonth = (monthStr) => {
    const date = new Date(monthStr + "-01");
    return date.toLocaleString("en-US", { month: "short" });
  };

  return (
    <ResponsiveContainer height={150} style={{ marginLeft: "-10%" }}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis
          dataKey='month'
          tickFormatter={formatMonth}
          style={{ fontSize: "10px" }}
        />
        <YAxis
          domain={[0, maxValue]}
          tickFormatter={formatValue}
          style={{ fontSize: "10px" }}
        />
        {showTool && (
          <Tooltip
            formatter={(value) => formatValue(value)}
            labelFormatter={(label) => `Month: ${formatMonth(label)}`}
            wrapperStyle={{ fontSize: "12px" }}
          />
        )}
        <Legend
          wrapperStyle={{
            left: 40,
            position: "absolute",
            fontSize: "10px",
          }}
        />
        <Line
          type='monotone'
          dataKey='revenueByCustomer'
          stroke='#993a06'
          strokeWidth={1}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineViewGraphCr;
