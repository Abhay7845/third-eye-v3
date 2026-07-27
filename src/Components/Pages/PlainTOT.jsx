import React from "react";
import TotTableInfo from "../../Plain_tot/TotTableInfo";
import "../../Plain_tot/totstyle/PlainTOT.css";

const PlainTOT = () => {
  const data = [
    {
      category: "LCG",
      Y1: 2699,
      Y2: 3304,
      Y3: 3692,
      Y4: 4125,
      Y5: 4544,
      Y6: 4908,
    },
    {
      category: "MCG",
      Y1: 5606,
      Y2: 6861,
      Y3: 7668,
      Y4: 8567,
      Y5: 9438,
      Y6: 10193,
    },
    {
      category: "HCG",
      Y1: 2076,
      Y2: 2541,
      Y3: 2840,
      Y4: 3173,
      Y5: 3496,
      Y6: 3775,
    },
    {
      category: "Coins",
      Y1: 752,
      Y2: 921,
      Y3: 1044,
      Y4: 1184,
      Y5: 1304,
      Y6: 1409,
    },
  ];

  const columns = ["Y1", "Y2", "Y3", "Y4", "Y5", "Y6"];
  return (
    <React.Fragment>
      <div className='tot_table_layout'>
        <TotTableInfo title='UCP Sales' data={data} columns={columns} />
        <TotTableInfo title='Projected Sales' data={data} columns={columns} />
        <TotTableInfo title='UCP Sales' data={data} columns={columns} />
      </div>
      <div className='tot_table_layout'>
        <TotTableInfo title='Projected Sales' data={data} columns={columns} />
        <TotTableInfo title='UCP Sales' data={data} columns={columns} />
        <TotTableInfo title='Projected Sales' data={data} columns={columns} />
      </div>
    </React.Fragment>
  );
};

export default PlainTOT;
