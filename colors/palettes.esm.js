const palettes = [{"name":"Some","colors":["#3333ff","#fc7f95","#fbfc6e","#55f9fc","#fefefc"]},{"name":"From David","colors":[]},{"name":"Pigments","colors":[]},{"name":"Ellsworth Kelly","colors":["#f13401","#0769ce","#f1d93c","#11804b"]},{"name":"Warm","colors":["#7c203a","#f85959","#ff9f68","#feff89","#f8b195","#f67280","#c06c84","#355c7d","#6c567b"]},{"name":"Bilbao","colors":["#fad5dc","#05323d","#f6c4b1","#d4db6e","#eb7574","#55b867","#d7c84a","#33b2a2","#cd202f"]},{"name":"Figma","colors":["#201c1d","#5f6ce0","#ffad72","#bafc9d","#bf8dff","#2a1f38","#ffb06b","#382718","#fc9de7","#382333","#d4ffff","#ffffff","#fff3d4"]},{"name":"Kaleidoscopic","colors":["#064ed6","#3067eb","#f5818c","#111a38","#e1a9f5","#e9eef5","#f45c67","#f5d34d","#d4dae4","#14cbdf","#f4bcd6","#f58eed"]}]

let localPalettes = palettes;

const colorPalettes = {
  palettes: localPalettes,
  get: (nameOrIndex) => {
    if (typeof nameOrIndex === 'number') {
      return localPalettes[nameOrIndex];
    }
    return localPalettes.find(p => p.name === nameOrIndex);
  },
  random: (nbr) => {
    if (nbr && typeof nbr != 'number' || nbr > 1 || nbr < 0) {
      throw new Error('random() only accepts a number between 0 and 1');
    }

    return localPalettes[
      Math.floor(
        (nbr || Math.random()) * localPalettes.length
      )
    ];
  },
  addPalettes: (newPalettes) => {
    localPalettes = palettes.concat(newPalettes);
  }
};

export {colorPalettes};