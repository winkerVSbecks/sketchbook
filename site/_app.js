import React from 'react';
import { Container, Box } from 'rebass';
import Keyboard from '../components/Keyboard';
import Toolbar from '../components/Toolbar';
import Footer from '../components/Footer';
import routes from './_config';

class App extends React.Component {
  state = { index: 0 };

  navigate = ({ forward } = { forward: true }) => {
    const { index } = this.state;

    const next = forward
      ? index === routes.length - 1
        ? 0
        : index + 1
      : index === 0
        ? routes.length - 1
        : index - 1;

    this.setState({ index: next });
  };

  goTo = name => {
    const index = routes.findIndex(route => route.name === name);
    this.setState({ index });
  };

  render() {
    const { render } = this.props;
    const { index } = this.state;

    return (
      <Box bg="black">
        <Container
          pt={5}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <Toolbar
            name={routes[index] ? routes[index].name : ''}
            onLeft={() => this.navigate({ forward: false })}
            onRight={() => this.navigate()}
            onHome={() => this.goTo('index')}
          />
          <Keyboard
            onLeft={() => this.navigate({ forward: false })}
            onRight={() => this.navigate()}
          />
          <Box flex="1 1 auto">
            {render({ routes, index, goTo: this.goTo })}
          </Box>
          <Footer />
        </Container>
      </Box>
    );
  }
}

export default App;
