import type { Meta, StoryObj } from '@storybook/react';
import ActivityArea, { type ActivityAreaProps } from '@/ui/idleVillage/ActivityArea';
import { createMockActivitySlot, createActivityAreaProps, mockResidentsCandidates } from '@/ui/idleVillage/__tests__/utils/ActivityArea.test-utils';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';

interface StoryArgs extends ActivityAreaProps {
  slotCount: number;
  pickerOpen: boolean;
  dropState: DropState;
}

const meta: Meta<StoryArgs> = {
  title: 'IdleVillage/ActivityArea',
  component: ActivityArea,
  parameters: {
    docs: {
      description: {
        component: `
Gilded Observatory ActivityArea component.

**KPI Notes:**
- Tap to highlight: ≤3 taps required for picker open
- Highlight state: Visual feedback for selected slot with bloom
- Layout variants: Board (desktop) vs Stacked (mobile)
- Drop states: Idle/valid/invalid with appropriate styling
        `,
      },
    },
  },
  argTypes: {
    slotCount: {
      control: { type: 'range', min: 1, max: 6 },
      description: 'Number of demo slots to render',
    },
    pickerOpen: {
      control: 'boolean',
      description: 'Whether picker is open for first slot',
    },
    dropState: {
      control: { type: 'select' },
      options: ['idle', 'valid', 'invalid'],
      description: 'Drop state for slots',
    },
    layout: {
      control: { type: 'select' },
      options: ['board', 'stacked'],
      description: 'Layout variant',
    },
  },
  args: {
    slotCount: 3,
    pickerOpen: false,
    dropState: 'idle' as DropState,
    layout: 'board',
  } as StoryArgs,
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const DesktopBoard: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: (args) => {
    const slots = Array.from({ length: args.slotCount }, (_, i) =>
      createMockActivitySlot({
        slotId: `slot_${i}`,
        label: `Activity ${i + 1}`,
        visualVariant: (['azure', 'ember', 'jade'] as const)[i % 3],
      }),
    );
    const slotDropStates = args.dropState !== 'idle'
      ? Object.fromEntries(slots.map(slot => [slot.slotId, args.dropState]))
      : {};
    const selectedSlotId = args.pickerOpen ? slots[0]?.slotId : undefined;
    const props = createActivityAreaProps({
      ...args,
      slots,
      slotDropStates,
      selectedSlotId,
      highlightSelectedSlot: args.pickerOpen,
      residentsCandidates: args.pickerOpen ? mockResidentsCandidates : undefined,
      onAssign: args.pickerOpen ? () => {} : undefined,
      onClose: args.pickerOpen ? () => {} : undefined,
      onSlotClick: args.pickerOpen ? (slotId: string) => console.log('slot clicked', slotId) : undefined,
    });
    return <ActivityArea {...props} />;
  },
};

export const MobileStacked: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    layout: 'stacked',
  },
  render: (args) => {
    const slots = Array.from({ length: args.slotCount }, (_, i) =>
      createMockActivitySlot({
        slotId: `slot_${i}`,
        label: `Activity ${i + 1}`,
        visualVariant: (['azure', 'ember', 'jade'] as const)[i % 3],
      }),
    );
    const slotDropStates = args.dropState !== 'idle'
      ? Object.fromEntries(slots.map(slot => [slot.slotId, args.dropState]))
      : {};
    const selectedSlotId = args.pickerOpen ? slots[0]?.slotId : undefined;
    const props = createActivityAreaProps({
      ...args,
      slots,
      slotDropStates,
      selectedSlotId,
      highlightSelectedSlot: args.pickerOpen,
      residentsCandidates: args.pickerOpen ? mockResidentsCandidates : undefined,
      onAssign: args.pickerOpen ? () => {} : undefined,
      onClose: args.pickerOpen ? () => {} : undefined,
      onSlotClick: args.pickerOpen ? (slotId: string) => console.log('slot clicked', slotId) : undefined,
    });
    return <ActivityArea {...props} />;
  },
};
