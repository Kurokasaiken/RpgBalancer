# Storybook & Accessibility Testing Guide

## Overview

This guide covers the Storybook setup and accessibility testing workflow for the RPG Balancer project. We use Storybook for component development, documentation, and accessibility testing with axe-core integration.

## 🎯 Objectives

- **Component Documentation**: Comprehensive visual documentation of all UI components
- **Accessibility Testing**: Automated a11y testing using axe-core
- **Design System**: Consistent component variants and states
- **Development Workflow**: Streamlined component development and testing

## 📁 File Structure

```
.storybook/
├── main.ts              # Storybook configuration
├── preview.ts           # Global parameters and decorators
└── test-runner.ts       # axe-core accessibility testing

src/ui/idleVillage/components/
├── *.stories.tsx        # Component stories
└── AccessibilityAudit.tsx  # Real-time a11y testing component
```

## 🛠️ Configuration

### Storybook Setup

The Storybook configuration includes:

- **Essential Addons**: Controls, actions, docs, and viewport
- **Accessibility Addon**: axe-core integration for real-time testing
- **Interactions Addon**: Component interaction testing
- **TypeScript Support**: Full TypeScript documentation

### Accessibility Testing

Automated accessibility testing is configured with:

```typescript
// .storybook/test-runner.ts
import { injectAxe, checkA11y } from 'axe-playwright';

// Runs axe-core on every story
await checkA11y(page, {
  detailedReport: true,
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'aria-labels': { enabled: true },
    'focus-management': { enabled: true },
  },
});
```

## 📖 Story Writing Guidelines

### Component Stories Structure

Each component story should include:

1. **Meta Configuration**: Component metadata and controls
2. **Default Export**: Component documentation
3. **Story Variants**: Different states and configurations
4. **Accessibility Examples**: A11y testing scenarios

### Example Story Structure

```typescript
const meta: Meta<typeof Component> = {
  title: 'Category/ComponentName',
  component: Component,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Component description and usage',
      },
    },
  },
  argTypes: {
    // Interactive controls for props
  },
};
```

### Required Story Variants

For each component, create stories for:

- **Default State**: Basic usage
- **Interactive States**: Hover, focus, active
- **Variants**: Different visual themes (azure, ember, jade, etc.)
- **Accessibility**: A11y testing scenarios
- **Edge Cases**: Loading, error, empty states

## 🧪 Accessibility Testing

### Automated Testing

Run accessibility tests on all stories:

```bash
# Test all stories for accessibility
npm run test-storybook

# Test specific component
npm run test-storybook -- --stories "IdleVillage/Components/ActivitySlot"
```

### Manual Testing

Use the AccessibilityAudit component for real-time testing:

```typescript
<AccessibilityAudit
  enabled={true}
  showDetails={true}
  onViolationFound={(violation) => console.log(violation)}
/>
```

### axe-core Rules

We test against these key accessibility rules:

1. **Color Contrast**: WCAG AA compliance for text colors
2. **Keyboard Navigation**: All interactive elements keyboard accessible
3. **ARIA Labels**: Proper labeling for screen readers
4. **Focus Management**: Logical focus order and visible focus indicators

## 🎨 Component Variants

### Visual Themes

All components support these visual variants:

- **Azure**: Blue theme for water/forest activities
- **Ember**: Orange theme for fire/danger activities  
- **Jade**: Green theme for nature/growth activities
- **Amethyst**: Purple theme for magic/quest activities
- **Solar**: Yellow theme for light/holy activities

### Interaction States

Components should demonstrate:

- **Idle**: Default resting state
- **Hover**: Mouse hover state
- **Focus**: Keyboard focus state
- **Active**: Click/activation state
- **Disabled**: Non-interactive state
- **Loading**: Progress/processing state

## 📋 Development Workflow

### Creating New Stories

1. **Create Story File**: `ComponentName.stories.tsx`
2. **Import Dependencies**: Component, types, and Storybook utilities
3. **Configure Meta**: Title, parameters, and argTypes
4. **Write Stories**: Default and variant stories
5. **Test Accessibility**: Verify a11y compliance
6. **Add Documentation**: Component usage examples

### Testing Checklist

Before submitting stories, verify:

- [ ] All component props have controls
- [ ] Visual variants are displayed
- [ ] Interaction states work correctly
- [ ] Accessibility tests pass
- [ ] Documentation is complete
- [ ] Stories follow naming conventions

### Running Tests

```bash
# Start Storybook for development
npm run storybook

# Build static Storybook
npm run build-storybook

# Run accessibility tests
npm run test-storybook

# Run with specific configuration
npm run test-storybook -- --config-dir .storybook
```

## 🔧 Configuration Options

### Storybook Parameters

Global parameters available in stories:

```typescript
parameters: {
  layout: 'centered' | 'fullscreen',
  docs: {
    toc: true,                    // Table of contents
    description: { component: '...' },
  },
  backgrounds: {
    default: 'light',
    values: ['light', 'dark', 'gilded-observatory'],
  },
  a11y: {
    config: { /* axe-core rules */ },
  },
}
```

### Global Types

Configure global types for consistent controls:

```typescript
globalTypes: {
  theme: {
    description: 'Component theme',
    toolbar: {
      items: ['light', 'dark', 'gilded-observatory'],
    },
  },
}
```

## 📊 Reporting

### Accessibility Reports

axe-core generates detailed reports including:

- **Violation Summary**: Count and severity of issues
- **Rule Details**: Specific WCAG violations
- **Element Information**: DOM elements with issues
- **Recommendations**: How to fix violations

### Test Results

Test runner outputs:

- **Pass/Fail Status**: Overall test results
- **Coverage Report**: Components tested
- **Performance Metrics**: Test execution time
- **Error Details**: Failed test information

## 🚀 Best Practices

### Component Design

- **Config-First**: Use configuration for all styling and behavior
- **Accessibility First**: Design with a11y in mind from start
- **Consistent Props**: Use standard prop names across components
- **Type Safety**: Full TypeScript coverage

### Story Organization

- **Logical Grouping**: Group related components together
- **Clear Naming**: Use descriptive story names
- **Documentation**: Include usage examples and prop descriptions
- **Testing**: Cover all interaction states and variants

### Performance

- **Lazy Loading**: Load stories on demand
- **Optimized Builds**: Minimize bundle size
- **Caching**: Enable browser caching for static builds
- **CDN Deployment**: Use CDN for production Storybook

## 🛠️ Troubleshooting

### Common Issues

1. **TypeScript Errors**: Check imports and type definitions
2. **Accessibility Failures**: Review axe-core rules and component markup
3. **Build Errors**: Verify Storybook configuration syntax
4. **Missing Stories**: Check file paths and naming conventions

### Debug Mode

Enable debug mode for detailed logging:

```bash
npm run storybook -- --debug-webpack
```

### Accessibility Debugging

Use browser dev tools to debug:

```typescript
// Console logging for violations
onViolationFound: (violation) => {
  console.group('Accessibility Violation');
  console.log('Rule:', violation.rule);
  console.log('Element:', violation.element);
  console.log('Help:', violation.help);
  console.groupEnd();
}
```

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)

## 🔄 Maintenance

Regular maintenance tasks:

- **Update Dependencies**: Keep Storybook and addons current
- **Review Stories**: Ensure stories match component changes
- **Audit Accessibility**: Regular a11y testing and improvements
- **Documentation**: Keep guides and examples up to date

---

This guide ensures consistent, accessible, and well-documented components across the RPG Balancer project.
