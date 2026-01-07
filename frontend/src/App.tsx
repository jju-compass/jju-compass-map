import React from 'react';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>JJU Compass Map</h1>
        <p>전주대학교 위치 검색 서비스</p>
      </header>
      <main className="app-main">
        <div className="loading-message">
          <p>지도를 불러오는 중...</p>
        </div>
      </main>
    </div>
  );
};

export default App;
