import type { TemporarySkinConfig } from '../temporary/TemporarySkinConfig';

/**
 * POI Detail Skin – Dark Luxury aesthetic
 * Converted from poi-detail.skin.json
 */
export const POI_DETAIL_SKIN_CONFIG: TemporarySkinConfig = {
  id: 'poi_detail_dark_luxury',
  name: 'POI Detail – Dark Luxury',
  version: '1.0.0',
  author: 'Cascade',
  quality: 'final',
  targetVersion: 'poi@v1',
  compatibility: ['ActivityCapsule', 'POIDetail'],
  
  htmlTemplate: `
    <div class="poi-detail-container" data-skin="poi-detail">
      <div class="poi-detail-frame">
        <div class="poi-detail-header">
          <h3 class="poi-detail-title" data-slot="title"></h3>
          <div class="poi-detail-subtitle" data-slot="subtitle"></div>
        </div>
        <div class="poi-detail-body">
          <div class="poi-detail-description" data-slot="description"></div>
          <div class="poi-detail-stats" data-slot="stats"></div>
          <div class="poi-detail-rack" data-slot="rack"></div>
        </div>
        <div class="poi-detail-footer">
          <button class="poi-detail-button" data-slot="button"></button>
        </div>
      </div>
    </div>
  `,
  
  cssStyles: `
    .poi-detail-container {
      --body-base: #0c0a08;
      --rack-base: #1e2d48;
      --bronze-mid: #3a2008;
      --bronze-light: rgba(255,252,210,.80);
      --bronze-dark: rgba(0,0,0,.96);
      --title-color: #ffd84a;
      --stat-value: #e8b040;
      --danger-value: #e04818;
      
      font-family: 'EB Garamond', serif;
      background: var(--body-base);
      color: var(--title-color);
      border-radius: 26px;
      box-shadow: 
        0 3px 0 rgba(0,0,0,1),
        0 8px 18px rgba(0,0,0,.96),
        0 28px 55px rgba(0,0,0,.82),
        0 18px 40px rgba(80,45,8,.22);
      padding: 20px;
      position: relative;
    }
    
    .poi-detail-frame {
      background: linear-gradient(155deg, #0c0a08 0%, #1a1512 100%);
      border: 3px solid var(--bronze-mid);
      border-radius: 20px;
      padding: 16px;
      position: relative;
      overflow: hidden;
    }
    
    .poi-detail-title {
      font-family: 'Cinzel', serif;
      font-weight: 700;
      font-size: 24px;
      letter-spacing: .03em;
      color: var(--title-color);
      text-shadow: 
        0 1px 0 rgba(255,225,100,.50),
        0 2px 0 rgba(30,10,0,.95),
        0 4px 10px rgba(0,0,0,.92),
        0 0 20px rgba(230,160,15,.32);
      margin: 0 0 8px 0;
    }
    
    .poi-detail-subtitle {
      font-family: 'EB Garamond', serif;
      font-style: italic;
      font-size: 12px;
      color: rgba(192,158,78,.55);
      margin-bottom: 16px;
    }
    
    .poi-detail-description {
      font-family: 'EB Garamond', serif;
      font-style: italic;
      font-size: 13px;
      line-height: 1.58;
      color: rgba(200,168,105,.58);
      margin-bottom: 16px;
    }
    
    .poi-detail-rack {
      background: var(--rack-base);
      border-radius: 12px;
      padding: 16px 18px;
      box-shadow: 
        0 0 0 1px rgba(0,0,0,1),
        0 1px 0 rgba(0,0,0,1),
        0 2px 6px rgba(0,0,0,.96),
        0 4px 16px rgba(0,0,0,.82),
        0 8px 24px rgba(0,0,0,.55),
        inset 0 8px 22px rgba(0,0,0,.88),
        inset 0 4px 10px rgba(0,0,0,.72),
        inset 0 -4px 10px rgba(0,0,0,.60),
        inset 6px 0 14px rgba(0,0,0,.65),
        inset -6px 0 14px rgba(0,0,0,.65);
    }
    
    .poi-detail-button {
      font-family: 'Cinzel', serif;
      font-weight: 700;
      font-size: 8.5px;
      letter-spacing: .28em;
      text-transform: uppercase;
      color: rgba(180,130,45,.72);
      background: var(--bronze-mid);
      border: 1px solid var(--bronze-dark);
      border-radius: 4px;
      padding: 8px 16px;
      text-shadow: 
        0 -1px 0 rgba(255,230,130,.55),
        0 1px 0 rgba(15,6,0,.95),
        0 1px 4px rgba(0,0,0,.88);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .poi-detail-button:hover {
      background: rgba(122,76,16,.76);
      box-shadow: 
        inset 0 3px 0 rgba(255,255,205,.88),
        inset 0 5px 0 rgba(235,175,42,.30),
        inset 0 -3px 0 rgba(0,0,0,.98),
        inset 3px 0 0 rgba(225,165,40,.48),
        inset -3px 0 0 rgba(5,2,0,.88),
        0 0 18px rgba(120,72,12,.22);
    }
  `,
  
  componentSlots: {
    POIDetail: {
      container: '.poi-detail-container',
      replaceContent: false,
      preserveStructure: true,
      slotBindings: {
        title: '.poi-detail-title',
        subtitle: '.poi-detail-subtitle',
        description: '.poi-detail-description',
        stats: '.poi-detail-stats',
        rack: '.poi-detail-rack',
        button: '.poi-detail-button'
      }
    }
  },
  
  colorTokens: {
    'body_base': '#0c0a08',
    'rack_base': '#1e2d48',
    'bronze_mid': '#3a2008',
    'bronze_light': 'rgba(255,252,210,.80)',
    'bronze_dark': 'rgba(0,0,0,.96)',
    'title_color': '#ffd84a',
    'stat_value': '#e8b040',
    'danger_value': '#e04818',
    'subtitle': 'rgba(192,158,78,.55)',
    'label': 'rgba(168,128,52,.62)',
    'description': 'rgba(200,168,105,.58)',
    'rack_highlight_top': 'rgba(148,172,220,.20)',
    'rack_vignette': 'rgba(8,12,24,.42)',
    'ornament_gem': 'rgba(192,140,34,.48)',
    'ornament_line': 'rgba(175,125,30,.20)',
    'table_veil': 'rgba(4,3,2,.45)'
  },
  
  metadata: {
    aesthetic: 'dark_luxury',
    materialHierarchy: [
      'basalt_table',
      'parchment_map',
      'poi_body',
      'slot_rack',
      'bronze_frame',
      'slot_cavity'
    ],
    bronzePhilosophy: 'three_zones_no_gradient',
    antiPatterns: [
      'no_svg_filter_in_css_background',
      'no_8_layer_text_shadow',
      'no_wide_glow',
      'no_flat_rect_button',
      'no_same_value_materials'
    ]
  }
};
