import React from "react";
import "../Styles/AdminDashboard.css";
import UserActivityCards from "./UserActivityCards";
import { IoIosList } from "react-icons/io";

const AdminDashboard = ({ data, setOpenSumTbl, setOpenDailySumTbl }) => {
  if (!data) return null;
  const totalReLogins = data.userSummary.reduce(
    (sum, user) => sum + user.reLoginCount,
    0,
  );

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

  const sortedUsers = sortUsersByPreviousDay(data?.userSummary).slice(0, 3);

  return (
    <div className='dashboard'>
      <div className='dashboard-header'>
        <div>
          <h2>Login Activity</h2>
          <p>
            {data.fromDate} - {data.toDate}
          </p>
        </div>
        <div className='header-badges'>
          <div className='header-badge city-badge'>Store Report: 0</div>
          <div className='header-badge store-badge'>City Report: 0</div>
          <div className='header-badge events-badge'>
            {data.events.length} Events
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='summary-grid'>
        <div className='summary-card blue'>
          <h2>{data.totalLogins}</h2>
          <span>Total Logins</span>
        </div>

        <div className='summary-card green'>
          <h2>{data.totalUsers}</h2>
          <span>Total Users</span>
        </div>

        <div className='summary-card orange'>
          <h2>{totalReLogins}</h2>
          <span>Re-Logins</span>
        </div>

        <div className='summary-card purple'>
          <h2>{data.events.length}</h2>
          <span>History</span>
        </div>
      </div>

      {/* User Cards */}

      <div className='dashboard-card'>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>User Summary</h2>
          {data?.userSummary?.length > 3 && (
            <IoIosList
              size={20}
              cursor='pointer'
              title='View Full List'
              onClick={() => setOpenSumTbl(true)}
            />
          )}
        </div>
        <div className='user-grid'>
          {sortedUsers?.map((user) => (
            <div className='user-card' key={user.email}>
              <div className='avatar'>
                {user.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .substring(0, 2)}
              </div>

              <div className='user-info'>
                <h3>{user.name}</h3>

                <p>{user.email}</p>

                <div className='user-stats'>
                  <span>
                    <strong>{user.loginCount}</strong>
                    Login
                  </span>
                  <span>
                    <strong>{user.reLoginCount}</strong>
                    Re-login
                  </span>
                </div>

                <div className='login-times'>
                  <small>
                    First :{new Date(user.firstLoginAt).toLocaleString()}
                  </small>

                  <small>
                    Last :{new Date(user.lastLoginAt).toLocaleString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Summary */}

      <div className='dashboard-card'>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Daily Summary</h2>
          {data?.dailySummary?.length > 4 && (
            <IoIosList
              size={20}
              cursor='pointer'
              title='View Full List'
              onClick={() => setOpenDailySumTbl(true)}
            />
          )}
        </div>
        <div className='daily-grid'>
          {data?.dailySummary?.slice(0, 4)?.map((day) => (
            <div className='daily-card' key={day.date}>
              <h3>{day.date}</h3>
              <div className='daily-value'>{day.totalLogins}</div>
              <p>Logins</p>
              <small>{day.totalUsers} Users</small>
            </div>
          ))}
        </div>
      </div>
      <div className='dashboard-card'>
        <h2>Recent Login Events</h2> <UserActivityCards users={data?.events} />
      </div>
    </div>
  );
};

export default AdminDashboard;
