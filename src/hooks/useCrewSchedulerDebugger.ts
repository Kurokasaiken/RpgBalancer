import { useState, useEffect } from 'react';
import { PersistenceService } from '../shared/persistence/PersistenceService';

const useCrewSchedulerDebugger = () => {
  const [debuggerData, setDebuggerData] = useState<any>(null);
  const persistenceService = new PersistenceService();

  useEffect(() => {
    const fetchDebuggerData = async () => {
      // TODO: Fetch debugger data from the WS3 crew scheduler system
      const data = await persistenceService.getDebuggerData();
      setDebuggerData(data);
    };
    fetchDebuggerData();
  }, [persistenceService]);

  return { debuggerData };
};

export default useCrewSchedulerDebugger;