import type { ReactNode } from 'react';

export interface LocationCardProps {
  title: string;
  description: string;
  iconRow?: ReactNode;
}

const LocationCard: React.FC<LocationCardProps> = ({ title, description, iconRow }) => {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-amber-400/30 bg-slate-950/80 p-4 shadow-[0_15px_45px_rgba(0,0,0,0.55)]">
      <div className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <div className="aspect-[2.333/1] w-full bg-linear-to-r from-emerald-900 via-slate-900 to-emerald-800 flex items-center justify-center">
          {iconRow ?? (
            <div className="flex items-center gap-3 text-emerald-200 text-4xl">
              <span>🌲</span>
              <span>🌳</span>
              <span>🌲</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-sm font-semibold text-ivory">{title}</div>
      <p className="text-[12px] text-slate-300">{description}</p>
    </div>
  );
};

export default LocationCard;
