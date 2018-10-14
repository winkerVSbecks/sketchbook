import React from 'react';
import { Image } from 'rebass';

export default ({ style, maxSize = 400, vids, ...props }) => (
  <article
    style={{
      display: 'grid',
      gridGap: '1rem',
      gridTemplateColumns: `repeat(auto-fill, minmax(auto, ${maxSize}px))`,
      gridAutoRows: 'auto',
      gridAutoFlow: 'dense',
      marginTop: '1rem',
    }}
    {...props}
  >
    {vids.map(vid => (
      <video
        muted
        src={vid}
        key={vid}
        style={{ alignSelf: 'center', width: '100%' }}
        playsinline
        autoPlay
      >
        Sorry, your browser doesn't support embedded videos.
      </video>
    ))}
  </article>
);
