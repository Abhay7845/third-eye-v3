import { useState } from "react";
import "../Styles/UserActivityCards.css";
import { FaCalendarAlt, FaEnvelope, FaCopy, FaCheck } from "react-icons/fa";

const UserActivityCards = ({ users }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  function getCurrentAndPreviousDateData(data) {
    // Get unique dates and sort descending
    const dates = [...new Set(data.map((item) => item.date))].sort(
      (a, b) => new Date(b) - new Date(a),
    );

    const currentDate = dates[0];
    const previousDate = dates[1];

    return data.filter(
      (item) => item.date === currentDate || item.date === previousDate,
    );
  }

  const previousDayData = getCurrentAndPreviousDateData(users);

  const getInitials = (name = "") => {
    const cleanedName = name.replace(/\(.*?\)/g, "").trim();
    const words = cleanedName.split(" ").filter(Boolean);
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const copyToClipboard = async (email, index) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className='activity-container'>
      <div className='activity-grid'>
        {previousDayData?.map((item, index) => (
          <div className='activity-card' key={index}>
            <div className='profile-section'>
              <div className='profile-avatar'>{getInitials(item.name)}</div>
            </div>

            <div className='info-section'>
              <div className='card-top'>
                <div className='date'>
                  <FaCalendarAlt />
                  <span>{item.date}</span>
                </div>

                {/* <div className='status'>
                  <span className='dot'></span>
                  Active
                </div> */}
              </div>

              <h2>{item.name}</h2>

              <div className='email'>
                <div className='email-text'>
                  <FaEnvelope />
                  <span>{item.email}</span>
                </div>

                {copiedIndex === index ? (
                  <FaCheck className='copied-icon' title='Copied' />
                ) : (
                  <FaCopy
                    className='copy-icon'
                    title='Copy Email'
                    onClick={() => copyToClipboard(item.email, index)}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserActivityCards;
