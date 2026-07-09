import React from "react";

export const DummyCanLayout = () => {
  return (
    <table style={styles.table}>
      <thead></thead>
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
  },
  th: {
    padding: "12px",
    textAlign: "left",
    fontSize: "12px",
  },
  noData: {
    padding: "48px",
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
};
