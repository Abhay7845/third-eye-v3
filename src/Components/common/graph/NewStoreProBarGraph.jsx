import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

const color = ["#e71010ff", "#de4b4bf0", "#f5888bff"];

const NewStoreProBarGraph = ({ cannibalizationPeriod, height }) => {
  const data = cannibalizationPeriod.map((item, i) => {
    return {
      name: item.storeCode,
      value: item.f36RevLoss,
      color: color[i],
    };
  });

  return (
    <ResponsiveContainer
      width='100%'
      height={height}
      style={{ overflow: "visible" }}>
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 8, right: 100, bottom: 10, left: 10 }}>
        <YAxis
          type='category'
          dataKey='name'
          tick={{ fontSize: 12, fontWeight: "bold" }}
          axisLine={false}
          tickLine={false}
        />
        <XAxis
          type='number'
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `₹ ${value}L`}
        />
        <Bar
          dataKey='value'
          barSize={20}
          radius={[0, 10, 10, 0]}
          isAnimationActive={true}
          animationBegin={200}
          animationDuration={1000}
          animationEasing='ease-in-out'>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <LabelList
            dataKey='value'
            position='right'
            offset={10}
            formatter={(value) => `₹ ${value}L`}
            style={{ fontWeight: "bold", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default NewStoreProBarGraph;
