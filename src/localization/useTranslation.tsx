import { useTranslation as useI18nTranslation, Trans as I18nTrans } from 'react-i18next';
import type { ComponentProps, ReactNode } from 'react';
import type Resources from './i18n.types';
import { useLQA } from './LQAContext';

/**
 * Typed wrapper around react-i18next's useTranslation.
 * Forces `useSuspense: false` and narrows the namespace to the resources
 * generated from `public/locales/en/*.json`.
 */
export function useTranslation<N extends keyof Resources>(ns: N) {
  return useI18nTranslation(ns, { useSuspense: false });
}

export type { UseTranslationOptions, UseTranslationResponse } from 'react-i18next';

/**
 * `Trans` wrapper that adds `data-i18n-key` attribute when LQA mode is enabled,
 * so the `LQAOverlay` can inspect them in context.
 */
export function Trans(props: ComponentProps<typeof I18nTrans>): ReactNode {
  const lqa = useLQA();
  const { i18nKey, ns, ...rest } = props;
  const namespace = (ns ?? 'common') as string;
  const key = (i18nKey ?? '') as string;

  const dataAttributes = lqa.enabled
    ? {
        'data-i18n-key': `${namespace}:${key}`,
      }
    : undefined;

  return (
    <span {...dataAttributes}>
      <I18nTrans i18nKey={i18nKey} ns={namespace} {...rest} />
    </span>
  );
}
