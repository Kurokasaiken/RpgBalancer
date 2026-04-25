import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

/**
 * TemporaryTimeStatus - Intentionally minimal runtime-bound component
 * 
 * This is a TEMPORARY component for the vertical slice.
 * It will be replaced later with the final polished day/night component.
 * 
 * Data contract: reads only real runtime/store state
 * No fancy visual logic, no polish, easy to replace.
 */
export default function TemporaryTimeStatus() {
  const gameplayState = useMinimalGameplayStore();

  return (
    <div className="flex flex-col justify-center space-y-3">
      {/* Current phase display */}
      <div className="text-center">
        <div className="text-sm font-medium">
          {gameplayState.state.isDayPhase ? 'Day' : 'Night'}
        </div>
        <div className="text-xs text-gray-600">
          {gameplayState.state.isPaused ? 'Paused' : 'Running'}
        </div>
      </div>
      
      {/* Simple progress bar */}
      <div className="w-full">
        <div className="text-xs text-gray-600 mb-1">Cycle Progress</div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(gameplayState.state.cycleProgress || 0) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          {((gameplayState.state.cycleProgress || 0) * 10).toFixed(1)}/10
        </div>
      </div>
      
      {/* Control button */}
      <button
        onClick={() => gameplayState.state.isPaused ? gameplayState.resumeGame('user') : gameplayState.pauseGame('user')}
        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 w-full"
      >
        {gameplayState.state.isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
}
