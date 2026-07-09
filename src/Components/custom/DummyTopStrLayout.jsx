import React from "react";

export const DummyTopStrLayout = () => {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Store to Pincode Customer(%) Top 3 Stores</th>
          <th style={styles.th}>Store to Pincode Revenue(%) Top 3 Stores</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={4} style={styles.noData}>
            No Records Found
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #000",
  },
  th: {
    padding: "12px",
    border: "1px solid #000",
    textAlign: "left",
    fontSize: "12px",
  },
  noData: {
    padding: "40px",
    border: "1px solid #000",
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
};
