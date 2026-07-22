```typescript
import { useState } from 'react';

const useWorldSurfaceState = () => {
  const [underwaterState, setUnderwaterState] = useState({
    // TODO: Define initial underwater state
  });

  return { underwaterState, setUnderwaterState };
};

export default useWorldSurfaceState;