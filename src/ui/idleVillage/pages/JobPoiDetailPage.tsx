/**
 * JobPoiDetailPage — Isolated POI Job Detail for Chop Wood
 *
 * Pagina di test isolata per verificare il rendering del detail del POI job Chop Wood.
 * Mostra il detail del job con tutte le informazioni dalla config.
 *
 * Config source: IdleVillageConfig.activities.job_chop_wood
 */

import React, { useState } from 'react';
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

/**
 * JobPoiDetailPage
 *
 * Shows the detail view for the Chop Wood job POI
 * Displays job configuration, rewards, and requirements
 */
export const JobPoiDetailPage: React.FC = () => {
  const [showDetail, setShowDetail] = useState(true);
  const jobConfig = DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood;

  // Track detail view
  React.useEffect(() => {
    trackTelemetryEvent('job_poi_detail_viewed', {
      jobId: jobConfig.id,
      jobLabel: jobConfig.label,
    });
  }, [jobConfig.id, jobConfig.label]);

  const handleCloseDetail = () => {
    setShowDetail(false);
    trackTelemetryEvent('job_poi_detail_closed', {
      jobId: jobConfig.id,
    });
  };

  const handleOpenDetail = () => {
    setShowDetail(true);
    trackTelemetryEvent('job_poi_detail_opened', {
      jobId: jobConfig.id,
    });
  };

  return (
    <StyleLabSurface>
      <div className="job-poi-detail-page">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Job POI Detail: Chop Wood
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Isolated detail view for the woodcutting job POI
          </p>
        </header>

        {/* Job Summary Card */}
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6 border border-green-200 dark:border-green-700 mb-6">
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
            Job Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800 dark:text-green-200">
            <div>
              <strong>ID:</strong> {jobConfig.id}
            </div>
            <div>
              <strong>Label:</strong> {jobConfig.label}
            </div>
            <div>
              <strong>Type:</strong> Job (Production)
            </div>
            <div>
              <strong>Level:</strong> {jobConfig.level}
            </div>
            <div>
              <strong>Danger Rating:</strong> {jobConfig.dangerRating} (Safe)
            </div>
            <div>
              <strong>Duration:</strong> {jobConfig.durationFormula} tick(s)
            </div>
            <div>
              <strong>Continuous:</strong> {jobConfig.continuousJob ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Auto Repeat:</strong> {jobConfig.supportsAutoRepeat ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Daily Fatigue Cost:</strong> {jobConfig.dailyFatigueCost}
            </div>
            <div>
              <strong>Max Slots:</strong> {jobConfig.maxSlots}
            </div>
          </div>
          <div className="mt-4 text-sm">
            <strong>Description:</strong> {jobConfig.description}
          </div>
          <div className="mt-2 text-sm">
            <strong>Tags:</strong> {jobConfig.tags.join(', ')}
          </div>
          <div className="mt-2 text-sm">
            <strong>Slot Tags:</strong> {jobConfig.slotTags.join(', ')}
          </div>
        </div>

        {/* Detail Toggle */}
        <div className="mb-6">
          {showDetail ? (
            <button
              onClick={handleCloseDetail}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Close Detail View
            </button>
          ) : (
            <button
              onClick={handleOpenDetail}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Open Detail View
            </button>
          )}
        </div>

        {/* POI Detail Wrapper */}
        {showDetail && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              POI Detail Component
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <ActivityCapsuleDetailSkinAware
                activityId={jobConfig.id}
                name={jobConfig.label}
                type="job"
                subtitle="Production Job - Woodcutting"
                status="idle"
                progress={0}
                duration={parseInt(jobConfig.durationFormula) * 1000}
                elapsed={0}
                slots={[]}
                maxSlots={jobConfig.maxSlots === 'infinite' ? 99 : jobConfig.maxSlots}
                durationDisplay={`${jobConfig.durationFormula}s`}
                rewardDisplay="Wood + XP"
                etaDisplay={`${jobConfig.durationFormula}s`}
                telemetry={[]}
                isOpen={true}
                onStart={() => {
                  trackTelemetryEvent('job_poi_detail_start', {
                    jobId: jobConfig.id,
                  });
                }}
                onCollect={() => {
                  trackTelemetryEvent('job_poi_detail_collect', {
                    jobId: jobConfig.id,
                  });
                }}
              />
            </div>
          </div>
        )}

        {/* Daily Reward Profile */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
          <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
            Daily Reward Profile
          </h2>
          {jobConfig.dailyRewardProfile && jobConfig.dailyRewardProfile.length > 0 ? (
            <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              {jobConfig.dailyRewardProfile.map((reward, index) => (
                <div key={index} className="border-b border-yellow-200 dark:border-yellow-700 pb-2">
                  <div>
                    <strong>Resource ID:</strong> {reward.resourceId}
                  </div>
                  <div>
                    <strong>Amount Per Day:</strong> {reward.amountPerDay}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              No daily reward profile configured
            </p>
          )}
        </div>

        {/* Stat Requirements */}
        {jobConfig.statRequirement && (
          <div className="mt-6 bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
            <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4">
              Stat Requirements
            </h2>
            <div className="text-sm text-purple-800 dark:text-purple-200">
              <div>
                <strong>Label:</strong> {jobConfig.statRequirement.label}
              </div>
              {jobConfig.statRequirement.anyOf && (
                <div>
                  <strong>Any Of:</strong> {jobConfig.statRequirement.anyOf.join(', ')}
                </div>
              )}
              {jobConfig.statRequirement.allOf && (
                <div>
                  <strong>All Of:</strong> {jobConfig.statRequirement.allOf.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        {jobConfig.metadata && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Metadata
            </h2>
            <div className="text-sm text-gray-800 dark:text-gray-200">
              {Object.entries(jobConfig.metadata).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {String(value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StyleLabSurface>
  );
};
