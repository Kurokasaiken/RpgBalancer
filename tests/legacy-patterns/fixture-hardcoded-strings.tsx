// Test fixture: This file SHOULD FAIL the legacy patterns check
// It contains hardcoded strings that should pass through i18n

import React from 'react';

export const BadComponent = () => {
  return (
    <div>
      <h1>Welcome to the Game</h1>
      <p>This is a hardcoded string that should use t()</p>
      <button>Click Me</button>
    </div>
  );
};
