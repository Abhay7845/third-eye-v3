import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Legend,
} from "recharts";

const color3Y = "#f83e3e"; // 3 Year
const color1Y = "#f58337"; // 1 Year

const NewStoreProBarGraph = ({ cannibalizationPeriod, height }) => {
  const data = cannibalizationPeriod.map((item) => ({
    name: item.storeCode,
    value3Y: item.f36RevLoss, // 3 Year
    value1Y: item.f12RevLoss, // 1 Year
  }));

  return (
    <ResponsiveContainer
      width='100%'
      height={height}
      style={{ overflow: "visible" }}>
      <BarChart
        layout='vertical'
        data={data}
        barCategoryGap={18}
        margin={{ top: 20, right: 120, bottom: 10, left: 10 }}>
        {/* Store Names */}
        <YAxis
          type='category'
          dataKey='name'
          tick={{ fontSize: 12, fontWeight: "bold" }}
          axisLine={false}
          tickLine={false}
        />

        {/* Revenue Axis */}
        <XAxis
          type='number'
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `₹ ${value}L`}
        />
        <Legend />
        <Bar
          dataKey='value3Y'
          name='3 Years'
          fill={color3Y}
          barSize={14}
          radius={[0, 8, 8, 0]}>
          <LabelList
            dataKey='value3Y'
            position='right'
            formatter={(value) => `₹ ${value}L`}
            style={{ fontWeight: "bold", fontSize: 11 }}
          />
        </Bar>

        <Bar
          dataKey='value1Y'
          name='1 Year'
          fill={color1Y}
          barSize={14}
          radius={[0, 8, 8, 0]}>
          <LabelList
            dataKey='value1Y'
            position='right'
            formatter={(value) => `₹ ${value}L`}
            style={{ fontWeight: "bold", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default NewStoreProBarGraph;
