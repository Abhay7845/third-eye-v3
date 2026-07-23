import React from "react";
import "../Styles/AdminDashboard.css";

const AdminDashboard = ({ data }) => {
  if (!data) return null;

  const totalReLogins = data.userSummary.reduce(
    (sum, user) => sum + user.reLoginCount,
    0,
  );

  return (
    <div className='dashboard'>
      <div className='dashboard-header'>
        <div>
          <h2>Login Activity Dashboard</h2>
          <p>
            {data.fromDate} - {data.toDate}
          </p>
        </div>
        <div className='header-badge'>{data.events.length} Events</div>
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
          <span>Total Events</span>
        </div>
      </div>

      {/* User Cards */}

      <div className='dashboard-card'>
        <h2>User Summary</h2>
        <div className='user-grid'>
          {data.userSummary.map((user) => (
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
        <h2>Daily Summary</h2>

        <div className='daily-grid'>
          {data.dailySummary.map((day) => (
            <div className='daily-card' key={day.date}>
              <h3>{day.date}</h3>

              <div className='daily-value'>{day.totalLogins}</div>

              <p>Logins</p>

              <small>{day.totalUsers} Users</small>
            </div>
          ))}
        </div>
      </div>

      {/* Events */}

      <div className='dashboard-card'>
        <h2>Recent Login Events</h2>

        <div className='table-wrapper'>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((event, index) => (
                <tr key={index}>
                  <td>{new Date(event.timestamp).toLocaleString()}</td>
                  <td>
                    <strong>{event.name}</strong>
                    <br />
                    <small>{event.email}</small>
                  </td>
                  <td>{event.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
