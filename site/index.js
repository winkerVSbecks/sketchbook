import React from 'react';
import TOC from '../components/TOC';
import ImageGrid from '../components/ImageGrid';
import VidGrid from '../components/VidGrid';

export default ({ routes, index, goTo }) =>
  index === 0 ? (
    <TOC routes={routes} goTo={goTo} />
  ) : (
    <React.Fragment>
      <ImageGrid imgs={routes[index].imgs} />
      {routes[index].vids && <VidGrid vids={routes[index].vids} />}
    </React.Fragment>
  );
