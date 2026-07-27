import React, { useMemo, useState } from "react";
import "../Styles/UserSummaryTable.css";

const ROWS_PER_PAGE = 6;

export default function DailySummaryTable({ dailySummary }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(dailySummary.length / ROWS_PER_PAGE),
  );

  const tableData = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return dailySummary.slice(start, start + ROWS_PER_PAGE);
  }, [page, dailySummary]);

  return (
    <div className='user_table_card'>
      <div className='table_scroll'>
        <table className='user_table'>
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Users</th>
              <th>Total Logins</th>
            </tr>
          </thead>

          <tbody>
            {tableData.length > 0 ? (
              tableData.map((user) => (
                <tr key={user.email}>
                  <td>{user?.date}</td>
                  <td>{user?.totalUsers}</td>
                  <td>{user?.totalLogins}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='6' className='empty'>
                  No Records Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className='pagination'>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          ◀ Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}>
          Next ▶
        </button>
      </div>
    </div>
  );
}
