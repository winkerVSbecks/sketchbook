import React from 'react';
import { Image } from 'rebass';

export default ({ style, maxSize = 400, imgs, ...props }) => (
  <article
    style={{
      display: 'grid',
      gridGap: '1rem',
      gridTemplateColumns: `repeat(auto-fill, minmax(auto, ${maxSize}px))`,
      gridAutoRows: 'auto',
      gridAutoFlow: 'dense',
    }}
    {...props}
  >
    {imgs.map(img => (
      <Image key={img} src={img} width="1" style={{ alignSelf: 'center' }} />
    ))}
  </article>
);
