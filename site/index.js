import React from 'react';
// import routes from './_config';
import TOC from '../components/TOC';
import ImageGrid from '../components/ImageGrid';

export default ({ routes, index, goTo }) =>
  index === 0 ? (
    <TOC routes={routes} goTo={goTo} />
  ) : (
    <ImageGrid imgs={routes[index].imgs}>{routes[index].imgs}</ImageGrid>
  );
