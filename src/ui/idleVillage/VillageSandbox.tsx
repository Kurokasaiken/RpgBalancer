import { useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

type Resident = {
  id: string;
  name: string;
  status: 'idle' | 'working' | 'injured';
};

type Slot = {
  id: string;
  residentId: string | null;
  activityName: string;
};

const DraggableResident = ({ resident }: { resident: Resident }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `resident-${resident.id}`,
    data: { type: 'resident', id: resident.id }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center 
                 text-xl font-bold text-amber-900 shadow-md cursor-move select-none"
    >
      {resident.name[0].toUpperCase()}
    </div>
  );
};

const ActivitySlot = ({ slot, onDrop }: { slot: Slot; onDrop: (residentId: string) => void }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slot.id}`,
    data: { type: 'slot', id: slot.id }
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const residentId = e.dataTransfer.getData('residentId');
    if (residentId) {
      onDrop(residentId);
    }
  };

  return (
    <div
      ref={setNodeRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center
                ${isOver ? 'border-amber-400 bg-amber-50' : 'border-gray-400'}
                 transition-colors duration-200`}
    >
      {slot.residentId ? (
        <div className="text-center">
          <div className="text-sm font-medium">{slot.activityName}</div>
          <div className="text-2xl font-bold">30s</div>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">Drop here</span>
      )}
    </div>
  );
};

const VillageSandbox = () => {
  const [residents] = useState<Resident[]>([
    { id: '1', name: 'Alice', status: 'idle' },
    { id: '2', name: 'Bob', status: 'idle' },
  ]);

  const [slots, setSlots] = useState<Slot[]>([
    { id: '1', residentId: null, activityName: 'Mining' },
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  const handleDrop = (slotId: string, residentId: string) => {
    setSlots(prev => 
      prev.map(slot => 
        slot.id === slotId 
          ? { ...slot, residentId }
          : slot.residentId === residentId 
            ? { ...slot, residentId: null }
            : slot
      )
    );
  };

  const activeResident = residents.find(r => `resident-${r.id}` === activeId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Village Sandbox</h1>
      
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-medium mb-4">Residents</h2>
            <div className="flex space-x-4">
              {residents.map(resident => (
                <DraggableResident key={resident.id} resident={resident} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">Activity Slots</h2>
            <div className="flex space-x-6">
              {slots.map(slot => (
                <ActivitySlot 
                  key={slot.id} 
                  slot={slot}
                  onDrop={(residentId) => handleDrop(slot.id, residentId)}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeResident ? (
            <div className="w-12 h-12 rounded-full bg-amber-300 flex items-center justify-center 
                         text-xl font-bold text-amber-900 shadow-lg opacity-70">
              {activeResident.name[0].toUpperCase()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default VillageSandbox;
