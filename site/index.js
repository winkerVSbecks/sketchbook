import React from 'react';
import { Link } from 'react-router-dom';
import { BlockLink, Banner, Heading, Flex } from 'rebass';

const imgs = {
  Arcs: 'arcs',
  Boxes: 'boxes-colour',
  ColourField: 'colour-field',
  Metaballs: 'metaball',
  NoiseCircles: 'noise-circles',
  NoisePoly: 'noise-hexagon',
  NoiseRects: 'noise-rects',
  Plasma: 'plasma',
  VectorField: 'vector-field-loop3',
};

export default ({ routes }) => (
  <div>
    <Flex flexWrap="wrap" mx={-2}>
      {routes.filter(route => route.name !== 'index').map(route => (
        <BlockLink
          px={2}
          py={2}
          width={[1, 1 / 2, 1 / 3]}
          is={Link}
          key={route.name}
          color="white"
          to={route.path}
        >
          <Banner
            color="white"
            backgroundImage={`renders/${imgs[route.name]}.gif`}
            minHeight="25vh"
          >
            <Heading
              bg="rgba(0, 0, 0, 0.75)"
              color="dark-gray"
              px={3}
              py={2}
              fontSize={3}
              lineHeight={1}
            >
              {route.name}
            </Heading>
          </Banner>
        </BlockLink>
      ))}
    </Flex>
  </div>
);
