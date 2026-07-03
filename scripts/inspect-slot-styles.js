import puppeteer from 'puppeteer';

async function inspectSlotStyles() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to /test page...');
    await page.goto('http://localhost:5173/test', { waitUntil: 'networkidle0' });

    // Wait for slots to render
    await page.waitForSelector('[data-slot-id]', { timeout: 5000 });

    // Take a screenshot
    await page.screenshot({ path: 'slot-screenshot-test.png', fullPage: false });
    console.log('Screenshot saved to slot-screenshot-test.png');

    console.log('Inspecting slot styles...');

    const slotStyles = await page.evaluate(() => {
      const slots = document.querySelectorAll('[data-slot-id]');
      const results = [];

      slots.forEach((slot, index) => {
        const computed = window.getComputedStyle(slot);
        const slotId = slot.getAttribute('data-slot-id');
        const dropState = slot.getAttribute('data-drop-state');
        
        // Also inspect the SlotV12Renderer inside
        const v12Renderer = slot.querySelector('.slot-v12');
        const v12Computed = v12Renderer ? window.getComputedStyle(v12Renderer) : null;
        
        // Inspect halo element
        const halo = slot.querySelector('.slot-v12__halo');
        const haloComputed = halo ? window.getComputedStyle(halo) : null;
        
        // Inspect SVG
        const svg = slot.querySelector('svg');
        const svgComputed = svg ? window.getComputedStyle(svg) : null;
        
        // Inspect SVG circles (especially the cavity background)
        const circles = svg ? Array.from(svg.querySelectorAll('circle')).map(c => {
          const cComputed = window.getComputedStyle(c);
          return {
            fill: cComputed.fill,
            stroke: cComputed.stroke,
            filter: cComputed.filter,
          };
        }) : [];
        
        // Inspect SVG paths
        const paths = svg ? Array.from(svg.querySelectorAll('path')).map(p => {
          const pComputed = window.getComputedStyle(p);
          return {
            fill: pComputed.fill,
            stroke: pComputed.stroke,
            filter: pComputed.filter,
          };
        }) : [];
        
        results.push({
          index,
          slotId,
          dropState,
          container: {
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            backgroundImage: computed.backgroundImage,
            border: computed.border,
            borderColor: computed.borderColor,
            borderWidth: computed.borderWidth,
            borderStyle: computed.borderStyle,
            boxShadow: computed.boxShadow,
            filter: computed.filter,
            color: computed.color,
            outline: computed.outline,
            outlineColor: computed.outlineColor,
          },
          v12Renderer: v12Computed ? {
            background: v12Computed.background,
            backgroundColor: v12Computed.backgroundColor,
            backgroundImage: v12Computed.backgroundImage,
            boxShadow: v12Computed.boxShadow,
            filter: v12Computed.filter,
          } : null,
          halo: haloComputed ? {
            background: haloComputed.background,
            backgroundColor: haloComputed.backgroundColor,
            backgroundImage: haloComputed.backgroundImage,
            opacity: haloComputed.opacity,
            filter: haloComputed.filter,
          } : null,
          svg: svgComputed ? {
            filter: svgComputed.filter,
          } : null,
          circles,
          paths,
        });
      });

      return results;
    });

    console.log('\n=== SLOT STYLES INSPECTION ===\n');
    slotStyles.forEach((slot) => {
      console.log(`\n--- Slot ${slot.index} (${slot.slotId}) ---`);
      console.log(`Drop State: ${slot.dropState}`);
      console.log('\n[Container]');
      console.log(`  Background: ${slot.container.background}`);
      console.log(`  Background Color: ${slot.container.backgroundColor}`);
      console.log(`  Background Image: ${slot.container.backgroundImage}`);
      console.log(`  Border: ${slot.container.border}`);
      console.log(`  Border Color: ${slot.container.borderColor}`);
      console.log(`  Box Shadow: ${slot.container.boxShadow}`);
      console.log(`  Filter: ${slot.container.filter}`);
      console.log(`  Color: ${slot.container.color}`);
      console.log(`  Outline: ${slot.container.outline}`);
      
      if (slot.v12Renderer) {
        console.log('\n[SlotV12Renderer]');
        console.log(`  Background: ${slot.v12Renderer.background}`);
        console.log(`  Background Color: ${slot.v12Renderer.backgroundColor}`);
        console.log(`  Background Image: ${slot.v12Renderer.backgroundImage}`);
        console.log(`  Box Shadow: ${slot.v12Renderer.boxShadow}`);
        console.log(`  Filter: ${slot.v12Renderer.filter}`);
      }
      
      if (slot.halo) {
        console.log('\n[Halo]');
        console.log(`  Background: ${slot.halo.background}`);
        console.log(`  Background Color: ${slot.halo.backgroundColor}`);
        console.log(`  Background Image: ${slot.halo.backgroundImage}`);
        console.log(`  Opacity: ${slot.halo.opacity}`);
        console.log(`  Filter: ${slot.halo.filter}`);
      }
      
      if (slot.svg) {
        console.log('\n[SVG]');
        console.log(`  Filter: ${slot.svg.filter}`);
      }
      
      if (slot.circles.length > 0) {
        console.log('\n[SVG Circles]');
        slot.circles.forEach((circle, i) => {
          console.log(`  Circle ${i}:`);
          console.log(`    Fill: ${circle.fill}`);
          console.log(`    Stroke: ${circle.stroke}`);
          console.log(`    Filter: ${circle.filter}`);
        });
      }
      
      if (slot.paths.length > 0) {
        console.log('\n[SVG Paths]');
        slot.paths.forEach((path, i) => {
          console.log(`  Path ${i}:`);
          console.log(`    Fill: ${path.fill}`);
          console.log(`    Stroke: ${path.stroke}`);
          console.log(`    Filter: ${path.filter}`);
        });
      }
    });

    // Also check CSS variables
    console.log('\n=== CSS VARIABLES ===\n');
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = window.getComputedStyle(root);
      const vars = {};
      
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        if (prop.startsWith('--slot-rack')) {
          vars[prop] = computed.getPropertyValue(prop);
        }
      }
      
      return vars;
    });

    // Also inspect the slot rack container
    console.log('\n=== SLOT RACK CONTAINER ===\n');
    const rackStyles = await page.evaluate(() => {
      const rack = document.querySelector('.resident-slot-rack') || document.querySelector('[class*="slot-rack"]');
      if (!rack) return null;
      
      const computed = window.getComputedStyle(rack);
      return {
        background: computed.background,
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
        border: computed.border,
        borderColor: computed.borderColor,
        borderWidth: computed.borderWidth,
        borderStyle: computed.borderStyle,
        boxShadow: computed.boxShadow,
        filter: computed.filter,
        mixBlendMode: computed.mixBlendMode,
      };
    });

    // Also inspect the parent panel (ActivityCapsuleDetailSkinAware)
    console.log('\n=== PARENT PANEL ===\n');
    const panelStyles = await page.evaluate(() => {
      const panel = document.querySelector('.activity-capsule-detail-skin-aware') || document.querySelector('[class*="activity-capsule"]');
      if (!panel) return null;
      
      const computed = window.getComputedStyle(panel);
      return {
        background: computed.background,
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
        border: computed.border,
        borderColor: computed.borderColor,
        borderWidth: computed.borderWidth,
        borderStyle: computed.borderStyle,
        boxShadow: computed.boxShadow,
        filter: computed.filter,
        mixBlendMode: computed.mixBlendMode,
      };
    });

    // Inspect SVG gradients and filters
    console.log('\n=== SVG GRADIENTS AND FILTERS ===\n');
    const svgElements = await page.evaluate(() => {
      const firstSlot = document.querySelector('[data-slot-id]');
      if (!firstSlot) return null;
      
      const svg = firstSlot.querySelector('svg');
      if (!svg) return null;
      
      const defs = svg.querySelector('defs');
      if (!defs) return null;
      
      const gradients = Array.from(defs.querySelectorAll('radialGradient, linearGradient')).map(g => {
        const id = g.id;
        const stops = Array.from(g.querySelectorAll('stop')).map(s => ({
          offset: s.getAttribute('offset'),
          stopColor: s.getAttribute('stop-color'),
          stopOpacity: s.getAttribute('stop-opacity'),
        }));
        return { id, stops };
      });
      
      const filters = Array.from(defs.querySelectorAll('filter')).map(f => {
        const id = f.id;
        const colorMatrices = Array.from(f.querySelectorAll('feColorMatrix')).map(cm => ({
          type: cm.getAttribute('type'),
          values: cm.getAttribute('values'),
        }));
        return { id, colorMatrices };
      });
      
      return { gradients, filters };
    });

    // Inspect parent chain to find any red colors
    console.log('\n=== PARENT CHAIN FOR RED COLORS ===\n');
    const parentChain = await page.evaluate(() => {
      const firstSlot = document.querySelector('[data-slot-id]');
      if (!firstSlot) return null;
      
      const chain = [];
      let current = firstSlot;
      
      while (current && current !== document.body) {
        const computed = window.getComputedStyle(current);
        const bgColor = computed.backgroundColor;
        const borderColor = computed.borderColor;
        const boxShadow = computed.boxShadow;
        
        // Check for red/magenta colors
        const hasRed = 
          bgColor.includes('255') && (bgColor.includes('0,') || bgColor.includes('50,') || bgColor.includes('100,')) ||
          borderColor.includes('255') && (borderColor.includes('0,') || borderColor.includes('50,') || borderColor.includes('100,')) ||
          boxShadow.includes('255') && (boxShadow.includes('0,') || boxShadow.includes('50,') || boxShadow.includes('100,')) ||
          bgColor.includes('rgb(255') || borderColor.includes('rgb(255') || boxShadow.includes('rgb(255');
        
        chain.push({
          tagName: current.tagName,
          className: current.className,
          id: current.id,
          backgroundColor: bgColor,
          borderColor: borderColor,
          boxShadow: boxShadow,
          hasRed,
        });
        
        current = current.parentElement;
      }
      
      return chain;
    });

    if (rackStyles) {
      console.log('Background:', rackStyles.background);
      console.log('Background Color:', rackStyles.backgroundColor);
      console.log('Background Image:', rackStyles.backgroundImage);
      console.log('Border:', rackStyles.border);
      console.log('Border Color:', rackStyles.borderColor);
      console.log('Box Shadow:', rackStyles.boxShadow);
      console.log('Filter:', rackStyles.filter);
      console.log('Mix Blend Mode:', rackStyles.mixBlendMode);
    } else {
      console.log('Slot rack container not found');
    }

    if (panelStyles) {
      console.log('\n[PANEL]');
      console.log('Background:', panelStyles.background);
      console.log('Background Color:', panelStyles.backgroundColor);
      console.log('Background Image:', panelStyles.backgroundImage);
      console.log('Border:', panelStyles.border);
      console.log('Border Color:', panelStyles.borderColor);
      console.log('Box Shadow:', panelStyles.boxShadow);
      console.log('Filter:', panelStyles.filter);
      console.log('Mix Blend Mode:', panelStyles.mixBlendMode);
    } else {
      console.log('Parent panel not found');
    }

    if (svgElements) {
      console.log('\n[GRADIENTS]');
      svgElements.gradients.forEach(g => {
        console.log(`  ${g.id}:`);
        g.stops.forEach(s => {
          console.log(`    offset=${s.offset}, stopColor=${s.stopColor}, stopOpacity=${s.stopOpacity}`);
        });
      });
      
      console.log('\n[FILTERS]');
      svgElements.filters.forEach(f => {
        console.log(`  ${f.id}:`);
        f.colorMatrices.forEach(cm => {
          console.log(`    type=${cm.type}, values=${cm.values}`);
        });
      });
    } else {
      console.log('SVG elements not found');
    }

    if (parentChain) {
      console.log('\n[PARENT CHAIN]');
      parentChain.forEach((parent, i) => {
        console.log(`  ${i}. ${parent.tagName} ${parent.className ? `.${parent.className}` : ''} ${parent.id ? `#${parent.id}` : ''}`);
        console.log(`     Background: ${parent.backgroundColor}`);
        console.log(`     Border: ${parent.borderColor}`);
        console.log(`     Box Shadow: ${parent.boxShadow}`);
        if (parent.hasRed) {
          console.log(`     ⚠️  RED DETECTED!`);
        }
      });
    } else {
      console.log('Parent chain not found');
    }

    Object.entries(cssVars).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspectSlotStyles();
