import React from 'react';

class Keyboard extends React.Component {
  componentDidMount() {
    const { onLeft, onRight } = this.props;
    document.body.addEventListener('keydown', e => {
      if (document.activeElement.tagName !== 'BODY') return;
      switch (e.key) {
        case 'ArrowLeft':
          onLeft();
          break;
        case 'ArrowRight':
          onRight();
          break;
      }
    });
  }

  render() {
    return false;
  }
}

export default Keyboard;
