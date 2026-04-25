/**
 * Isolation Pages Router
 * 
 * Registers all isolation pages for component testing.
 * Each page tests a specific component in isolation.
 */

import { lazy } from 'react';

// Lazy load isolation pages for better performance
const SlotRendererIso = lazy(() => import('./SlotRendererIso'));
const ExtractionIso = lazy(() => import('./ExtractionIso'));
const DragOverlayIso = lazy(() => import('./DragOverlayIso'));
const FlightProxyIso = lazy(() => import('./FlightProxyIso'));
const FullIntegrationIso = lazy(() => import('./FullIntegrationIso'));

export const isolationRoutes = [
  {
    path: '/idle-village/iso/slot-renderer',
    component: SlotRendererIso,
    title: 'Slot Renderer Isolation',
    description: 'Test SlotV12Renderer component independently',
  },
  {
    path: '/idle-village/iso/extraction',
    component: ExtractionIso,
    title: 'Extraction Isolation',
    description: 'Test extraction animation sequence',
  },
  {
    path: '/idle-village/iso/drag-overlay',
    component: DragOverlayIso,
    title: 'Drag Overlay Isolation',
    description: 'Test drag overlay component',
  },
  {
    path: '/idle-village/iso/flight-proxy',
    component: FlightProxyIso,
    title: 'Flight Proxy Isolation',
    description: 'Test flight proxy animation',
  },
  {
    path: '/idle-village/iso/full-integration',
    component: FullIntegrationIso,
    title: 'Full Integration Isolation',
    description: 'Test all components together',
  },
];

export default isolationRoutes;
