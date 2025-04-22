import React from 'react';

export const App = () => {
  return (
    <div>
      <div>
        Hello React!
      </div>
      <button onClick={() => window.location.href = '/Home/home.tsx'}>
        Go to Home
      </button>
    </div>
  );
}
