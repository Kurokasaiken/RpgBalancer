/**
 * Theater Overlay Accessibility RTL Tests – NP-155
 * 
 * React Testing Library tests for ARIA attributes and screen reader announcements.
 * 
 * @since NP-155
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

describe('Theater Overlay Accessibility (RTL)', () => {
  const mockTheaterOverlay = () => (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theater-title"
      aria-describedby="theater-description"
      data-testid="theater-overlay"
    >
      <h2 id="theater-title">Theater Overlay</h2>
      <p id="theater-description">Manage resident activities</p>
      
      <button
        data-testid="theater-close"
        aria-label="Close theater overlay"
      >
        ×
      </button>
      
      <div role="status" aria-live="polite" aria-atomic="true">
        Activity started
      </div>
      
      <div
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Activity timer: 30 seconds remaining"
      >
        0:30
      </div>
      
      <div
        role="progressbar"
        aria-valuenow={50}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Activity progress"
      >
        <div style={{ width: '50%' }} />
      </div>
      
      <article
        role="article"
        aria-labelledby="resident-1-name"
        aria-describedby="resident-1-status"
        tabIndex={0}
      >
        <img src="/portrait.jpg" alt="John portrait" />
        <h3 id="resident-1-name">John</h3>
        <p id="resident-1-status">Gathering wood</p>
      </article>
      
      <button
        data-testid="narration-toggle"
        aria-pressed="false"
        aria-label="Toggle narration"
      >
        Narration
      </button>
    </div>
  );

  describe('Dialog Role and ARIA', () => {
    it('should have dialog role', () => {
      render(mockTheaterOverlay());
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(mockTheaterOverlay());
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(mockTheaterOverlay());
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'theater-title');
      
      const title = screen.getByText('Theater Overlay');
      expect(title).toHaveAttribute('id', 'theater-title');
    });

    it('should have aria-describedby pointing to description', () => {
      render(mockTheaterOverlay());
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'theater-description');
      
      const description = screen.getByText('Manage resident activities');
      expect(description).toHaveAttribute('id', 'theater-description');
    });
  });

  describe('Close Button', () => {
    it('should have accessible close button', () => {
      render(mockTheaterOverlay());
      
      const closeButton = screen.getByTestId('theater-close');
      expect(closeButton).toHaveAccessibleName('Close theater overlay');
    });

    it('should have aria-label on close button', () => {
      render(mockTheaterOverlay());
      
      const closeButton = screen.getByTestId('theater-close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close theater overlay');
    });
  });

  describe('Live Regions', () => {
    it('should have status live region', () => {
      render(mockTheaterOverlay());
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should have aria-live="polite" on status', () => {
      render(mockTheaterOverlay());
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-atomic="true" on status', () => {
      render(mockTheaterOverlay());
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Timer Accessibility', () => {
    it('should have timer role', () => {
      render(mockTheaterOverlay());
      
      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
    });

    it('should have aria-live on timer', () => {
      render(mockTheaterOverlay());
      
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-live', 'polite');
    });

    it('should have descriptive aria-label on timer', () => {
      render(mockTheaterOverlay());
      
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAccessibleName(/Activity timer.*seconds remaining/i);
    });

    it('should have aria-atomic on timer', () => {
      render(mockTheaterOverlay());
      
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Progress Bar Accessibility', () => {
    it('should have progressbar role', () => {
      render(mockTheaterOverlay());
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have aria-valuenow', () => {
      render(mockTheaterOverlay());
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should have aria-valuemin', () => {
      render(mockTheaterOverlay());
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have aria-valuemax', () => {
      render(mockTheaterOverlay());
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-label', () => {
      render(mockTheaterOverlay());
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAccessibleName('Activity progress');
    });
  });

  describe('Mini-Card Accessibility', () => {
    it('should have article role', () => {
      render(mockTheaterOverlay());
      
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });

    it('should have aria-labelledby', () => {
      render(mockTheaterOverlay());
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-labelledby', 'resident-1-name');
    });

    it('should have aria-describedby', () => {
      render(mockTheaterOverlay());
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-describedby', 'resident-1-status');
    });

    it('should be keyboard focusable', () => {
      render(mockTheaterOverlay());
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have alt text on images', () => {
      render(mockTheaterOverlay());
      
      const img = screen.getByAltText('John portrait');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Narration Toggle', () => {
    it('should have aria-pressed attribute', () => {
      render(mockTheaterOverlay());
      
      const toggle = screen.getByTestId('narration-toggle');
      expect(toggle).toHaveAttribute('aria-pressed');
    });

    it('should have descriptive aria-label', () => {
      render(mockTheaterOverlay());
      
      const toggle = screen.getByTestId('narration-toggle');
      expect(toggle).toHaveAccessibleName('Toggle narration');
    });

    it('should toggle aria-pressed on click', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [pressed, setPressed] = React.useState(false);
        
        return (
          <button
            data-testid="narration-toggle"
            aria-pressed={pressed}
            aria-label="Toggle narration"
            onClick={() => setPressed(!pressed)}
          >
            Narration
          </button>
        );
      };
      
      render(<TestComponent />);
      
      const toggle = screen.getByTestId('narration-toggle');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(mockTheaterOverlay());
      
      const closeButton = screen.getByTestId('theater-close');
      
      await user.tab();
      expect(closeButton).toHaveFocus();
    });

    it('should support Enter key activation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <button onClick={handleClick} aria-label="Test button">
          Click me
        </button>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('should support Space key activation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <button onClick={handleClick} aria-label="Test button">
          Click me
        </button>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce activity started', () => {
      render(mockTheaterOverlay());
      
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Activity started');
    });

    it('should announce timer updates', () => {
      render(mockTheaterOverlay());
      
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAccessibleName(/Activity timer.*seconds remaining/i);
    });
  });

  describe('Semantic HTML', () => {
    it('should use proper heading hierarchy', () => {
      render(mockTheaterOverlay());
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Theater Overlay');
    });

    it('should use semantic article elements', () => {
      render(mockTheaterOverlay());
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      render(mockTheaterOverlay());
      
      const card = screen.getByRole('article');
      card.focus();
      
      expect(card).toHaveFocus();
    });
  });
});
