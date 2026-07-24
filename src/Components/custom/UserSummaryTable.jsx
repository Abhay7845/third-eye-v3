import React, { useMemo, useState } from "react";
import "../Styles/UserSummaryTable.css";

const ROWS_PER_PAGE = 6;

export default function UserSummaryTable({ userSummary }) {
  const [page, setPage] = useState(1);

  const sortUsersByPreviousDay = (users) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const previousDate = [
      yesterday.getFullYear(),
      String(yesterday.getMonth() + 1).padStart(2, "0"),
      String(yesterday.getDate()).padStart(2, "0"),
    ].join("-");

    return [...users].sort((a, b) => {
      const aIsPrevious = a.lastLoginAt.startsWith(previousDate);
      const bIsPrevious = b.lastLoginAt.startsWith(previousDate);
      if (aIsPrevious === bIsPrevious) return 0;
      return aIsPrevious ? -1 : 1;
    });
  };

  const sortedUsers = sortUsersByPreviousDay(userSummary?.userSummary);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / ROWS_PER_PAGE));

  const tableData = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return sortedUsers.slice(start, start + ROWS_PER_PAGE);
  }, [page, sortedUsers]);

  return (
    <div className='user_table_card'>
      <div className='table_scroll'>
        <table className='user_table'>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Logins</th>
              <th>Re-Logins</th>
              <th>First Login</th>
              <th>Last Login</th>
            </tr>
          </thead>

          <tbody>
            {tableData.length > 0 ? (
              tableData.map((user) => (
                <tr key={user.email}>
                  <td>
                    <div className='user_info'>
                      <div className='table_avatar'>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>

                  <td>{user.email}</td>

                  <td>
                    <span className='badge blue'>{user.loginCount}</span>
                  </td>

                  <td>
                    <span className='badge green'>{user.reLoginCount}</span>
                  </td>

                  <td>{new Date(user.firstLoginAt).toLocaleString()}</td>

                  <td>{new Date(user.lastLoginAt).toLocaleString()}</td>
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
