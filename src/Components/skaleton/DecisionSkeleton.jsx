import "../Styles/DecisionSkeleton.css";

const DecisionSkeleton = () => {
  return (
    <div className='skeleton_container'>
      <div className='skeleton_col'>
        <div className='skeleton_bar short'></div>
        <div className='skeleton_bar medium'></div>
      </div>
      <div className='skeleton_col'>
        <div className='skeleton_bar long'></div>
        <div className='skeleton_bar long'></div>
        <div className='skeleton_bar medium'></div>
      </div>
    </div>
  );
};

export default DecisionSkeleton;
