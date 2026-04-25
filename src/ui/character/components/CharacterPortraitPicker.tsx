import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  RESIDENT_VISUAL_PROFILES,
  DEFAULT_RESIDENT_VISUAL_PROFILE_ID,
  DEFAULT_PORTRAIT_CROP,
  type PortraitCropSettings,
  type ResidentVisualProfileDefinition,
} from '@/balancing/config/idleVillage/residentVisuals';
import { PortraitPreviewModal } from './PortraitPreviewModal';
import {
  PORTRAIT_BADGE_CONTAINER_CLASS,
  PORTRAIT_IMAGE_CLASS,
  getPortraitImageStyle,
} from './portraitStyles';

interface CropSliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  unit?: string;
  step?: number;
  onChange: (value: number) => void;
}

const CropSlider: React.FC<CropSliderProps> = ({ label, min, max, step = 1, value, unit, onChange }) => (
  <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
    <span className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-slate-400">
      {label}
      <span className="text-slate-200">
        {unit ? `${value.toFixed(unit === '×' ? 2 : 0)}${unit}` : value}
      </span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="accent-emerald-400"
    />
  </label>
);

/**
 * Props for the CharacterPortraitPicker component.
 */
export interface CharacterPortraitPickerProps {
  visualProfileId?: string;
  portraitUrl?: string;
  fullFigureUrl?: string;
  portraitCrop?: PortraitCropSettings;
  onVisualProfileChange: (profileId: string) => void;
  onPortraitUrlChange: (url: string) => void;
  onFullFigureUrlChange: (url: string) => void;
  onPortraitCropChange: (crop: PortraitCropSettings) => void;
}

const profileList: ResidentVisualProfileDefinition[] = Object.values(RESIDENT_VISUAL_PROFILES);

/**
 * UI picker that lets designers assign a portrait profile or custom URLs to a character.
 */
export const CharacterPortraitPicker: React.FC<CharacterPortraitPickerProps> = ({
  visualProfileId,
  portraitUrl,
  fullFigureUrl,
  portraitCrop,
  onVisualProfileChange,
  onPortraitUrlChange,
  onFullFigureUrlChange,
  onPortraitCropChange,
}) => {
  const activeProfileId = visualProfileId ?? DEFAULT_RESIDENT_VISUAL_PROFILE_ID;

  const activeProfile = useMemo(() => {
    return profileList.find((profile) => profile.id === activeProfileId) ?? profileList[0];
  }, [activeProfileId]);

  const previewPortrait = portraitUrl?.trim().length ? portraitUrl : activeProfile?.portrait?.src;
  const previewFullFigure = fullFigureUrl?.trim().length ? fullFigureUrl : activeProfile?.fullFigure?.src;
  const effectiveCrop = portraitCrop ?? activeProfile?.portrait?.defaultCrop ?? DEFAULT_PORTRAIT_CROP;
  const cropOverridesRef = useRef<Record<string, PortraitCropSettings>>({});
  const syncCropOverrides = useCallback((profileId: string, crop: PortraitCropSettings) => {
    cropOverridesRef.current = {
      ...cropOverridesRef.current,
      [profileId]: crop,
    };
  }, []);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>();
  const [previewLabel, setPreviewLabel] = useState<string>();
  const [canAdjustPreviewCrop, setCanAdjustPreviewCrop] = useState(false);

  const openPreview = (image?: string, label?: string, allowCrop = false) => {
    if (!image) return;
    setPreviewImage(image);
    setPreviewLabel(label);
    setCanAdjustPreviewCrop(allowCrop);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setCanAdjustPreviewCrop(false);
  };

  const handleCropFieldChange = useCallback(
    (field: keyof PortraitCropSettings, value: number) => {
      const next: PortraitCropSettings = {
        ...effectiveCrop,
        [field]: value,
      };
      syncCropOverrides(activeProfileId, next);
      onPortraitCropChange(next);
    },
    [effectiveCrop, onPortraitCropChange, activeProfileId, syncCropOverrides],
  );

  const getProfileDefaultCrop = useCallback(
    (profile?: ResidentVisualProfileDefinition) =>
      ({ ...(profile?.portrait?.defaultCrop ?? DEFAULT_PORTRAIT_CROP) }),
    [],
  );

  const handleProfileSelect = useCallback(
    (profile: ResidentVisualProfileDefinition) => {
      if (profile.id === activeProfileId) {
        return;
      }
      syncCropOverrides(activeProfileId, effectiveCrop);
      onVisualProfileChange(profile.id);
      const saved = cropOverridesRef.current[profile.id];
      const nextCrop = saved ?? getProfileDefaultCrop(profile);
      onPortraitCropChange(nextCrop);
    },
    [activeProfileId, effectiveCrop, getProfileDefaultCrop, onPortraitCropChange, onVisualProfileChange, syncCropOverrides],
  );

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white tracking-wide">🎭 Visual Profile</h3>
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
              Seleziona un ritratto auto-importato oppure usa un URL personalizzato.
            </p>
          </div>
          <span className="rounded-full border border-white/20 px-3 py-0.5 text-[10px] uppercase tracking-[0.35em] text-slate-200">
            Config
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Selezione profilo visivo">
          {profileList.map((profile) => {
            const paletteLabel = typeof profile.metadata?.palette === 'string' ? profile.metadata.palette : undefined;
            const profileCrop = profile.portrait?.defaultCrop ?? DEFAULT_PORTRAIT_CROP;
            const previewCrop = profile.id === activeProfileId ? effectiveCrop : profileCrop;
            return (
              <button
                type="button"
                key={profile.id}
                onClick={() => handleProfileSelect(profile)}
                className={[
                  'group flex flex-col gap-2 rounded-xl border bg-black/30 p-2 text-left transition-all',
                  profile.id === activeProfileId
                    ? 'border-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                    : 'border-white/10 hover:border-emerald-300/50',
                ].join(' ')}
                aria-pressed={profile.id === activeProfileId}
                aria-label={`Profilo ${profile.label}`}
              >
                <div className={`${PORTRAIT_BADGE_CONTAINER_CLASS} mx-auto h-16 w-16`}>
                  {profile.portrait?.src ? (
                    <img
                      src={profile.portrait.src}
                      alt={profile.portrait.alt ?? profile.label}
                      className={`${PORTRAIT_IMAGE_CLASS} group-hover:scale-125`}
                      style={getPortraitImageStyle(previewCrop)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.3em] text-slate-400">
                      No Image
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{profile.label}</p>
                  {paletteLabel && (
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{paletteLabel}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-[0.4em] text-slate-500">Portrait URL</label>
            <input
              type="url"
              value={portraitUrl ?? ''}
              onChange={(event) => onPortraitUrlChange(event.target.value)}
              placeholder="Override default portrait"
              className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-300/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.4em] text-slate-500">Full Figure URL</label>
            <input
              type="url"
              value={fullFigureUrl ?? ''}
              onChange={(event) => onFullFigureUrlChange(event.target.value)}
              placeholder="Optional cinematic art"
              className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-300/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
          <button
            type="button"
            className="flex items-center gap-3 text-left"
            onClick={() => openPreview(previewPortrait, activeProfile?.label, true)}
            disabled={!previewPortrait}
          >
            <div className={`${PORTRAIT_BADGE_CONTAINER_CLASS} h-14 w-14 border border-white/20`}>
              {previewPortrait ? (
                <img
                  src={previewPortrait}
                  alt="Portrait preview"
                  className={PORTRAIT_IMAGE_CLASS}
                  style={getPortraitImageStyle(effectiveCrop)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Preview
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Portrait attivo</p>
              <p className="text-[11px] text-slate-300">{activeProfile?.label ?? '—'}</p>
              <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-300/80">
                {previewPortrait ? 'Click per ingrandire' : 'Nessuna immagine'}
              </p>
            </div>
          </button>
          {previewFullFigure && (
            <button
              type="button"
              onClick={() => openPreview(previewFullFigure, `${activeProfile?.label ?? 'Portrait'} – Full Figure`)}
              className="rounded-full border border-white/15 px-3 py-1 text-center text-[10px] uppercase tracking-[0.35em] text-amber-200 transition hover:border-amber-200 hover:text-white"
            >
              Visualizza Full Figure
            </button>
          )}
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">Badge Crop</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <CropSlider
              label="Focus X"
              min={0}
              max={100}
              value={effectiveCrop.focusX}
              unit="%"
              onChange={(value) => handleCropFieldChange('focusX', value)}
            />
            <CropSlider
              label="Focus Y"
              min={0}
              max={100}
              value={effectiveCrop.focusY}
              unit="%"
              onChange={(value) => handleCropFieldChange('focusY', value)}
            />
            <CropSlider
              label="Zoom"
              min={1}
              max={1.6}
              step={0.01}
              value={effectiveCrop.zoom}
              unit="×"
              onChange={(value) => handleCropFieldChange('zoom', value)}
            />
          </div>
        </div>
      </div>

      <PortraitPreviewModal
        isOpen={isPreviewOpen}
        imageUrl={previewImage}
        label={previewLabel}
        onClose={closePreview}
        crop={effectiveCrop}
        onCropChange={onPortraitCropChange}
        canAdjustCrop={canAdjustPreviewCrop}
      />
    </>
  );
};
