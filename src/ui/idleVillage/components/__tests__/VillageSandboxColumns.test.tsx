import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VillageSandboxColumns from '../VillageSandboxColumns';

describe('VillageSandboxColumns', () => {
  it('renders board layout by default', () => {
    const { container } = render(
      <VillageSandboxColumns
        leftColumn={<div>Left</div>}
        rightColumn={<div>Right</div>}
      />
    );
    expect(container.firstChild).toHaveClass('grid', 'gap-4', 'lg:grid-cols-3');
    expect(screen.getByTestId('village-sandbox-left-column')).toHaveClass('lg:col-span-2');
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders stacked layout', () => {
    const { container } = render(
      <VillageSandboxColumns
        leftColumn={<div>Left</div>}
        rightColumn={<div>Right</div>}
        layout="stacked"
      />
    );
    expect(container.firstChild).toHaveClass('flex', 'flex-col', 'gap-2');
    expect(screen.getByTestId('village-sandbox-left-column')).toHaveClass('order-first');
    expect(screen.getByTestId('village-sandbox-right-column')).toHaveClass('order-last');
    expect(container.firstChild).toMatchSnapshot();
  });

  it('applies custom className and test ids', () => {
    render(
      <VillageSandboxColumns
        leftColumn={<div>Left</div>}
        rightColumn={<div>Right</div>}
        className="custom"
        leftWrapperClassName="left-custom"
        rightWrapperClassName="right-custom"
        layoutTestId="custom-layout"
        leftColumnTestId="custom-left"
        rightColumnTestId="custom-right"
      />
    );
    expect(screen.getByTestId('custom-layout')).toHaveClass('custom');
    expect(screen.getByTestId('custom-left')).toHaveClass('left-custom');
    expect(screen.getByTestId('custom-right')).toHaveClass('right-custom');
  });
});
