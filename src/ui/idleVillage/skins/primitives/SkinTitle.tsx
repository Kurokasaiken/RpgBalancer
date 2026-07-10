import React from 'react';

/**
 * SkinTitle — a role-tagged heading. Inside a <SkinScope> it renders as the
 * canonical gold, incised, uppercase title with no color props.
 *
 *   level="1" → first-level title (default)
 *   level="section" → tracked-out bronze section header
 *   subtitle → the tracked display caption under a title
 */
type SkinTitleLevel = '1' | 'section' | 'subtitle';

export interface SkinTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: SkinTitleLevel;
}

const LEVEL_CONFIG: Record<SkinTitleLevel, { tag: React.ElementType; skin: string }> = {
  '1': { tag: 'h1', skin: 'title' },
  section: { tag: 'h2', skin: 'section' },
  subtitle: { tag: 'p', skin: 'subtitle' },
};

export const SkinTitle: React.FC<SkinTitleProps> = ({ level = '1', className, children, ...rest }) => {
  const { tag: Tag, skin } = LEVEL_CONFIG[level];
  return (
    <Tag data-skin={skin} className={className} {...rest}>
      {children}
    </Tag>
  );
};

export default SkinTitle;
